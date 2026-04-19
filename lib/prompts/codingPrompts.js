/**
 * Coding Evaluation Prompt Builders
 * Extracted from the monolithic gemini route
 */

export function buildCodeEvaluationPrompt(config) {
  return `Evaluate this code solution:

Problem: ${config.problem}
Language: ${config.language}
Code:
\`\`\`
${config.code}
\`\`\`

Test Cases: ${JSON.stringify(config.testCases || [])}

Return a JSON:
{
  "passed": boolean,
  "score": number (0-100),
  "testResults": [{"input": "", "expected": "", "actual": "", "passed": true}],
  "feedback": "Feedback",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "suggestions": ["improvement 1"]
}`;
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
