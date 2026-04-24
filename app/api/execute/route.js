import { NextResponse } from 'next/server';
import { executeCode, runTestCases, getSupportedLanguages } from '@/lib/services/codeExecutionService';
import { apiRoute } from '@/lib/apiHandler';
import { codeExecuteSchema } from '@/lib/validation';

export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    rateLimit: { max: 10, windowMs: 60000 },
    schema: codeExecuteSchema,
    sanitizeErrors: true,
    errorMessage: 'Execution failed',
  },
  async (request, { body }) => {
    const { code, language, stdin, testCases, timeout } = body;

    // If test cases provided, run against them
    if (testCases && testCases.length > 0) {
      const result = await runTestCases(code, language, testCases);
      return NextResponse.json(result);
    }

    // Otherwise, just execute
    const result = await executeCode(code, language, stdin || '', timeout || 10000);
    return NextResponse.json(result);
  }
);

export async function GET() {
  return NextResponse.json({
    languages: getSupportedLanguages(),
    message: 'Supported languages for code execution',
  });
}
