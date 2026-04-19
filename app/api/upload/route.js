import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { parsePDF, analyzeExamPattern, buildPatternReplicationPrompt } from '@/lib/services/pdfParserService';
import { generateWithFailover, hasApiKeys, parseAIResponse } from '@/lib/services/geminiService';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const totalQuestions = parseInt(formData.get('totalQuestions') || '20');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    // Parse the PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parsePDF(buffer);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Failed to parse PDF',
          details: parsed.error,
        },
        { status: 422 }
      );
    }

    if (parsed.text.trim().length < 50) {
      return NextResponse.json(
        {
          error: 'Could not extract sufficient text from the PDF. The file may be image-based or empty.',
        },
        { status: 422 }
      );
    }

    // Analyze the exam pattern
    const analysis = analyzeExamPattern(parsed.text);

    // If no API keys, return analysis only
    if (!hasApiKeys()) {
      return NextResponse.json({
        analysis,
        pageCount: parsed.pageCount,
        textLength: parsed.text.length,
        message: 'PDF parsed successfully. No API key available for exam generation.',
      });
    }

    // Generate exam from pattern
    const prompt = buildPatternReplicationPrompt(analysis, totalQuestions);
    const result = await generateWithFailover(prompt);

    if (!result) {
      return NextResponse.json({
        analysis,
        pageCount: parsed.pageCount,
        message: 'PDF parsed but exam generation failed.',
      });
    }

    const response = await result.response;
    const text = response.text();
    const exam = parseAIResponse(text);

    return NextResponse.json({
      exam,
      analysis: {
        pageCount: parsed.pageCount,
        detectedSections: analysis.sections,
        detectedQuestions: analysis.questionCount,
        patterns: analysis.patterns,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Upload error');
    return NextResponse.json(
      {
        error: 'Failed to process file',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
