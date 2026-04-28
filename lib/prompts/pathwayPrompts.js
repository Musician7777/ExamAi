import { sanitizePromptInput } from '@/lib/sanitize';

/**
 * Build the Gemini prompt for pathway generation.
 *
 * The AI is asked to enrich / validate the user's input and return a structured
 * JSON object with exam structure details for scheduling practice tests.
 */
export function buildPathwayPrompt(config) {
  const examName = sanitizePromptInput(config.examName || 'General Exam');
  const goalType = config.goalType || 'custom';
  const stages = (config.stages || []).map((s) => s.name || s).join(', ');
  const subjects = (config.subjects || []).map((s) => s.name || s).join(', ');
  const questionTypes = (config.questionTypes || []).join(', ');
  const totalDuration = config.totalDuration || 30;
  const currentLevel = config.currentLevel || 'beginner';

  return `You are an expert exam preparation strategist.

The user wants to prepare for: "${examName}"
Goal type: ${goalType}
${stages ? `User-specified stages: ${stages}` : 'No stages specified — infer them from the exam name.'}
${subjects ? `User-specified subjects: ${subjects}` : 'No subjects specified — infer them from the exam name.'}
${questionTypes ? `Question formats: ${questionTypes}` : 'No question formats specified — infer them.'}
Total preparation time: ${totalDuration} days
Current level: ${currentLevel}

This is a practice test platform. The user needs ONLY practice exams — no study material, no theory, no revision notes. 
Analyze this exam and return a JSON object with the following structure:

{
  "examName": "string — validated/corrected exam name",
  "examType": "string — category like 'competitive', 'interview', 'coding', 'academic', 'language'",
  "stages": [
    {
      "name": "string — stage name (e.g. Prelims, Mains, Interview)",
      "objective": "string — what this stage tests",
      "practiceFocus": ["string — key test focus areas"]
    }
  ],
  "subjects": [
    {
      "name": "string — subject name",
      "difficultyLevel": "easy | medium | hard",
      "suggestedWeight": "number 1-5 — how many practice tests this subject needs"
    }
  ],
  "questionTypes": ["string — question formats used in this exam"],
  "strategySummary": "string — a 2-3 sentence test practice strategy",
  "inferredFields": ["string — list of fields you inferred rather than received from user"],
  "tips": ["string — 3-5 actionable exam tips focused on test-taking strategy"]
}

IMPORTANT:
- This is a TEST-ONLY platform. No study plans, no theory, no learning resources.
- Focus on practice exams: easy/medium/hard tests, mock tests, timed tests, subject tests.
- If the exam name is recognizable, provide accurate real-world structure.
- If unrecognizable, provide a reasonable general structure and mark all fields as inferred.
- Always return valid JSON. No markdown, no explanation outside the JSON.
- Keep stage count between 1-5 and subject count between 2-8.`;
}
