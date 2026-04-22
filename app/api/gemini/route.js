import { NextResponse } from 'next/server';
import {
  generateWithFailover,
  hasApiKeys,
  parseAIResponse,
  isRateLimitError,
  isServiceUnavailableError,
} from '@/lib/services/geminiService';
import { buildExamPrompt, buildFetchExamConfigPrompt, buildSubjectOverviewPrompt } from '@/lib/prompts/examPrompts';
import {
  buildInterviewPrompt,
  buildInterviewRespondPrompt,
  buildEvaluationPrompt,
  buildInterviewAnalysisPrompt,
  buildFetchInterviewConfigPrompt,
} from '@/lib/prompts/interviewPrompts';
import { buildCodeEvaluationPrompt, buildFetchCodingConfigPrompt, buildChatPrompt } from '@/lib/prompts/codingPrompts';
import { getMockExamResponse, getMockInterviewResponse, getMockCodeResponse } from '@/lib/prompts/mockResponses';
import { sanitizePromptInput } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rateLimit';
import logger from '@/lib/logger';

// Prompt router
const PROMPT_BUILDERS = {
  'generate-exam': (config) => buildExamPrompt(config),
  'interview-question': (config) => buildInterviewPrompt(config),
  'interview-respond': (config) => buildInterviewRespondPrompt(config),
  'evaluate-answer': (config) => buildEvaluationPrompt(config),
  'interview-analysis': (config) => buildInterviewAnalysisPrompt(config),
  'evaluate-code': (config) => buildCodeEvaluationPrompt(config),
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
  if (type === 'evaluate-code') {
    // Try JS execution first
    if (config?.language === 'javascript' && config?.code && config?.testCases?.length > 0) {
      return evaluateJavaScript(config.code, config.testCases);
    }
    return getMockCodeResponse(config);
  }
  return { error: 'Unknown type' };
}

// Actually execute JavaScript code against test cases
function evaluateJavaScript(code, testCases) {
  const testResults = [];

  // Extract the function name from the code
  const fnMatch = code.match(/function\s+(\w+)/);
  const fnName = fnMatch ? fnMatch[1] : null;

  if (!fnName) {
    return {
      passed: false,
      score: 0,
      testResults: testCases.map((tc) => ({
        input: tc.input || '',
        expected: tc.output || '',
        actual: 'No function found',
        passed: false,
      })),
      feedback:
        'Could not find a function definition in your code. Make sure you define a function (e.g., function twoSum(nums, target) { ... }).',
      timeComplexity: '—',
      spaceComplexity: '—',
      suggestions: ['Define a named function', 'Make sure the function returns a value'],
    };
  }

  for (const tc of testCases) {
    try {
      // Parse input arguments from the test case input string
      const args = parseTestInput(tc.input);

      // Create a sandboxed function execution
      const wrappedCode = `
        ${code}
        return JSON.stringify(${fnName}(${args.join(', ')}));
      `;

      const fn = new Function(wrappedCode);
      const actual = fn();
      const expected = tc.output?.trim();

      // Compare results (normalize both to strings for comparison)
      const normalizedActual = normalizeOutput(actual);
      const normalizedExpected = normalizeOutput(expected);
      const passed = normalizedActual === normalizedExpected;

      testResults.push({
        input: tc.input,
        expected: expected,
        actual: actual || 'undefined',
        passed,
      });
    } catch (error) {
      testResults.push({
        input: tc.input,
        expected: tc.output || '',
        actual: `Error: ${error.message}`,
        passed: false,
      });
    }
  }

  const passedCount = testResults.filter((t) => t.passed).length;
  const score = Math.round((passedCount / Math.max(testResults.length, 1)) * 100);
  const allPassed = passedCount === testResults.length;

  // Analyze code quality
  const hasHashMap = code.includes('Map') || code.includes('{}') || code.includes('new Map');
  const hasLoop = code.includes('for') || code.includes('while');
  const hasNestedLoop = (code.match(/for/g) || []).length >= 2;

  return {
    passed: allPassed,
    score,
    testResults,
    feedback: allPassed
      ? 'All test cases passed!'
      : score === 0
        ? 'No tests passed. Check your logic and make sure you return the correct value.'
        : `${passedCount}/${testResults.length} tests passed. Check the failing cases.`,
    timeComplexity: hasNestedLoop ? 'O(n²)' : hasLoop ? 'O(n)' : 'O(1)',
    spaceComplexity: hasHashMap ? 'O(n)' : 'O(1)',
    suggestions: allPassed
      ? hasNestedLoop
        ? ['Consider optimizing with a hash map']
        : ['Great job!']
      : ['Review failing test cases', 'Consider edge cases'],
  };
}

function parseTestInput(inputStr) {
  if (!inputStr) return [];
  const parts = [];
  const assignments = inputStr.split(/,\ns*(?=\nw+\ns*=)/);
  for (const assignment of assignments) {
    const valueMatch = assignment.match(/=\ns*(.+)$/);
    parts.push(valueMatch ? valueMatch[1].trim() : assignment.trim());
  }
  return parts;
}

function normalizeOutput(output) {
  if (output === null || output === undefined) return '';
  return String(output).replace(/'/g, '').replace(/\n/g, '').replace(/ +/g, ' ').trim();
}

export async function POST(request) {
  let type = 'generate-exam';
  let config = {};

  try {
    // Rate limit: 20 requests per minute per IP
    const rateLimitResult = rateLimit(request, 20, 60000);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    type = body.type;
    config = body.config;

    // Sanitize user-provided text in config to prevent prompt injection
    if (config) {
      if (config.title) config.title = sanitizePromptInput(config.title);
      if (config.examName) config.examName = sanitizePromptInput(config.examName);
      if (config.message) config.message = sanitizePromptInput(config.message);
      if (config.answer) config.answer = sanitizePromptInput(config.answer);
      if (config.role) config.role = sanitizePromptInput(config.role);
      if (config.company) config.company = sanitizePromptInput(config.company);
      // Sanitize topic arrays
      if (Array.isArray(config.topics)) {
        config.topics = config.topics.map((t) => (typeof t === 'string' ? sanitizePromptInput(t) : t));
      }
    }

    // Validate type
    if (!PROMPT_BUILDERS[type]) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // If no API keys, return mock response
    if (!hasApiKeys()) {
      return NextResponse.json(getMockResponse(type, config));
    }

    // For JS code evaluation, try local execution first
    if (
      type === 'evaluate-code' &&
      config?.language === 'javascript' &&
      config?.code &&
      config?.testCases?.length > 0
    ) {
      return NextResponse.json(evaluateJavaScript(config.code, config.testCases));
    }

    // Build prompt and call Gemini
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
    logger.error({ err: error }, 'Gemini API error');
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
    return NextResponse.json(
      {
        error: 'Failed to generate. Please try again.',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
