import { NextResponse } from 'next/server';
import {
  generateWithFailover,
  hasApiKeys,
  parseAIResponse,
  isRateLimitError,
  isServiceUnavailableError,
} from '@/lib/services/geminiService';
import { buildExamPrompt, buildFetchExamConfigPrompt, buildSubjectOverviewPrompt } from '@/lib/prompts/examPrompts';
import { buildPathwayPrompt } from '@/lib/prompts/pathwayPrompts';
import {
  buildInterviewPrompt,
  buildInterviewRespondPrompt,
  buildEvaluationPrompt,
  buildInterviewAnalysisPrompt,
  buildFetchInterviewConfigPrompt,
} from '@/lib/prompts/interviewPrompts';
import { buildCodeAnalysisPrompt, buildFetchCodingConfigPrompt, buildChatPrompt } from '@/lib/prompts/codingPrompts';
import {
  getMockExamResponse,
  getMockInterviewResponse,
  getMockCodeAnalysisResponse,
} from '@/lib/prompts/mockResponses';
import { sanitizePromptInput } from '@/lib/sanitize';
import { apiRoute } from '@/lib/apiHandler';
import { geminiPromptSchema } from '@/lib/validation';

// Prompt router
const PROMPT_BUILDERS = {
  'generate-exam': (config) => buildExamPrompt(config),
  'generate-pathway': (config) => buildPathwayPrompt(config),
  'interview-question': (config) => buildInterviewPrompt(config),
  'interview-respond': (config) => buildInterviewRespondPrompt(config),
  'evaluate-answer': (config) => buildEvaluationPrompt(config),
  'interview-analysis': (config) => buildInterviewAnalysisPrompt(config),
  'analyze-code': (config) => buildCodeAnalysisPrompt(config),
  'fetch-exam-config': (config) => buildFetchExamConfigPrompt(config),
  'fetch-subject-overview': (config) => buildSubjectOverviewPrompt(config),
  'fetch-interview-config': (config) => buildFetchInterviewConfigPrompt(config),
  'fetch-coding-config': (config) => buildFetchCodingConfigPrompt(config),
  chat: (config) => buildChatPrompt(config),
};

// Mock response router
function getMockResponse(type, config) {
  if (type === 'generate-exam') return getMockExamResponse(config);
  if (type.startsWith('interview') || type === 'evaluate-answer') return getMockInterviewResponse(type, config);
  if (type === 'analyze-code') return getMockCodeAnalysisResponse(config);
  return { error: 'Unknown type' };
}

export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    rateLimit: { max: 20, windowMs: 60000 },
    schema: geminiPromptSchema,
    errorMessage: 'Failed to generate. Please try again.',
  },
  async (request, { body }) => {
    const { type, config } = body;

    // Sanitize user-provided text in config to prevent prompt injection
    if (config) {
      if (config.title) config.title = sanitizePromptInput(config.title);
      if (config.examName) config.examName = sanitizePromptInput(config.examName);
      if (config.message) config.message = sanitizePromptInput(config.message);
      if (config.answer) config.answer = sanitizePromptInput(config.answer);
      if (config.role) config.role = sanitizePromptInput(config.role);
      if (config.company) config.company = sanitizePromptInput(config.company);
      if (Array.isArray(config.topics)) {
        config.topics = config.topics.map((t) => (typeof t === 'string' ? sanitizePromptInput(t) : t));
      }
    }

    // If no API keys, return mock response
    if (!hasApiKeys()) {
      return NextResponse.json(getMockResponse(type, config));
    }

    // Build prompt and call Gemini
    try {
      const prompt = PROMPT_BUILDERS[type](config);
      const result = await generateWithFailover(prompt);

      if (!result) {
        return NextResponse.json(getMockResponse(type, config));
      }

      const response = await result.response;
      const text = response.text();
      const parsed = parseAIResponse(text);

      return NextResponse.json(parsed);
    } catch (error) {
      // Gemini-specific error handling
      if (isRateLimitError(error)) {
        return NextResponse.json(
          {
            error: 'All API keys are rate limited. Please wait 30-60 seconds and try again.',
            isRateLimited: true,
          },
          { status: 429 }
        );
      }
      if (isServiceUnavailableError(error)) {
        if (type === 'interview-question' || type === 'interview-respond' || type === 'evaluate-answer') {
          return NextResponse.json(getMockResponse(type, config));
        }
        return NextResponse.json(
          {
            error: 'AI provider is temporarily unavailable. Please try again shortly.',
            isServiceUnavailable: true,
          },
          { status: 503 }
        );
      }
      // Re-throw to let apiRoute's generic error handler deal with it
      throw error;
    }
  }
);
