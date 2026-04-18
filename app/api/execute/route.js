import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { executeCode, runTestCases, getSupportedLanguages } from '@/lib/services/codeExecutionService';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit: 10 code executions per minute per IP
        const rateLimitResult = rateLimit(request, 10, 60000);
        if (rateLimitResult) return rateLimitResult;

        const { code, language, stdin, testCases, timeout } = await request.json();

        if (!code || !language) {
            return NextResponse.json({ error: 'Code and language are required' }, { status: 400 });
        }

        // If test cases provided, run against them
        if (testCases && testCases.length > 0) {
            const result = await runTestCases(code, language, testCases);
            return NextResponse.json(result);
        }

        // Otherwise, just execute
        const result = await executeCode(code, language, stdin || '', timeout || 10000);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Code execution error:', error);
        return NextResponse.json({
            error: 'Execution failed',
            details: error?.message,
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        languages: getSupportedLanguages(),
        message: 'Supported languages for code execution',
    });
}
