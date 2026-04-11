import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateWithFailover, hasApiKeys, parseAIResponse } from '@/lib/services/geminiService';
import { buildChatPrompt } from '@/lib/prompts/codingPrompts';

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, history, context } = await request.json();

        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!hasApiKeys()) {
            return NextResponse.json({
                response: "I'm currently in demo mode without AI capabilities. Please configure your Gemini API key to use the study assistant.",
                suggestedTopics: [],
                difficulty: 'medium',
                hasCode: false,
            });
        }

        const prompt = buildChatPrompt({ message, history: history || [], context: context || {} });
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
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({
            error: 'Failed to process message',
            details: error?.message,
        }, { status: 500 });
    }
}
