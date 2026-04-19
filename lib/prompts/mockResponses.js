/**
 * Mock Responses — used when no API keys are configured
 * Extracted from the monolithic gemini route
 */

export function getMockExamResponse(config) {
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
            'Speed = 360/4 = 90 km/h = 25 m/s',
            '3x + 5x = 160, x = 20, larger = 100',
            'SP = 800 × 1.15 = ₹920',
            'Numbers: 14,16,18,20,22. Largest = 22',
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
            "A is B's sister. C is B's mother. D is C's father. How is A related to D?",
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
            "A is D's granddaughter.",
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
            ['He', "don't", 'know', 'No error'],
            ['Accomodation', 'Accommodation', 'Acommodation', 'Acomodation'],
            ['Kind', 'Generous', 'Malevolent', 'Caring'],
            ['since', 'for', 'from', 'with'],
          ][i],
          correct: [1, 1, 1, 2, 0][i],
          difficulty: ['easy', 'medium', 'medium', 'medium', 'easy'][i],
          topic: 'English',
          explanation: [
            'Abundant means plentiful.',
            '"don\'t" should be "doesn\'t" for third person.',
            'Correct: Accommodation',
            'Benevolent = kind. Malevolent = evil.',
            '"since" for a specific point in time.',
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
            "Which gas is most abundant in Earth's atmosphere?",
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
            'Mars is the Red Planet.',
            "Japan's currency is Yen (¥).",
            'Leonardo da Vinci painted the Mona Lisa.',
            'Nitrogen makes up about 78%.',
          ][i],
          marks: 4,
        })),
      },
    ],
  };
}

export function getMockInterviewResponse(type, config) {
  if (type === 'interview-question') {
    const questions = {
      technical: [
        {
          question: 'Explain the difference between TCP and UDP protocols.',
          expectedPoints: ['Connection-oriented vs connectionless', 'Reliability', 'Use cases'],
          difficulty: 'medium',
          topic: 'Networking',
        },
        {
          question: 'What is the time complexity of common sorting algorithms?',
          expectedPoints: ['O(n log n)', 'O(n) for insertion sort on nearly sorted', 'Space complexity'],
          difficulty: 'medium',
          topic: 'DSA',
        },
      ],
      hr: [
        {
          question: 'Tell me about a time you dealt with a difficult team member.',
          expectedPoints: ['Specific example', 'Communication approach', 'Resolution'],
          difficulty: 'medium',
          topic: 'Behavioral',
        },
      ],
      government: [
        {
          question: 'What is the importance of ethics in public administration?',
          expectedPoints: ['Transparency', 'Accountability', 'Public trust'],
          difficulty: 'medium',
          topic: 'Ethics',
        },
      ],
    };
    const interviewType = config?.interviewType || 'technical';
    const typeQuestions = questions[interviewType] || questions.technical;
    const idx = (config?.history?.length || 0) % typeQuestions.length;
    return { ...typeQuestions[idx], followUp: (config?.history?.length || 0) > 0 };
  }

  if (type === 'interview-respond') {
    return {
      score: 7,
      feedback: 'Good answer with solid understanding.',
      strengths: ['Clear communication'],
      improvements: ['Add specific examples'],
      knowledgeScore: 7,
      communicationScore: 8,
      confidenceScore: 7,
      nextQuestion: 'Can you walk me through how you would design a URL shortening service?',
      nextExpectedPoints: ['Database design', 'Hash generation', 'Scalability'],
      nextDifficulty: 'medium',
      nextTopic: 'System Design',
    };
  }

  if (type === 'evaluate-answer') {
    return {
      score: 7,
      feedback: 'Good answer with solid technical understanding.',
      strengths: ['Clear communication'],
      improvements: ['Add specific examples'],
      knowledgeScore: 7,
      communicationScore: 8,
      confidenceScore: 7,
    };
  }

  return { error: 'Unknown mock type' };
}

export function getMockCodeResponse(config) {
  const { code, testCases } = config || {};
  const isStarter =
    !code || code.includes('// Write your solution here') || code.includes('# Write your solution here');

  if (isStarter) {
    return {
      passed: false,
      score: 0,
      testResults: (testCases || []).map((tc) => ({
        input: tc.input || '',
        expected: tc.output || '',
        actual: 'Not implemented',
        passed: false,
      })),
      feedback: 'Please implement your solution before running.',
      timeComplexity: '—',
      spaceComplexity: '—',
      suggestions: ['Implement the solution logic'],
    };
  }

  const hasReturn = code?.includes('return');
  const hasLoop = code?.includes('for') || code?.includes('while');
  const passRate = hasReturn && hasLoop ? 0.7 : hasReturn ? 0.3 : 0;
  const testResults = (testCases || []).map((tc, i) => ({
    input: tc.input || '',
    expected: tc.output || '',
    actual: passRate > 0 && i < Math.ceil((testCases || []).length * passRate) ? tc.output : 'Error',
    passed: passRate > 0 && i < Math.ceil((testCases || []).length * passRate),
  }));
  const passedCount = testResults.filter((t) => t.passed).length;
  const score = Math.round((passedCount / Math.max(testResults.length, 1)) * 100);

  return {
    passed: passedCount === testResults.length && testResults.length > 0,
    score,
    testResults,
    feedback:
      score === 0
        ? 'No tests passed.'
        : score === 100
          ? 'All tests passed!'
          : `${passedCount}/${testResults.length} tests passed.`,
    timeComplexity: hasLoop ? 'O(n)' : 'O(1)',
    spaceComplexity: 'O(1)',
    suggestions: score < 100 ? ['Review failing test cases'] : ['Great job!'],
  };
}
