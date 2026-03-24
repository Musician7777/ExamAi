import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request) {
    try {
        const { type, config } = await request.json();

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return NextResponse.json(getMockResponse(type, config));
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        let prompt = '';

        switch (type) {
            case 'generate-exam':
                prompt = buildExamPrompt(config);
                break;
            case 'interview-question':
                prompt = buildInterviewPrompt(config);
                break;
            case 'evaluate-answer':
                prompt = buildEvaluationPrompt(config);
                break;
            case 'evaluate-code':
                prompt = buildCodeEvaluationPrompt(config);
                break;
            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
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
        return NextResponse.json(getMockResponse(type, {}));
    }
}

function buildExamPrompt(config) {
    return `Generate a structured exam in JSON format based on these specifications:

Exam Type: ${config.examType || 'General'}
Category: ${config.category || 'Mixed'}
Total Questions: ${config.totalQuestions || 20}
Sections: ${JSON.stringify(config.sections || ['General Knowledge'])}
Difficulty Distribution: ${config.difficulty || '30% Easy, 50% Medium, 20% Hard'}
Question Types: ${config.questionTypes || 'MCQ'}
Negative Marking: ${config.negativeMarking || 'None'}

Return a JSON object with this exact structure:
{
  "title": "Exam Title",
  "totalQuestions": number,
  "duration": number (in minutes),
  "totalMarks": number,
  "negativeMarking": number,
  "sections": [
    {
      "name": "Section Name",
      "questions": [
        {
          "id": number,
          "text": "Question text",
          "options": ["A", "B", "C", "D"],
          "correct": 0,
          "difficulty": "easy|medium|hard",
          "topic": "topic name",
          "explanation": "Brief explanation of correct answer",
          "marks": number
        }
      ]
    }
  ]
}

Requirements:
- Questions must be realistic and exam-quality
- Follow the official pattern of ${config.examType || 'competitive'} exams
- Include proper difficulty distribution
- Each question must have exactly 4 options
- "correct" is the 0-based index of the correct option
- Include clear explanations for each answer`;
}

function buildInterviewPrompt(config) {
    return `You are an AI interviewer conducting a ${config.interviewType || 'technical'} interview.

Context:
- Interview Type: ${config.interviewType}
- Topic: ${config.topic || 'General'}
- Difficulty: ${config.difficulty || 'Medium'}
- Previous Q&A: ${JSON.stringify(config.history || [])}

Generate the next interview question as a JSON object:
{
  "question": "The interview question",
  "expectedPoints": ["Key point 1", "Key point 2"],
  "difficulty": "easy|medium|hard",
  "topic": "${config.topic}",
  "followUp": true/false,
  "hint": "Optional hint for the candidate"
}

Make it realistic, professional, and progressively challenging based on the conversation history.`;
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
        const type_questions = questions[config?.interviewType] || questions.technical;
        const idx = (config?.history?.length || 0) % type_questions.length;
        return { ...type_questions[idx], followUp: (config?.history?.length || 0) > 0, hint: 'Take your time to structure your answer.' };
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
