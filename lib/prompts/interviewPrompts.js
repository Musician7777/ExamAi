/**
 * Interview Prompt Builders
 * Extracted from the monolithic gemini route
 */

export function buildInterviewPrompt(config) {
    const role = config.role || config.interviewType || 'Software Engineer';
    const company = config.company ? `at ${config.company}` : '';
    const topics = config.topics && config.topics.length > 0 ? config.topics.join(', ') : 'General';
    const difficulty = config.difficulty || 'Medium';
    const tone = config.tone || 'Professional';
    const questionNumber = (config.history?.length || 0) + 1;
    const totalQuestions = config.questionCount || 10;

    return `You are a senior interviewer conducting a realistic ${config.interviewType || 'technical'} interview for the role of ${role} ${company}.

INTERVIEW CONTEXT:
- Role: ${role} ${company}
- Interview Type: ${config.interviewType || 'technical'}
- Topics to Cover: ${topics}
- Difficulty Level: ${difficulty}
- Tone: ${tone}
- This is Question ${questionNumber} of ${totalQuestions}

PREVIOUS QUESTIONS ASKED (do NOT repeat or ask similar questions):
${config.history && config.history.length > 0 ? config.history.map((q, i) => `Q${i+1}: ${q}`).join('\n') : 'None — this is the first question.'}

RULES:
1. Ask ONE clear, specific question appropriate for the role and difficulty level
2. Do NOT repeat or rephrase any previous question
3. The question should be realistic
4. Keep the question concise — 1-3 sentences maximum
5. Start easy and progressively increase difficulty

Return ONLY a JSON object:
{
  "question": "The interview question",
  "expectedPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "difficulty": "easy|medium|hard",
  "topic": "The specific topic this question covers"
}`;
}

export function buildInterviewRespondPrompt(config) {
    const role = config.role || 'Software Engineer';
    const company = config.company ? `at ${config.company}` : '';
    const topics = config.topics && config.topics.length > 0 ? config.topics.join(', ') : 'General';
    const questionNumber = (config.questionNumber || 1) + 1;
    const totalQuestions = config.questionCount || 10;

    return `You are a senior interviewer conducting a ${config.interviewType || 'technical'} interview for ${role} ${company}.

You just asked: "${config.question}"
Expected key points: ${JSON.stringify(config.expectedPoints || [])}

The candidate answered: "${config.answer}"

Do TWO things:

1. EVALUATE the answer:
   - Score 0-10 based on accuracy, depth, and clarity
   - Give brief, constructive feedback (2-3 sentences max)

2. ASK THE NEXT QUESTION (Question ${questionNumber} of ${totalQuestions}):
   - Topics to cover: ${topics}
   - Difficulty: ${config.difficulty || 'Medium'}
   - Do NOT repeat any previous question
   - Previous questions: ${config.history?.map((q, i) => `Q${i+1}: ${q}`).join('; ') || 'None'}

Return ONLY a JSON object:
{
  "score": 7,
  "feedback": "Brief evaluation",
  "strengths": ["strength 1"],
  "improvements": ["area to improve 1"],
  "knowledgeScore": 7,
  "communicationScore": 8,
  "confidenceScore": 7,
  "nextQuestion": "The next interview question",
  "nextExpectedPoints": ["Key point 1", "Key point 2"],
  "nextDifficulty": "medium",
  "nextTopic": "Topic name"
}`;
}

export function buildEvaluationPrompt(config) {
    return `Evaluate this interview answer:

Question: ${config.question}
Answer: ${config.answer}
Expected Points: ${JSON.stringify(config.expectedPoints || [])}

Return a JSON evaluation:
{
  "score": number (0-10),
  "feedback": "Detailed feedback",
  "strengths": ["strength 1"],
  "improvements": ["improvement 1"],
  "knowledgeScore": number (0-10),
  "communicationScore": number (0-10),
  "confidenceScore": number (0-10)
}`;
}

export function buildInterviewAnalysisPrompt(config) {
    const reviewData = config.reviewData || [];
    const interviewConfig = config.interviewConfig || {};
    const scores = config.scores || {};

    const questionsDetail = reviewData.map((item, i) =>
        `Q${i + 1}: "${item.question}"
Answer: "${item.answer}"
Score: ${item.score}/10
Feedback: ${item.feedback}`
    ).join('\n\n');

    return `You are a senior career coach. Analyze this complete interview session.

INTERVIEW DETAILS:
- Role: ${interviewConfig.role || 'General'}
- Type: ${interviewConfig.interviewType || 'technical'}
- Difficulty: ${interviewConfig.difficulty || 'Medium'}
- Topics: ${(interviewConfig.topics || []).join(', ')}
- Total Questions Attempted: ${reviewData.length} / ${interviewConfig.questionCount || 10}
- Average Knowledge Score: ${scores.knowledge || 0}%
- Average Communication Score: ${scores.communication || 0}%
- Average Confidence Score: ${scores.confidence || 0}%

COMPLETE Q&A LOG:
${questionsDetail}

Return ONLY a JSON object:
{
  "overallVerdict": "One sentence summary",
  "overallGrade": "A+ / A / B+ / B / C+ / C / D / F",
  "readinessLevel": "Ready / Almost Ready / Needs Improvement / Significant Gaps",
  "strengthAreas": [{ "area": "Topic", "detail": "Explanation" }],
  "improvementAreas": [{ "area": "Topic", "detail": "What was lacking", "actionItem": "Specific action" }],
  "topicBreakdown": [{ "topic": "Topic", "score": 8, "maxScore": 10, "comment": "Assessment" }],
  "communicationFeedback": { "clarity": "", "depth": "", "examples": "", "tips": ["tip 1"] },
  "nextSteps": ["Action item 1", "Action item 2"],
  "mockInterviewTip": "One motivational tip"
}`;
}

export function buildFetchInterviewConfigPrompt(config) {
    return `You are a career and interview expert. The user wants to practice for: "${config.examName}"

Return ONLY a JSON object:
{
  "title": "Interview title",
  "emoji": "A single relevant emoji",
  "description": "One-line description (max 60 chars)",
  "interviewType": "technical" or "hr" or "government",
  "role": "The role being interviewed for",
  "company": "Company name if applicable, empty string otherwise",
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "difficulty": "Easy" or "Medium" or "Hard" or "Expert",
  "questionCount": 10,
  "tone": "Professional" or "Friendly" or "Challenging" or "Formal",
  "recognized": true/false
}`;
}
