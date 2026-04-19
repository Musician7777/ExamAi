/**
 * Exam Generation Prompts
 * Extracted from the monolithic gemini route
 */

// Detailed exam profiles for each preset type
export const examProfiles = {
  upsc: {
    fullName: 'UPSC Civil Services Preliminary Examination',
    description: "India's premier civil services exam conducted by Union Public Service Commission",
    sections: [
      'Indian Polity & Governance',
      'Indian & World Geography',
      'Indian Economy',
      'History & Culture',
      'General Science & Environment',
      'Current Affairs',
    ],
    topics:
      'Indian Constitution, Panchayati Raj, Public Policy, Rights Issues, Parliament, Judiciary, Physical Geography, Economic Geography, Indian rivers/mountains/climate, Budget, Fiscal Policy, Banking, Ancient/Medieval/Modern Indian History, Art & Culture, Ecology, Biodiversity, Climate Change, Government Schemes, International Relations',
    style:
      'Conceptual, analytical questions that test deep understanding. Many questions require elimination of options. Statements-based questions are common (e.g., "Which of the following statements is/are correct?"). Focus on application of knowledge, not rote memorization.',
    duration: 120,
    marksPerQuestion: 2,
    negativeMarking: 0.66,
  },
  ssc: {
    fullName: 'SSC Combined Graduate Level (CGL) Examination',
    description: 'Staff Selection Commission exam for Group B & C posts in Government of India',
    sections: [
      'Quantitative Aptitude',
      'Reasoning & General Intelligence',
      'English Comprehension',
      'General Awareness',
    ],
    topics:
      'Number System, Percentage, Ratio & Proportion, Profit & Loss, Time & Work, Time Speed Distance, Algebra, Geometry, Trigonometry, Data Interpretation, Analogies, Syllogisms, Coding-Decoding, Series, Blood Relations, Direction Sense, Synonyms/Antonyms, Idioms & Phrases, One Word Substitution, Sentence Correction, Cloze Test, Static GK, History, Polity, Economics, Science, Current Affairs',
    style: 'Speed-based questions testing calculation ability and quick reasoning.',
    duration: 60,
    marksPerQuestion: 2,
    negativeMarking: 0.5,
  },
  banking: {
    fullName: 'IBPS PO / SBI PO Banking Examination',
    description: 'Bank Probationary Officer exam for public sector banks in India',
    sections: [
      'Quantitative Aptitude',
      'Reasoning Ability',
      'English Language',
      'General/Financial Awareness',
      'Computer Aptitude',
    ],
    topics:
      'Data Interpretation, Number Series, Simplification, Approximation, Percentage, Ratio, Profit & Loss, SI/CI, Inequality, Syllogism, Puzzles & Seating Arrangement, Coding-Decoding, Blood Relations, Reading Comprehension, Para Jumbles, Banking Terms, RBI Policies, Computer Basics',
    style: 'Data-heavy analytical questions with complex puzzles.',
    duration: 60,
    marksPerQuestion: 1,
    negativeMarking: 0.25,
  },
  railways: {
    fullName: 'RRB NTPC (Railway Recruitment Board Non-Technical Popular Categories)',
    description: 'Indian Railways recruitment exam for non-technical positions',
    sections: ['Mathematics', 'General Intelligence & Reasoning', 'General Awareness', 'General Science'],
    topics:
      'Number System, Decimals, Fractions, LCM/HCF, Ratio, Percentage, Mensuration, Time & Work, Analogies, Coding-Decoding, Syllogism, Indian History, Geography, Polity, Physics, Chemistry, Biology',
    style: 'Straightforward questions testing fundamental knowledge.',
    duration: 90,
    marksPerQuestion: 1,
    negativeMarking: 0.33,
  },
  'state-psc': {
    fullName: 'State Public Service Commission Examination',
    description: 'State-level civil services exam for administrative positions',
    sections: [
      'General Studies',
      'Indian Polity',
      'Indian Economy',
      'History & Culture',
      'Geography',
      'Current Affairs',
    ],
    topics:
      'State-specific history and geography, Indian Constitution, Governance, Social Justice, International Relations, Indian Economy, Environment, Ecology, Science & Technology',
    style: 'Similar to UPSC but with more focus on state-specific knowledge.',
    duration: 120,
    marksPerQuestion: 2,
    negativeMarking: 0.33,
  },
  software: {
    fullName: 'Software Engineering Technical Assessment',
    description: 'Technical hiring test for software engineering roles at tech companies',
    sections: [
      'Data Structures & Algorithms',
      'Object-Oriented Programming',
      'Database & SQL',
      'Operating Systems & Networking',
      'System Design Concepts',
    ],
    topics:
      'Arrays, Linked Lists, Trees, Graphs, Hash Tables, Sorting, Searching, Dynamic Programming, OOP Principles, Design Patterns, SQL Queries, Normalization, ACID, Process Management, TCP/IP, HTTP, REST APIs, Caching, Load Balancing, Microservices',
    style: 'Technical questions testing deep CS fundamentals.',
    duration: 60,
    marksPerQuestion: 4,
    negativeMarking: 0,
  },
  product: {
    fullName: 'Product-Based Company Hiring Assessment (Google, Amazon, Microsoft level)',
    description: 'Technical assessment for top-tier product companies (FAANG/MAANG)',
    sections: [
      'Advanced DSA & Problem Solving',
      'System Design & Architecture',
      'Computer Science Fundamentals',
      'Logical Reasoning & Aptitude',
    ],
    topics:
      'Advanced Graph Algorithms, Advanced DP, Segment Trees, Tries, Union-Find, Distributed Systems, Database Sharding, Message Queues, LRU Cache Design, OS Internals, Network Protocols, Probability, Combinatorics',
    style: 'Highly challenging questions that test problem-solving ability and deep CS knowledge.',
    duration: 90,
    marksPerQuestion: 4,
    negativeMarking: 0,
  },
  startup: {
    fullName: 'Startup Hiring Technical Assessment',
    description: 'Fast-paced technical test for startup environments',
    sections: ['Full-Stack Development', 'Problem Solving & DSA', 'Web Technologies & APIs', 'DevOps & Cloud Basics'],
    topics:
      'React/Next.js, Node.js, REST/GraphQL APIs, MongoDB/PostgreSQL, Authentication, HTML/CSS/JavaScript, TypeScript, Git, CI/CD, Docker, AWS/GCP',
    style: 'Practical, real-world questions focused on building things.',
    duration: 45,
    marksPerQuestion: 2,
    negativeMarking: 0,
  },
  campus: {
    fullName: 'Campus Placement Assessment',
    description: 'College campus recruitment test for freshers/graduates',
    sections: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical (CS Fundamentals)'],
    topics:
      'Number System, Probability, P&C, Time & Work, Percentage, Blood Relations, Syllogism, Coding-Decoding, Reading Comprehension, Grammar, OOPs basics, SQL basics, Data Structures',
    style: 'Moderate difficulty suitable for fresh graduates.',
    duration: 90,
    marksPerQuestion: 1,
    negativeMarking: 0.25,
  },
  mba: {
    fullName: 'MBA Entrance Examination (CAT/XAT/GMAT style)',
    description: 'Management entrance test for top business schools',
    sections: [
      'Quantitative Ability',
      'Data Interpretation & Logical Reasoning',
      'Verbal Ability & Reading Comprehension',
    ],
    topics:
      'Number Theory, Algebra, Geometry, Arithmetic, Data Interpretation, Logical Reasoning, Critical Reasoning, Para Jumbles, Reading Comprehension',
    style: 'High difficulty, time-pressured questions.',
    duration: 120,
    marksPerQuestion: 3,
    negativeMarking: 1,
  },
};

