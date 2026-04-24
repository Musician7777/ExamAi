import { NextResponse } from 'next/server';
import { generateWithFailover, hasApiKeys, parseAIResponse } from '@/lib/services/geminiService';
import { buildChatPrompt } from '@/lib/prompts/codingPrompts';
import { sanitizePromptInput } from '@/lib/sanitize';
import { apiRoute } from '@/lib/apiHandler';
import { chatSchema } from '@/lib/validation';

export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    rateLimit: { max: 30, windowMs: 60000 },
    schema: chatSchema,
    sanitizeErrors: true,
    errorMessage: 'Failed to process message',
  },
  async (request, { body }) => {
    const { message, history, context } = body;

    // Sanitize user message to prevent prompt injection
    const sanitizedMessage = sanitizePromptInput(message);
    if (!sanitizedMessage || sanitizedMessage.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!hasApiKeys()) {
      return NextResponse.json({
        response:
          "I'm currently in demo mode without AI capabilities. Please configure your Gemini API key to use the study assistant.",
        suggestedTopics: [],
        difficulty: 'medium',
        hasCode: false,
      });
    }

    const prompt = buildChatPrompt({ message: sanitizedMessage, history: history || [], context: context || {} });
    const result = await generateWithFailover(prompt);

    if (!result) {
      return NextResponse.json({
        response: "I'm having trouble connecting right now. Please try again in a moment.",
        suggestedTopics: [],
        difficulty: 'medium',
        hasCode: false,
      });
    }

    const response = await result.response;
    const text = response.text();
    const parsed = parseAIResponse(text);

    return NextResponse.json(parsed);
  }
);
