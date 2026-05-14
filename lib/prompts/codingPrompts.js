/**
 * Coding Prompt Builders
 *
 * IMPORTANT — Design contract:
 *   "evaluate-code" / AI-based test-case grading has been intentionally REMOVED.
 *   Test-case pass/fail is determined exclusively by real code execution (Piston API).
 *   AI is only used for post-execution ANALYSIS: feedback, complexity, suggestions.
 */

/**
 * Build a prompt that asks the AI to analyse code quality and complexity AFTER
 * the real execution results are already known.  The AI never decides pass/fail.
 *
 * @param {Object} config
 * @param {string} config.problem        - Problem description
 * @param {string} config.language       - Programming language
 * @param {string} config.code           - User's submitted code
 * @param {boolean} config.passed        - Whether all test cases passed (from Piston)
 * @param {number}  config.score         - 0-100 score (from Piston)
 * @param {Array}   config.testResults   - Real execution results from Piston
 */
export function buildCodeAnalysisPrompt(config) {
  const { problem, language, code, passed, score, testResults = [] } = config;

  const resultsSummary = testResults
    .map(
      (t, i) =>
        `Test ${i + 1}: ${t.passed ? 'PASSED' : 'FAILED'} | Input: ${t.input} | Expected: ${t.expected} | Got: ${t.actual}`
    )
    .join('\n');

  return `You are a senior software engineer reviewing a coding submission. The code has ALREADY been executed against test cases by a real code runner. DO NOT re-evaluate whether tests pass or fail — that has already been determined.

Problem: ${problem}
Language: ${language}

Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Real Execution Results (already determined — do NOT change these):
- Overall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}
- Score: ${score}/100
${resultsSummary}

Your job: Analyse the CODE QUALITY only. Return a JSON object:
{
  "feedback": "2-3 sentence review of the approach, readability, and correctness",
  "timeComplexity": "O(...) with brief explanation",
  "spaceComplexity": "O(...) with brief explanation",
  "suggestions": ["specific improvement 1", "specific improvement 2"]
}

Rules:
- Do NOT override or question the pass/fail results above
- Keep feedback concise and actionable (max 3 sentences)
- suggestions array: 1-3 items, empty array [] if the solution is optimal
- Return ONLY the JSON object, no markdown wrapper`;
}

export function buildFetchCodingConfigPrompt(config) {
  return `You are a coding interview and competitive programming expert. The user wants coding practice for: "${config.examName}"

Generate a set of 6-10 coding problems appropriate for this context. Mix difficulties.

Return ONLY a JSON object:
{
  "title": "Practice set title",
  "emoji": "A single relevant emoji",
  "description": "One-line description (max 60 chars)",
  "problems": [
    {
      "id": 1,
      "title": "Problem Title",
      "tags": ["Array", "Hash Map"],
      "difficulty": "easy" or "medium" or "hard"
    }
  ],
  "recognized": true/false
}`;
}

export function buildChatPrompt(config) {
  const { message, history = [], context = {} } = config;

  const contextStr = context.currentTopic
    ? `\nCURRENT STUDY CONTEXT:\n- Topic: ${context.currentTopic}\n- Subject: ${context.currentSubject || 'General'}\n- Difficulty: ${context.difficulty || 'Medium'}`
    : '';

  const historyStr =
    history.length > 0
      ? `\nCONVERSATION HISTORY:\n${history
          .slice(-10)
          .map((h) => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.text}`)
          .join('\n')}`
      : '';

  return `You are an expert AI study assistant for ExamAI, an exam preparation platform. You help students understand concepts, solve problems, and prepare for exams and interviews.
${contextStr}
${historyStr}

Student's message: "${message}"

RULES:
1. Be helpful, clear, and educational
2. Use examples when explaining concepts
3. If asked about a problem, walk through the solution step by step
4. If the student seems confused, simplify your explanation
5. Be encouraging but honest about areas that need improvement
6. Reference the current study context if relevant
7. Keep responses concise but thorough

Return ONLY a JSON object:
{
  "response": "Your helpful response here",
  "suggestedTopics": ["Related topic 1", "Related topic 2"],
  "difficulty": "easy|medium|hard",
  "hasCode": false
}`;
}