export function buildExamPrompt(config) {
  const profile = examProfiles[config.examType] || null;
  const totalQuestions = config.totalQuestions || 20;

  if (profile) {
    const questionsPerSection = Math.max(1, Math.floor(totalQuestions / profile.sections.length));
    const remainder = totalQuestions - questionsPerSection * profile.sections.length;

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

  return `Generate a structured exam in JSON format based on these specifications:

Exam Type: ${config.examType || 'General Knowledge Assessment'}
Total Questions: ${totalQuestions}
Sections: ${JSON.stringify(config.sections || ['General Knowledge', 'Reasoning', 'Quantitative Aptitude'])}
Difficulty Distribution: ${config.difficulty || '30% Easy, 50% Medium, 20% Hard'}
Question Types: ${config.questionTypes || 'MCQ'}
Negative Marking: ${config.negativeMarking || 'None'}

CRITICAL RULES:
1. Every question MUST be unique
2. Each question must have EXACTLY 4 options
3. "correct" is the 0-based index (0-3)
4. Include clear explanations for each answer
5. Question IDs must be sequential starting from 1

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

export function buildFetchExamConfigPrompt(config) {
  return `You are an expert on competitive exams worldwide. The user wants to generate a mock exam for: "${config.examName}"

Research this exam and return its real configuration. If you recognize the exam, provide accurate details. If you don't recognize it, make a reasonable guess based on the name.

Return ONLY a JSON object:
{
  "examName": "Full official name of the exam",
  "emoji": "A single relevant emoji",
  "description": "One-line description (max 60 chars)",
  "totalQuestions": number,
  "timeLimit": number (in minutes),
  "sections": ["Section 1", "Section 2"],
  "difficulty": "30% Easy, 50% Medium, 20% Hard",
  "negativeMarking": number,
  "marksPerQuestion": number,
  "questionType": "MCQ",
  "topics": "Comma-separated list of key topics covered",
  "recognized": true/false
}`;
}
