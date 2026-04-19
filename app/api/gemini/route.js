import { NextResponse } from 'next/server';
import {
  generateWithFailover,
  hasApiKeys,
  parseAIResponse,
  isRateLimitError,
  isServiceUnavailableError,
} from '@/lib/services/geminiService';
import { buildExamPrompt, buildFetchExamConfigPrompt } from '@/lib/prompts/examPrompts';
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

// JS code evaluator (kept inline since it's runtime logic, not a prompt)
function evaluateJavaScript(code, testCases) {
  const testResults = [];
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
      feedback: 'Could not find a function definition in your code.',
      timeComplexity: '—',
      spaceComplexity: '—',
      suggestions: ['Define a named function'],
    };
  }

  for (const tc of testCases) {
    try {
      const args = parseTestInput(tc.input);
      const wrappedCode = `${code}\nreturn JSON.stringify(${fnName}(${args.join(', ')}));`;
      const fn = new Function(wrappedCode);
      const actual = fn();
      const expected = tc.output?.trim();
      const passed = normalizeOutput(actual) === normalizeOutput(expected);
      testResults.push({ input: tc.input, expected, actual: actual || 'undefined', passed });
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
  const hasHashMap = code.includes('Map') || code.includes('new Map');
  const hasNestedLoop = (code.match(/for/g) || []).length >= 2;
  const hasLoop = code.includes('for') || code.includes('while');

  return {
    passed: passedCount === testResults.length,
    score,
    testResults,
    feedback:
      passedCount === testResults.length
        ? 'All test cases passed!'
        : score === 0
          ? 'No tests passed.'
          : `${passedCount}/${testResults.length} tests passed.`,
    timeComplexity: hasNestedLoop ? 'O(n²)' : hasLoop ? 'O(n)' : 'O(1)',
    spaceComplexity: hasHashMap ? 'O(n)' : 'O(1)',
    suggestions:
      passedCount === testResults.length
        ? hasNestedLoop
          ? ['Consider optimizing with a hash map']
          : ['Great job!']
        : ['Check return value format'],
  };
}

function parseTestInput(inputStr) {
  if (!inputStr) return [];
  const parts = [];
  const assignments = inputStr.split(/,\s*(?=\w+\s*=)/);
  for (const assignment of assignments) {
    const valueMatch = assignment.match(/=\s*(.+)$/);
    parts.push(valueMatch ? valueMatch[1].trim() : assignment.trim());
  }
  return parts;
}

function normalizeOutput(output) {
  if (output === null || output === undefined) return '';
  return String(output).replace(/"/g, '').replace(/'/g, '').replace(/\s+/g, '').trim();
}

// Prompt router
const PROMPT_BUILDERS = {
  'generate-exam': (config) => buildExamPrompt(config),
  'interview-question': (config) => buildInterviewPrompt(config),
  'interview-respond': (config) => buildInterviewRespondPrompt(config),
  'evaluate-answer': (config) => buildEvaluationPrompt(config),
  'interview-analysis': (config) => buildInterviewAnalysisPrompt(config),
  'evaluate-code': (config) => buildCodeEvaluationPrompt(config),
  'fetch-exam-config': (config) => buildFetchExamConfigPrompt(config),
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
    console.error('Gemini API error:', error);
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
