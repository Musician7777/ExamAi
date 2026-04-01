import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Build list of available API keys for failover
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
].filter(k => k && k !== 'your_gemini_api_key_here');

function isRateLimitError(error) {
    return error?.status === 429 || 
           error?.message?.includes('429') || 
           error?.message?.includes('Resource has been exhausted') ||
           error?.message?.includes('quota');
}

// Try generating content with a single key, with retries
async function tryWithKey(apiKey, prompt, retries = 2) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await model.generateContent(prompt);
        } catch (error) {
            if (isRateLimitError(error) && attempt < retries) {
                const delay = (attempt + 1) * 2000; // 2s, 4s
                console.log(`Key ${apiKey.slice(-6)} rate limited. Retry ${attempt + 1}/${retries} in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                throw error;
            }
        }
    }
}

// Try all available API keys with failover
async function generateWithFailover(prompt) {
    let lastError = null;
    for (let i = 0; i < API_KEYS.length; i++) {
        try {
            console.log(`Trying Gemini API key ${i + 1}/${API_KEYS.length}...`);
            return await tryWithKey(API_KEYS[i], prompt);
        } catch (error) {
            lastError = error;
            if (isRateLimitError(error) && i < API_KEYS.length - 1) {
                console.log(`Key ${i + 1} exhausted. Switching to key ${i + 2}...`);
            } else if (i < API_KEYS.length - 1) {
                console.log(`Key ${i + 1} failed (${error.message}). Trying key ${i + 2}...`);
            }
        }
    }
    throw lastError;
}

export async function POST(request) {
    let type = 'generate-exam';
    let config = {};
    try {
        const body = await request.json();
        type = body.type;
        config = body.config;

        if (API_KEYS.length === 0) {
            return NextResponse.json(getMockResponse(type, config));
        }

        let prompt = '';

        switch (type) {
            case 'generate-exam':
                prompt = buildExamPrompt(config);
                break;
            case 'interview-question':
                prompt = buildInterviewPrompt(config);
                break;
            case 'interview-respond':
                prompt = buildInterviewRespondPrompt(config);
                break;
            case 'evaluate-answer':
                prompt = buildEvaluationPrompt(config);
                break;
            case 'interview-analysis':
                prompt = buildInterviewAnalysisPrompt(config);
                break;
            case 'evaluate-code':
                prompt = buildCodeEvaluationPrompt(config);
                break;
            case 'fetch-exam-config':
                prompt = buildFetchExamConfigPrompt(config);
                break;
            case 'fetch-interview-config':
                prompt = buildFetchInterviewConfigPrompt(config);
                break;
            case 'fetch-coding-config':
                prompt = buildFetchCodingConfigPrompt(config);
                break;
            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        // Call Gemini with dual-key failover
        const result = await generateWithFailover(prompt);
        const response = await result.response;
        const text = response.text();

        let parsed;
        try {
            const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
            parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
        } catch {
            parsed = { raw: text };
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Gemini API error:', error);
        if (isRateLimitError(error)) {
            return NextResponse.json({ 
                error: 'All API keys are rate limited. Please wait 30-60 seconds and try again.',
                isRateLimited: true 
            }, { status: 429 });
        }
        return NextResponse.json({ 
            error: 'Failed to generate. Please try again.',
            details: error?.message 
        }, { status: 500 });
    }
}

function buildExamPrompt(config) {
    // Detailed exam profiles for each preset type
    const examProfiles = {
        'upsc': {
            fullName: 'UPSC Civil Services Preliminary Examination',
            description: 'India\'s premier civil services exam conducted by Union Public Service Commission',
            sections: ['Indian Polity & Governance', 'Indian & World Geography', 'Indian Economy', 'History & Culture', 'General Science & Environment', 'Current Affairs'],
            topics: 'Indian Constitution, Panchayati Raj, Public Policy, Rights Issues, Parliament, Judiciary, Physical Geography, Economic Geography, Indian rivers/mountains/climate, Budget, Fiscal Policy, Banking, Ancient/Medieval/Modern Indian History, Art & Culture, Ecology, Biodiversity, Climate Change, Government Schemes, International Relations',
            style: 'Conceptual, analytical questions that test deep understanding. Many questions require elimination of options. Statements-based questions are common (e.g., "Which of the following statements is/are correct?"). Focus on application of knowledge, not rote memorization.',
            duration: 120,
            marksPerQuestion: 2,
            negativeMarking: 0.66,
        },
        'ssc': {
            fullName: 'SSC Combined Graduate Level (CGL) Examination',
            description: 'Staff Selection Commission exam for Group B & C posts in Government of India',
            sections: ['Quantitative Aptitude', 'Reasoning & General Intelligence', 'English Comprehension', 'General Awareness'],
            topics: 'Number System, Percentage, Ratio & Proportion, Profit & Loss, Time & Work, Time Speed Distance, Algebra, Geometry, Trigonometry, Data Interpretation, Analogies, Syllogisms, Coding-Decoding, Series, Blood Relations, Direction Sense, Synonyms/Antonyms, Idioms & Phrases, One Word Substitution, Sentence Correction, Cloze Test, Static GK, History, Polity, Economics, Science, Current Affairs',
            style: 'Speed-based questions testing calculation ability and quick reasoning. Questions should be solvable within 30-60 seconds each. Focus on shortcuts and mental math. English section tests grammar and vocabulary.',
            duration: 60,
            marksPerQuestion: 2,
            negativeMarking: 0.50,
        },
        'banking': {
            fullName: 'IBPS PO / SBI PO Banking Examination',
            description: 'Bank Probationary Officer exam for public sector banks in India',
            sections: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General/Financial Awareness', 'Computer Aptitude'],
            topics: 'Data Interpretation (Bar/Pie/Line Charts, Tables), Number Series, Simplification, Approximation, Percentage, Ratio, Profit & Loss, SI/CI, Inequality, Syllogism, Puzzles & Seating Arrangement, Coding-Decoding, Blood Relations, Input-Output, Reading Comprehension, Para Jumbles, Fillers, Error Detection, Banking Terms, RBI Policies, Financial Institutions, Monetary Policy, GDP, Inflation, Computer Basics, Networking, MS Office, DBMS',
            style: 'Data-heavy analytical questions. Quantitative section focuses heavily on data interpretation with tables and charts. Reasoning has complex puzzles (floor-based, circular seating). English tests reading speed and comprehension. Financial awareness questions on banking sector, RBI norms, and recent economic developments.',
            duration: 60,
            marksPerQuestion: 1,
            negativeMarking: 0.25,
        },
        'railways': {
            fullName: 'RRB NTPC (Railway Recruitment Board Non-Technical Popular Categories)',
            description: 'Indian Railways recruitment exam for non-technical positions',
            sections: ['Mathematics', 'General Intelligence & Reasoning', 'General Awareness', 'General Science'],
            topics: 'Number System, Decimals, Fractions, LCM/HCF, Ratio, Percentage, Mensuration, Time & Work, Time & Distance, SI/CI, Profit & Loss, Analogies, Number & Alphabetical Series, Coding-Decoding, Syllogism, Venn Diagrams, Indian History, Geography, Polity, Economy, Railway-specific GK, Physics (Mechanics, Light, Sound), Chemistry (Elements, Reactions), Biology (Human Body, Diseases, Nutrition)',
            style: 'Straightforward questions testing fundamental knowledge. Mix of calculation-based math and factual general knowledge. Science questions are basic and practical. Include some railway-specific general knowledge questions.',
            duration: 90,
            marksPerQuestion: 1,
            negativeMarking: 0.33,
        },
        'state-psc': {
            fullName: 'State Public Service Commission Examination',
            description: 'State-level civil services exam for administrative positions',
            sections: ['General Studies', 'Indian Polity', 'Indian Economy', 'History & Culture', 'Geography', 'Current Affairs'],
            topics: 'State-specific history and geography, Indian Constitution, Governance, Panchayati Raj, Social Justice, International Relations, Indian Economy, Planning, Agriculture, Industry, Trade, Indian National Movement, World History, Physical/Economic/Social Geography, Environment, Ecology, Current Events, Science & Technology',
            style: 'Similar to UPSC but with more focus on state-specific knowledge. Questions test both factual recall and analytical understanding. Include questions about national and international current affairs.',
            duration: 120,
            marksPerQuestion: 2,
            negativeMarking: 0.33,
        },
        'software': {
            fullName: 'Software Engineering Technical Assessment',
            description: 'Technical hiring test for software engineering roles at tech companies',
            sections: ['Data Structures & Algorithms', 'Object-Oriented Programming', 'Database & SQL', 'Operating Systems & Networking', 'System Design Concepts'],
            topics: 'Arrays, Linked Lists, Trees, Graphs, Hash Tables, Stacks, Queues, Sorting, Searching, Dynamic Programming, Greedy, Recursion, Time/Space Complexity, OOP Principles (Polymorphism, Inheritance, Encapsulation, Abstraction), Design Patterns, SQL Queries (JOINs, GROUP BY, Subqueries), Normalization, ACID, Indexing, Process Management, Threads, Deadlocks, Memory Management, TCP/IP, HTTP, REST APIs, Caching, Load Balancing, Microservices',
            style: 'Technical questions testing deep CS fundamentals. Include code output prediction, time complexity analysis, SQL query results, and conceptual system design choices. Questions should be challenging and test real engineering understanding, not just textbook definitions.',
            duration: 60,
            marksPerQuestion: 4,
            negativeMarking: 0,
        },
        'product': {
            fullName: 'Product-Based Company Hiring Assessment (Google, Amazon, Microsoft level)',
            description: 'Technical assessment for top-tier product companies (FAANG/MAANG)',
            sections: ['Advanced DSA & Problem Solving', 'System Design & Architecture', 'Computer Science Fundamentals', 'Logical Reasoning & Aptitude'],
            topics: 'Advanced Graph Algorithms (Dijkstra, Bellman-Ford, Topological Sort), Advanced DP (Bitmask DP, Interval DP), Segment Trees, Tries, Union-Find, Binary Search Variations, Sliding Window, Two Pointers, Distributed Systems (CAP Theorem, Consistency Models), Database Sharding, Message Queues, LRU Cache Design, URL Shortener Design, Compiler Design Basics, OS Internals (Virtual Memory, Page Replacement), Network Protocols, Probability, Combinatorics, Puzzles',
            style: 'Highly challenging questions that test problem-solving ability and deep CS knowledge. Include tricky edge cases, code tracing with complex logic, system design trade-off analysis, and mathematical reasoning. These should be interview-caliber questions for top tech companies.',
            duration: 90,
            marksPerQuestion: 4,
            negativeMarking: 0,
        },
        'startup': {
            fullName: 'Startup Hiring Technical Assessment',
            description: 'Fast-paced technical test for startup environments',
            sections: ['Full-Stack Development', 'Problem Solving & DSA', 'Web Technologies & APIs', 'DevOps & Cloud Basics'],
            topics: 'React/Next.js, Node.js, REST/GraphQL APIs, MongoDB/PostgreSQL, Authentication (JWT, OAuth), HTML/CSS/JavaScript, TypeScript, Git, CI/CD, Docker basics, AWS/GCP basics, Serverless, Array/String manipulation, Hash Maps, Basic DP, API Design, State Management, Responsive Design, Performance Optimization, Testing (Unit, Integration)',
            style: 'Practical, real-world questions focused on building things. Questions should test hands-on knowledge of modern web stacks, debugging ability, and quick problem solving. Include questions about choosing the right tool/library for a given scenario.',
            duration: 45,
            marksPerQuestion: 2,
            negativeMarking: 0,
        },
        'campus': {
            fullName: 'Campus Placement Assessment',
            description: 'College campus recruitment test for freshers/graduates',
            sections: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical (CS Fundamentals)'],
            topics: 'Number System, Probability, Permutation & Combination, Time & Work, Percentage, Profit & Loss, Averages, Ages, Blood Relations, Seating Arrangement, Syllogism, Cubes & Dice, Statement & Assumption, Coding-Decoding, Reading Comprehension, Grammar (Tenses, Articles, Prepositions), Vocabulary, Para Jumbles, Data Types, Loops, Functions, OOPs basics, SQL basics, Complexity Analysis, Basic Data Structures',
            style: 'Moderate difficulty suitable for fresh graduates. Aptitude questions should be solvable with basic formulas. Reasoning tests logical thinking. Verbal tests English proficiency. Technical section covers CS fundamentals at an undergraduate level.',
            duration: 90,
            marksPerQuestion: 1,
            negativeMarking: 0.25,
        },
        'mba': {
            fullName: 'MBA Entrance Examination (CAT/XAT/GMAT style)',
            description: 'Management entrance test for top business schools',
            sections: ['Quantitative Ability', 'Data Interpretation & Logical Reasoning', 'Verbal Ability & Reading Comprehension'],
            topics: 'Number Theory, Algebra, Geometry, Mensuration, Modern Math (P&C, Probability), Arithmetic (Ratio, Percentage, Profit/Loss, SI/CI, Mixtures, Time-Speed-Distance, Time-Work), Data Interpretation (Tables, Graphs, Caselets), Logical Reasoning (Arrangements, Grouping, Logical Connectives, Binary Logic, Constraint-based), Critical Reasoning, Para Jumbles, Para Completion, Odd Sentence Out, Summary-based questions, Vocabulary-based RC',
            style: 'High difficulty, time-pressured questions. Quantitative questions require mathematical intuition and shortcut techniques. DI/LR sets are puzzle-like with 3-4 interconnected questions. Verbal section has long reading passages (600-800 words) with inference-based questions. Questions should differentiate between 90th and 99th percentile test-takers.',
            duration: 120,
            marksPerQuestion: 3,
            negativeMarking: 1,
        },
    };

    const profile = examProfiles[config.examType] || null;
    const totalQuestions = config.totalQuestions || 20;

    if (profile) {
        const questionsPerSection = Math.max(1, Math.floor(totalQuestions / profile.sections.length));
        const remainder = totalQuestions - (questionsPerSection * profile.sections.length);

        return `You are an expert exam paper setter for ${profile.fullName}.

${profile.description}.

Generate a realistic, high-quality exam paper with EXACTLY ${totalQuestions} questions total.

EXAM SPECIFICATIONS:
- Exam: ${profile.fullName}
- Duration: ${profile.duration} minutes
- Marks per question: ${profile.marksPerQuestion}
- Negative marking: ${profile.negativeMarking > 0 ? profile.negativeMarking + ' marks deducted per wrong answer' : 'None'}
- Difficulty distribution: ${config.difficulty || '30% Easy, 50% Medium, 20% Hard'}

SECTIONS (distribute ${totalQuestions} questions across these):
${profile.sections.map((s, i) => `${i + 1}. ${s} — ${i === 0 ? questionsPerSection + remainder : questionsPerSection} questions`).join('\n')}

TOPICS TO COVER:
${profile.topics}

QUESTION STYLE:
${profile.style}

CRITICAL RULES:
1. Every question MUST be unique — no repeated or similar questions
2. Questions must reflect the ACTUAL pattern and difficulty of ${profile.fullName}
3. Each question must have EXACTLY 4 options labeled as strings
4. "correct" field is the 0-based index (0, 1, 2, or 3) of the correct option
5. Include a clear, educational explanation for each answer
6. Vary the correct answer positions — don't make all answers the same index
7. Questions should test understanding, not just recall
8. Use current/recent data and facts where applicable
9. Question IDs must be sequential starting from 1

Return a JSON object with this EXACT structure:
{
  "title": "${profile.fullName}",
  "totalQuestions": ${totalQuestions},
  "duration": ${profile.duration},
  "totalMarks": ${totalQuestions * profile.marksPerQuestion},
  "negativeMarking": ${profile.negativeMarking},
  "sections": [
    {
      "name": "Section Name",
      "questions": [
        {
          "id": 1,
          "text": "Question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "difficulty": "easy",
          "topic": "Specific Topic",
          "explanation": "Clear explanation of why this is correct",
          "marks": ${profile.marksPerQuestion}
        }
      ]
    }
  ]
}`;
    }

    // Fallback for custom or unknown exam types
    return `Generate a structured exam in JSON format based on these specifications:

Exam Type: ${config.examType || 'General Knowledge Assessment'}
Total Questions: ${totalQuestions}
Sections: ${JSON.stringify(config.sections || ['General Knowledge', 'Reasoning', 'Quantitative Aptitude'])}
Difficulty Distribution: ${config.difficulty || '30% Easy, 50% Medium, 20% Hard'}
Question Types: ${config.questionTypes || 'MCQ'}
Negative Marking: ${config.negativeMarking || 'None'}

CRITICAL RULES:
1. Every question MUST be unique — no repeated or similar questions
2. Each question must have EXACTLY 4 options
3. "correct" is the 0-based index (0-3) of the correct option
4. Vary the correct answer positions randomly
5. Include clear explanations for each answer
6. Questions should be challenging and exam-quality
7. Question IDs must be sequential starting from 1

Return a JSON object with this EXACT structure:
{
  "title": "Exam Title",
  "totalQuestions": ${totalQuestions},
  "duration": 60,
  "totalMarks": ${totalQuestions * 2},
  "negativeMarking": ${config.negativeMarking || 0},
  "sections": [
    {
      "name": "Section Name",
      "questions": [
        {
          "id": 1,
          "text": "Question text",
          "options": ["A", "B", "C", "D"],
          "correct": 0,
          "difficulty": "easy|medium|hard",
          "topic": "topic name",
          "explanation": "Brief explanation of correct answer",
          "marks": 2
        }
      ]
    }
  ]
}`;
}

function buildInterviewPrompt(config) {
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
3. The question should be realistic — something an actual interviewer would ask
4. For technical interviews: ask about real concepts, not made-up scenarios
5. For HR interviews: focus on behavioral situations and career goals
6. Keep the question concise — 1-3 sentences maximum
7. Start easy and progressively increase difficulty as question number increases
8. If this is a follow-up to a topic, reference the previous context naturally

Return ONLY a JSON object:
{
  "question": "The interview question (1-3 sentences, natural speaking tone)",
  "expectedPoints": ["Key point 1 a good answer should cover", "Key point 2", "Key point 3"],
  "difficulty": "easy|medium|hard",
  "topic": "The specific topic this question covers"
}`;
}

function buildInterviewRespondPrompt(config) {
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
   - Give brief, constructive feedback (2-3 sentences max, in a natural interviewer tone)
   - Identify strengths and areas for improvement

2. ASK THE NEXT QUESTION (Question ${questionNumber} of ${totalQuestions}):
   - Topics to cover: ${topics}
   - Difficulty: ${config.difficulty || 'Medium'}
   - Do NOT repeat any previous question
   - Previous questions: ${config.history?.map((q, i) => `Q${i+1}: ${q}`).join('; ') || 'None'}
   - Keep it natural — you can briefly acknowledge their answer before asking

RULES:
- Be realistic — sound like a real interviewer, not an AI
- Feedback should be honest but encouraging
- The transition to the next question should feel natural
- Do NOT hallucinate facts — only evaluate based on what the candidate said
- Keep feedback concise, not a lecture

Return ONLY a JSON object:
{
  "score": 7,
  "feedback": "Brief evaluation of their answer in a natural interviewer tone",
  "strengths": ["strength 1"],
  "improvements": ["area to improve 1"],
  "knowledgeScore": 7,
  "communicationScore": 8,
  "confidenceScore": 7,
  "nextQuestion": "The next interview question (natural, conversational)",
  "nextExpectedPoints": ["Key point 1", "Key point 2"],
  "nextDifficulty": "medium",
  "nextTopic": "Topic name"
}`;
}

function buildEvaluationPrompt(config) {
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

function buildInterviewAnalysisPrompt(config) {
    const reviewData = config.reviewData || [];
    const interviewConfig = config.interviewConfig || {};
    const scores = config.scores || {};

    const questionsDetail = reviewData.map((item, i) => 
        `Q${i + 1}: "${item.question}"
Answer: "${item.answer}"
Score: ${item.score}/10
Feedback: ${item.feedback}`
    ).join('\n\n');

    return `You are a senior career coach and interview expert. Analyze this complete interview session and provide a comprehensive, actionable report.

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

Provide a comprehensive analysis report. Be specific, honest, and constructive. Reference actual answers given.

Return ONLY a JSON object:
{
  "overallVerdict": "One sentence summary of performance (e.g., 'Strong technical foundation with room for depth in system design')",
  "overallGrade": "A+ / A / B+ / B / C+ / C / D / F",
  "readinessLevel": "Ready / Almost Ready / Needs Improvement / Significant Gaps",
  "strengthAreas": [
    {
      "area": "Topic/skill name",
      "detail": "Specific explanation citing their actual answers"
    }
  ],
  "improvementAreas": [
    {
      "area": "Topic/skill name",
      "detail": "What was lacking and why it matters",
      "actionItem": "Specific action to improve (e.g., 'Practice 5 system design problems on Educative.io')"
    }
  ],
  "topicBreakdown": [
    {
      "topic": "Topic name",
      "score": 8,
      "maxScore": 10,
      "comment": "Brief assessment of this topic"
    }
  ],
  "communicationFeedback": {
    "clarity": "Assessment of answer clarity and structure",
    "depth": "Assessment of answer depth",
    "examples": "Did they use real examples? Assessment.",
    "tips": ["Specific communication tip 1", "Specific communication tip 2"]
  },
  "nextSteps": [
    "Prioritized action item 1 (most important)",
    "Action item 2",
    "Action item 3",
    "Action item 4"
  ],
  "mockInterviewTip": "One motivational/strategic tip for their next interview"
}`;
}

function buildCodeEvaluationPrompt(config) {
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

function getMockResponse(type, config) {
    if (type === 'generate-exam') {
        return {
            title: `${config?.examType || 'General'} Mock Exam`,
            totalQuestions: 20,
            duration: 60,
            totalMarks: 80,
            negativeMarking: 0.25,
            sections: [
                {
                    name: 'Quantitative Aptitude',
                    questions: Array.from({ length: 5 }, (_, i) => ({
                        id: i + 1,
                        text: [
                            'If a train travels 360 km in 4 hours, what is its speed in m/s?',
                            'The ratio of two numbers is 3:5. If their sum is 160, find the larger number.',
                            'A shopkeeper buys an article for ₹800 and sells at 15% profit. Find the selling price.',
                            'The average of 5 consecutive even numbers is 18. Find the largest number.',
                            'If compound interest on ₹10,000 at 10% for 2 years is?',
                        ][i],
                        options: [
                            ['20 m/s', '25 m/s', '30 m/s', '15 m/s'],
                            ['100', '60', '80', '120'],
                            ['₹920', '₹880', '₹960', '₹900'],
                            ['20', '22', '24', '18'],
                            ['₹2,100', '₹2,000', '₹1,900', '₹2,200'],
                        ][i],
                        correct: [1, 0, 0, 1, 0][i],
                        difficulty: ['easy', 'easy', 'medium', 'medium', 'hard'][i],
                        topic: 'Quantitative Aptitude',
                        explanation: [
                            'Speed = 360/4 = 90 km/h = 90 × 5/18 = 25 m/s',
                            '3x + 5x = 160, x = 20, larger = 5 × 20 = 100',
                            'SP = 800 × 1.15 = ₹920',
                            'If avg is 18, numbers are 14,16,18,20,22. Largest = 22',
                            'CI = 10000(1.1)² - 10000 = ₹2,100',
                        ][i],
                        marks: 4,
                    })),
                },
                {
                    name: 'Reasoning',
                    questions: Array.from({ length: 5 }, (_, i) => ({
                        id: i + 6,
                        text: [
                            'Find the missing number: 2, 6, 12, 20, ?',
                            'If APPLE is coded as ELPPA, how is MANGO coded?',
                            'Which word does NOT belong: Cat, Dog, Rose, Bird?',
                            'In a row of 30 boys, Ravi is 12th from left. His position from right?',
                            'A is B\'s sister. C is B\'s mother. D is C\'s father. How is A related to D?',
                        ][i],
                        options: [
                            ['28', '30', '32', '25'],
                            ['OGNAM', 'MANOG', 'GNAMO', 'OGANM'],
                            ['Cat', 'Rose', 'Dog', 'Bird'],
                            ['19th', '18th', '20th', '17th'],
                            ['Granddaughter', 'Daughter', 'Sister', 'Grandmother'],
                        ][i],
                        correct: [1, 0, 1, 0, 0][i],
                        difficulty: ['easy', 'easy', 'easy', 'medium', 'hard'][i],
                        topic: 'Reasoning',
                        explanation: [
                            'Pattern: 1×2, 2×3, 3×4, 4×5, 5×6 = 30',
                            'MANGO reversed = OGNAM',
                            'Rose is a flower, rest are animals',
                            '30 - 12 + 1 = 19th from right',
                            'A is B\'s sister, B\'s mother is C, C\'s father is D. So A is D\'s granddaughter.',
                        ][i],
                        marks: 4,
                    })),
                },
                {
                    name: 'English Language',
                    questions: Array.from({ length: 5 }, (_, i) => ({
                        id: i + 11,
                        text: [
                            'Choose the synonym of "Abundant":',
                            'Find the error: "He don\'t know the answer."',
                            'Choose correct spelling:',
                            'Antonym of "Benevolent":',
                            'Fill in the blank: "She has been working here ___ 2015."',
                        ][i],
                        options: [
                            ['Scarce', 'Plentiful', 'Limited', 'Rare'],
                            ['He', 'don\'t', 'know', 'No error'],
                            ['Accomodation', 'Accommodation', 'Acommodation', 'Acomodation'],
                            ['Kind', 'Generous', 'Malevolent', 'Caring'],
                            ['since', 'for', 'from', 'with'],
                        ][i],
                        correct: [1, 1, 1, 2, 0][i],
                        difficulty: ['easy', 'medium', 'medium', 'medium', 'easy'][i],
                        topic: 'English',
                        explanation: [
                            'Abundant means plentiful or in large quantities.',
                            '"don\'t" should be "doesn\'t" for third person singular.',
                            'Correct spelling: Accommodation (double c, double m)',
                            'Benevolent means kind. Malevolent is the antonym meaning evil.',
                            'We use "since" for a specific point in time.',
                        ][i],
                        marks: 4,
                    })),
                },
                {
                    name: 'General Knowledge',
                    questions: Array.from({ length: 5 }, (_, i) => ({
                        id: i + 16,
                        text: [
                            'Who is known as the Father of the Indian Constitution?',
                            'Which planet is called the Red Planet?',
                            'The currency of Japan is:',
                            'Who painted the Mona Lisa?',
                            'Which gas is most abundant in Earth\'s atmosphere?',
                        ][i],
                        options: [
                            ['Mahatma Gandhi', 'Dr. B.R. Ambedkar', 'Jawaharlal Nehru', 'Sardar Patel'],
                            ['Venus', 'Jupiter', 'Mars', 'Saturn'],
                            ['Won', 'Yuan', 'Yen', 'Ringgit'],
                            ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Michelangelo'],
                            ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
                        ][i],
                        correct: [1, 2, 2, 2, 2][i],
                        difficulty: ['easy', 'easy', 'medium', 'easy', 'easy'][i],
                        topic: 'General Knowledge',
                        explanation: [
                            'Dr. B.R. Ambedkar is the chief architect of the Indian Constitution.',
                            'Mars is called the Red Planet due to iron oxide on its surface.',
                            'Japan\'s currency is Yen (¥).',
                            'Leonardo da Vinci painted the Mona Lisa.',
                            'Nitrogen makes up about 78% of Earth\'s atmosphere.',
                        ][i],
                        marks: 4,
                    })),
                },
            ],
        };
    }

    if (type === 'interview-question') {
        const questions = {
            technical: [
                { question: 'Explain the difference between TCP and UDP protocols. When would you choose one over the other?', expectedPoints: ['Connection-oriented vs connectionless', 'Reliability', 'Use cases'], difficulty: 'medium', topic: 'Networking' },
                { question: 'What is the time complexity of common sorting algorithms? Which would you choose for nearly sorted data?', expectedPoints: ['O(n log n) for merge/quick sort', 'O(n) for nearly sorted with insertion sort', 'Space complexity'], difficulty: 'medium', topic: 'DSA' },
                { question: 'Explain how a hash map works internally. How are collisions handled?', expectedPoints: ['Hashing function', 'Bucket array', 'Chaining vs open addressing'], difficulty: 'medium', topic: 'DSA' },
            ],
            hr: [
                { question: 'Tell me about a time when you had to deal with a difficult team member. How did you handle it?', expectedPoints: ['Specific example', 'Communication approach', 'Resolution'], difficulty: 'medium', topic: 'Behavioral' },
                { question: 'Where do you see yourself in 5 years?', expectedPoints: ['Career growth', 'Ambition', 'Alignment with company'], difficulty: 'easy', topic: 'Career Goals' },
            ],
            government: [
                { question: 'What is the importance of ethics in public administration? Give examples.', expectedPoints: ['Transparency', 'Accountability', 'Public trust', 'Examples'], difficulty: 'medium', topic: 'Ethics' },
                { question: 'Discuss the impact of digital governance on rural India.', expectedPoints: ['Digital India initiative', 'Challenges', 'Benefits', 'Examples'], difficulty: 'hard', topic: 'Current Affairs' },
            ],
        };
        const interviewType = config?.interviewType || 'technical';
        const type_questions = questions[interviewType] || questions.technical;
        const idx = (config?.history?.length || 0) % type_questions.length;
        return { ...type_questions[idx], followUp: (config?.history?.length || 0) > 0, hint: 'Take your time to structure your answer.' };
    }

    if (type === 'interview-respond') {
        return {
            score: 7,
            feedback: 'Good answer with solid understanding. You covered the key concepts well.',
            strengths: ['Clear communication', 'Core concepts understood'],
            improvements: ['Add specific examples', 'Discuss edge cases'],
            knowledgeScore: 7,
            communicationScore: 8,
            confidenceScore: 7,
            nextQuestion: 'Can you walk me through how you would design a URL shortening service?',
            nextExpectedPoints: ['Database design', 'Hash generation', 'Scalability', 'Caching'],
            nextDifficulty: 'medium',
            nextTopic: 'System Design',
        };
    }

    if (type === 'evaluate-answer') {
        return {
            score: 7,
            feedback: 'Good answer with solid technical understanding. Consider providing more specific examples and relating to real-world scenarios.',
            strengths: ['Clear communication', 'Core concepts understood'],
            improvements: ['Add specific examples', 'Discuss edge cases'],
            knowledgeScore: 7,
            communicationScore: 8,
            confidenceScore: 7,
        };
    }

    if (type === 'evaluate-code') {
        const { code, language, problem, testCases } = config || {};

        // For JavaScript: actually run the code against test cases
        if (language === 'javascript' && code && testCases?.length > 0) {
            return evaluateJavaScript(code, testCases, problem);
        }

        // For other languages: check if code is just the starter template
        const isStarter = !code || code.includes('// Write your solution here') ||
            code.includes('# Write your solution here') ||
            code.includes('pass') && code.split('\n').length < 5;

        if (isStarter) {
            return {
                passed: false,
                score: 0,
                testResults: (testCases || []).map(tc => ({
                    input: tc.input || '',
                    expected: tc.output || '',
                    actual: 'Not implemented',
                    passed: false,
                })),
                feedback: 'Your code appears to be the starter template. Please implement your solution before running.',
                timeComplexity: '—',
                spaceComplexity: '—',
                suggestions: ['Implement the solution logic', 'Handle edge cases'],
            };
        }

        // For non-JS languages with actual code: give a reasonable mock based on code analysis
        const hasReturn = code.includes('return');
        const hasLoop = code.includes('for') || code.includes('while');
        const codeLines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('#')).length;

        const passRate = hasReturn && hasLoop && codeLines > 5 ? 0.7 : hasReturn ? 0.3 : 0;
        const testResults = (testCases || []).map((tc, i) => ({
            input: tc.input || '',
            expected: tc.output || '',
            actual: passRate > 0 && i < Math.ceil((testCases || []).length * passRate) ? tc.output : 'Error',
            passed: passRate > 0 && i < Math.ceil((testCases || []).length * passRate),
        }));
        const passedCount = testResults.filter(t => t.passed).length;
        const score = Math.round((passedCount / Math.max(testResults.length, 1)) * 100);

        return {
            passed: passedCount === testResults.length && testResults.length > 0,
            score,
            testResults,
            feedback: score === 0
                ? 'No tests passed. Check your logic and make sure you return the correct value.'
                : score === 100
                    ? 'All tests passed! Great solution.'
                    : `${passedCount}/${testResults.length} tests passed. Check the failing cases.`,
            timeComplexity: hasLoop ? 'O(n)' : 'O(1)',
            spaceComplexity: 'O(1)',
            suggestions: score < 100 ? ['Review failing test cases', 'Consider edge cases'] : ['Great job!'],
        };
    }

    return { error: 'Unknown type' };
}

// Actually execute JavaScript code against test cases
function evaluateJavaScript(code, testCases, problem) {
    const testResults = [];

    // Extract the function name from the code
    const fnMatch = code.match(/function\s+(\w+)/);
    const fnName = fnMatch ? fnMatch[1] : null;

    if (!fnName) {
        return {
            passed: false,
            score: 0,
            testResults: testCases.map(tc => ({
                input: tc.input || '',
                expected: tc.output || '',
                actual: 'No function found',
                passed: false,
            })),
            feedback: 'Could not find a function definition in your code. Make sure you define a function (e.g., function twoSum(nums, target) { ... }).',
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

    const passedCount = testResults.filter(t => t.passed).length;
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
            ? 'All test cases passed! Great solution.'
            : score === 0
                ? 'No tests passed. Review your logic and return value.'
                : `${passedCount}/${testResults.length} tests passed. Check the failing cases for clues.`,
        timeComplexity: hasNestedLoop ? 'O(n²)' : hasLoop ? 'O(n)' : 'O(1)',
        spaceComplexity: hasHashMap ? 'O(n)' : 'O(1)',
        suggestions: allPassed
            ? (hasNestedLoop ? ['Consider optimizing with a hash map for O(n) time'] : ['Great job!'])
            : ['Check return value format', 'Test with edge cases'],
    };
}

function parseTestInput(inputStr) {
    if (!inputStr) return [];

    // Parse format like "nums = [2,7,11,15], target = 9"
    const parts = [];
    const assignments = inputStr.split(/,\s*(?=\w+\s*=)/);

    for (const assignment of assignments) {
        const valueMatch = assignment.match(/=\s*(.+)$/);
        if (valueMatch) {
            parts.push(valueMatch[1].trim());
        } else {
            parts.push(assignment.trim());
        }
    }

    return parts;
}

function normalizeOutput(output) {
    if (output === null || output === undefined) return '';
    let str = String(output).replace(/"/g, '').replace(/'/g, '').trim();
    // Normalize array formatting
    str = str.replace(/\s+/g, '');
    return str;
}

/* ─── FETCH CONFIG PROMPTS ─── */

function buildFetchExamConfigPrompt(config) {
    return `You are an expert on competitive exams worldwide. The user wants to generate a mock exam for: "${config.examName}"

Research this exam and return its real configuration. If you recognize the exam, provide accurate details. If you don't recognize it, make a reasonable guess based on the name.

Return ONLY a JSON object:
{
  "examName": "Full official name of the exam",
  "emoji": "A single relevant emoji",
  "description": "One-line description (max 60 chars)",
  "totalQuestions": number (typical question count for this exam),
  "timeLimit": number (in minutes),
  "sections": ["Section 1", "Section 2", ...],
  "difficulty": "30% Easy, 50% Medium, 20% Hard",
  "negativeMarking": number (marks deducted per wrong answer, 0 if none),
  "marksPerQuestion": number,
  "questionType": "MCQ" or "Descriptive" or "Mixed",
  "topics": "Comma-separated list of key topics covered",
  "recognized": true/false (whether you recognize this as a real exam)
}`;
}

function buildFetchInterviewConfigPrompt(config) {
    return `You are a career and interview expert. The user wants to practice for a job interview at or for: "${config.examName}"

This could be a company name (e.g., "Google"), a role (e.g., "Frontend Developer"), or a specific interview type (e.g., "UPSC Personality Test").

Return ONLY a JSON object:
{
  "title": "Interview title (e.g., 'Google SWE Interview')",
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

function buildFetchCodingConfigPrompt(config) {
    return `You are a coding interview and competitive programming expert. The user wants coding practice for: "${config.examName}"

This could be a company (e.g., "Google"), a contest (e.g., "LeetCode Weekly"), or a topic (e.g., "Dynamic Programming").

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
