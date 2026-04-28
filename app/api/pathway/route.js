import { NextResponse } from 'next/server';
import Pathway from '@/models/Pathway';
import { apiRoute } from '@/lib/apiHandler';
import { pathwayCreateSchema, pathwayUpdateSchema } from '@/lib/validation';
import { generatePathway, inferExamStructure } from '@/lib/pathwayEngine';
import { generateWithFailover, hasApiKeys, parseAIResponse } from '@/lib/services/geminiService';
import { buildPathwayPrompt } from '@/lib/prompts/pathwayPrompts';
import logger from '@/lib/logger';

/**
 * GET /api/pathway — fetch active pathway for current user
 */
export const GET = apiRoute(
  {
    requireAuth: true,
    connectDB: true,
    errorMessage: 'Failed to fetch pathway',
  },
  async (request, { session }) => {
    const userId = session.user.email;
    const pathway = await Pathway.findOne({ userId, isActive: true }).lean();
    return NextResponse.json({ pathway: pathway || null });
  }
);

/**
 * POST /api/pathway — generate a new pathway
 */
export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: pathwayCreateSchema,
    connectDB: true,
    errorMessage: 'Failed to generate pathway',
  },
  async (request, { session, body }) => {
    const userId = session.user.email;

    // Deactivate existing active pathways if regenerating
    if (body.regenerate) {
      await Pathway.updateMany({ userId, isActive: true }, { isActive: false });
    }

    // Check for existing active pathway (unless regenerating)
    if (!body.regenerate) {
      const existing = await Pathway.findOne({ userId, isActive: true }).lean();
      if (existing) {
        return NextResponse.json(
          { error: 'An active pathway already exists. Set regenerate: true to replace it.' },
          { status: 409 }
        );
      }
    }

    // Try to enrich user input with AI
    let aiData = null;
    try {
      if (hasApiKeys()) {
        const prompt = buildPathwayPrompt(body);
        const result = await generateWithFailover(prompt, { skipCache: true });
        if (result) {
          const response = await result.response;
          const text = response.text();
          aiData = parseAIResponse(text);
        }
      }
    } catch (err) {
      logger.warn({ err }, 'AI enrichment failed for pathway, using local inference');
    }

    // Merge user input with AI enrichment and local inference
    const localInference = inferExamStructure(body.examName);
    const inferredFields = [];

    // Determine stages
    let stages = body.stages || [];
    if (stages.length === 0) {
      if (aiData?.stages?.length) {
        stages = aiData.stages;
        inferredFields.push('stages');
      } else if (localInference?.stages?.length) {
        stages = localInference.stages;
        inferredFields.push('stages');
      } else {
        stages = [{ name: 'Preparation', objective: 'Complete preparation', practiceFocus: ['practice', 'revision'] }];
        inferredFields.push('stages');
      }
    }

    // Determine subjects
    let subjects = body.subjects || [];
    if (subjects.length === 0) {
      if (aiData?.subjects?.length) {
        subjects = aiData.subjects.map((s) => ({
          name: s.name,
          strengthLevel: 'average',
          difficultyLevel: s.difficultyLevel || 'medium',
        }));
        inferredFields.push('subjects');
      } else if (localInference?.subjects?.length) {
        subjects = localInference.subjects.map((name) => ({
          name,
          strengthLevel: 'average',
          difficultyLevel: 'medium',
        }));
        inferredFields.push('subjects');
      } else {
        subjects = [{ name: 'General', strengthLevel: 'average', difficultyLevel: 'medium' }];
        inferredFields.push('subjects');
      }
    }

    // Determine question types
    let questionTypes = body.questionTypes || [];
    if (questionTypes.length === 0) {
      if (aiData?.questionTypes?.length) {
        questionTypes = aiData.questionTypes;
        inferredFields.push('questionTypes');
      } else if (localInference?.questionTypes?.length) {
        questionTypes = localInference.questionTypes;
        inferredFields.push('questionTypes');
      } else {
        questionTypes = ['MCQ'];
        inferredFields.push('questionTypes');
      }
    }

    // Parse dates
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    let endDate = body.endDate ? new Date(body.endDate) : null;
    const totalDuration =
      body.totalDuration || (endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 30);
    if (!endDate) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalDuration);
    }

    // Generate the full pathway
    const pathwayInput = {
      examName: aiData?.examName || body.examName,
      examType: aiData?.examType || body.goalType || 'custom',
      goalType: body.goalType || 'custom',
      stages,
      subjects,
      questionTypes,
      totalDuration,
      dailyAvailability: body.dailyAvailability || 2,
      preferredDays: body.preferredDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      startDate,
      currentLevel: body.currentLevel || 'beginner',
      testPreferences: body.testPreferences || {},
      constraints: body.constraints || [],
    };

    const generatedPathway = generatePathway(pathwayInput);

    // Save to database
    const pathway = await Pathway.create({
      userId,
      ...generatedPathway,
      endDate,
      inferredFields: [...inferredFields, ...(aiData?.inferredFields || [])],
      isActive: true,
    });

    return NextResponse.json(
      {
        pathway: pathway.toObject(),
        tips: aiData?.tips || [],
        message: 'Pathway generated successfully',
      },
      { status: 201 }
    );
  }
);

/**
 * PUT /api/pathway — update pathway (task status, regenerate, settings)
 */
export const PUT = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: pathwayUpdateSchema,
    connectDB: true,
    errorMessage: 'Failed to update pathway',
  },
  async (request, { session, body }) => {
    const userId = session.user.email;
    const { action, taskId, status, settings } = body;

    const pathway = await Pathway.findOne({ userId, isActive: true });
    if (!pathway) {
      return NextResponse.json({ error: 'No active pathway found' }, { status: 404 });
    }

    if (action === 'update_task') {
      if (!taskId || !status) {
        return NextResponse.json({ error: 'taskId and status are required' }, { status: 400 });
      }

      const task = pathway.schedule.id(taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      task.completionStatus = status;

      // Recalculate progress
      pathway.completedTasks = pathway.schedule.filter((t) => t.completionStatus === 'completed').length;
      pathway.totalTasks = pathway.schedule.filter((t) => t.type !== 'rest').length;

      await pathway.save();
      return NextResponse.json({ pathway: pathway.toObject(), message: 'Task updated' });
    }

    if (action === 'update_settings') {
      if (settings) {
        Object.assign(pathway, settings);
        await pathway.save();
      }
      return NextResponse.json({ pathway: pathway.toObject(), message: 'Settings updated' });
    }

    if (action === 'regenerate') {
      pathway.isActive = false;
      await pathway.save();
      return NextResponse.json({ message: 'Pathway deactivated. Create a new one via POST.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
);

/**
 * DELETE /api/pathway — deactivate current pathway
 */
export const DELETE = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    connectDB: true,
    errorMessage: 'Failed to delete pathway',
  },
  async (request, { session }) => {
    const userId = session.user.email;
    await Pathway.updateMany({ userId, isActive: true }, { isActive: false });
    return NextResponse.json({ message: 'Pathway archived' });
  }
);
