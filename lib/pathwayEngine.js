/**
 * Pathway Generation Engine
 *
 * Pure logic module — no React, no Mongoose.
 * Generates a schedule of practice exams (MCQ drills, mock tests, timed tests)
 * organized by stage, subject, and difficulty.
 */

/* ─── Known exam databases for smart inference ─── */
const KNOWN_EXAMS = {
  upsc: {
    stages: [
      { name: 'Prelims', objective: 'Clear objective screening', practiceFocus: ['MCQ', 'speed', 'elimination'] },
      { name: 'Mains', objective: 'Deep subjective exam', practiceFocus: ['mixed', 'accuracy', 'analysis'] },
      { name: 'Interview', objective: 'Personality test', practiceFocus: ['mock-interview', 'communication'] },
    ],
    subjects: ['General Studies', 'CSAT', 'Essay', 'Optional Subject', 'Ethics', 'Current Affairs'],
    questionTypes: ['MCQ', 'Long answer', 'Essay'],
  },
  ssc: {
    stages: [
      { name: 'Tier 1', objective: 'Computer-based objective test', practiceFocus: ['MCQ', 'speed', 'accuracy'] },
      { name: 'Tier 2', objective: 'Descriptive + objective', practiceFocus: ['MCQ', 'mixed'] },
    ],
    subjects: ['English', 'Quantitative Aptitude', 'Reasoning', 'General Awareness'],
    questionTypes: ['MCQ', 'Numerical type'],
  },
  banking: {
    stages: [
      { name: 'Prelims', objective: 'Speed-based screening', practiceFocus: ['MCQ', 'speed', 'cutoff'] },
      { name: 'Mains', objective: 'Detailed objective + descriptive', practiceFocus: ['MCQ', 'accuracy'] },
      { name: 'Interview', objective: 'HR and domain knowledge', practiceFocus: ['mock-interview'] },
    ],
    subjects: ['English', 'Quantitative Aptitude', 'Reasoning', 'General Awareness', 'Computer Knowledge'],
    questionTypes: ['MCQ', 'Numerical type'],
  },
  cat: {
    stages: [
      { name: 'Written Test', objective: 'CAT/XAT exam', practiceFocus: ['MCQ', 'speed', 'accuracy'] },
      { name: 'GD & PI', objective: 'Group discussion and personal interview', practiceFocus: ['mock-interview'] },
    ],
    subjects: ['Verbal Ability', 'Data Interpretation', 'Logical Reasoning', 'Quantitative Ability'],
    questionTypes: ['MCQ', 'Numerical type'],
  },
  ielts: {
    stages: [
      {
        name: 'Test Preparation',
        objective: 'All four modules',
        practiceFocus: ['listening', 'reading', 'writing', 'speaking'],
      },
    ],
    subjects: ['Listening', 'Reading', 'Writing', 'Speaking'],
    questionTypes: ['MCQ', 'Short answer', 'Long answer'],
  },
  gate: {
    stages: [{ name: 'Exam Prep', objective: 'GATE objective exam', practiceFocus: ['MCQ', 'numerical'] }],
    subjects: ['Engineering Mathematics', 'Core Subject', 'General Aptitude'],
    questionTypes: ['MCQ', 'Numerical type'],
  },
  software: {
    stages: [
      { name: 'Aptitude Round', objective: 'Aptitude screening', practiceFocus: ['MCQ', 'speed'] },
      { name: 'Coding Round', objective: 'Data structures and algorithms', practiceFocus: ['coding'] },
      { name: 'Interview', objective: 'Technical + behavioral', practiceFocus: ['mock-interview'] },
    ],
    subjects: ['Aptitude', 'DSA', 'System Design', 'Behavioral'],
    questionTypes: ['MCQ', 'Coding problem', 'Interview-style questions'],
  },
  'coding-interview': {
    stages: [
      { name: 'Aptitude Round', objective: 'Screening test', practiceFocus: ['MCQ', 'speed'] },
      { name: 'Coding Round', objective: 'Problem-solving test', practiceFocus: ['coding'] },
      { name: 'Interview', objective: 'Technical interview', practiceFocus: ['mock-interview'] },
    ],
    subjects: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'System Design'],
    questionTypes: ['Coding problem', 'Interview-style questions'],
  },
};

/* ─── Task types — exams only, no study/theory ─── */
const _TASK_TYPES = [
  'easy-test', // Easy difficulty subject test
  'medium-test', // Medium difficulty subject test
  'hard-test', // Hard difficulty subject test
  'subject-test', // Focused subject-wise test
  'mock-test', // Full mock exam
  'timed-test', // Speed/timed test
  'previous-year', // Previous year paper
  'mixed-test', // Mixed difficulty test
  'coding-test', // Coding challenge test
  'interview-sim', // Mock interview
  'rest', // Rest day
];

/* ─── Task type to action route mapping (all launch exams directly) ─── */
const TASK_ROUTE_MAP = {
  'easy-test': { route: '/dashboard/generate', mode: 'exam' },
  'medium-test': { route: '/dashboard/generate', mode: 'exam' },
  'hard-test': { route: '/dashboard/generate', mode: 'exam' },
  'subject-test': { route: '/dashboard/generate', mode: 'exam' },
  'mock-test': { route: '/dashboard/generate', mode: 'exam' },
  'timed-test': { route: '/dashboard/generate', mode: 'exam' },
  'previous-year': { route: '/dashboard/generate', mode: 'exam' },
  'mixed-test': { route: '/dashboard/generate', mode: 'exam' },
  'coding-test': { route: '/dashboard/coding', mode: 'coding' },
  'interview-sim': { route: '/dashboard/interview', mode: 'interview' },
  rest: { route: '', mode: null },
};

/* ─── Difficulty configs per task type ─── */
const DIFFICULTY_CONFIGS = {
  'easy-test': { difficulty: '80% Easy, 15% Medium, 5% Hard', totalQuestions: 15, timeLimit: 20 },
  'medium-test': { difficulty: '20% Easy, 60% Medium, 20% Hard', totalQuestions: 20, timeLimit: 30 },
  'hard-test': { difficulty: '5% Easy, 35% Medium, 60% Hard', totalQuestions: 15, timeLimit: 25 },
  'subject-test': { difficulty: '30% Easy, 50% Medium, 20% Hard', totalQuestions: 20, timeLimit: 30 },
  'mock-test': { difficulty: '20% Easy, 50% Medium, 30% Hard', totalQuestions: 50, timeLimit: 90 },
  'timed-test': { difficulty: '30% Easy, 50% Medium, 20% Hard', totalQuestions: 25, timeLimit: 15 },
  'previous-year': { difficulty: '25% Easy, 50% Medium, 25% Hard', totalQuestions: 30, timeLimit: 45 },
  'mixed-test': { difficulty: '30% Easy, 40% Medium, 30% Hard', totalQuestions: 20, timeLimit: 30 },
};

/**
 * Infer exam structure from exam name if recognized
 */
export function inferExamStructure(examName) {
  if (!examName) return null;
  const lower = examName.toLowerCase().trim();

  if (KNOWN_EXAMS[lower]) return { ...KNOWN_EXAMS[lower], inferred: true };

  for (const [key, data] of Object.entries(KNOWN_EXAMS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { ...data, inferred: true };
    }
  }

  if (lower.includes('bank') || lower.includes('ibps') || lower.includes('sbi'))
    return { ...KNOWN_EXAMS.banking, inferred: true };
  if (lower.includes('civil') || lower.includes('ias')) return { ...KNOWN_EXAMS.upsc, inferred: true };
  if (lower.includes('mba') || lower.includes('gmat') || lower.includes('xat'))
    return { ...KNOWN_EXAMS.cat, inferred: true };
  if (lower.includes('coding') || lower.includes('dsa') || lower.includes('leetcode'))
    return { ...KNOWN_EXAMS['coding-interview'], inferred: true };
  if (lower.includes('software') || lower.includes('google') || lower.includes('amazon') || lower.includes('faang'))
    return { ...KNOWN_EXAMS.software, inferred: true };
  if (lower.includes('ielts') || lower.includes('toefl')) return { ...KNOWN_EXAMS.ielts, inferred: true };
  if (lower.includes('gate')) return { ...KNOWN_EXAMS.gate, inferred: true };
  if (lower.includes('railway') || lower.includes('rrb')) return { ...KNOWN_EXAMS.ssc, inferred: true };

  return null;
}

/**
 * Get the action route and config for a task type — builds a ready-to-launch exam config
 */
export function getTaskAction(taskType, subject, stage, examName, questionType) {
  const mapping = TASK_ROUTE_MAP[taskType] || TASK_ROUTE_MAP['subject-test'];
  if (!mapping.route) return { route: '', config: {}, mode: null };

  const diffConfig = DIFFICULTY_CONFIGS[taskType] || DIFFICULTY_CONFIGS['subject-test'];
  const config = {};

  if (mapping.mode === 'exam') {
    config.examType = examName || 'Custom';
    config.sections = [subject || 'General'];
    config.totalQuestions = diffConfig.totalQuestions;
    config.timeLimit = diffConfig.timeLimit;
    config.questionType = questionType || 'MCQ';
    config.difficulty = diffConfig.difficulty;
    config.negativeMarking = 0.25;
    if (taskType === 'mock-test') {
      config.negativeMarking = 0.25;
    }
  } else if (mapping.mode === 'interview') {
    config.interviewType = 'technical';
    config.role = subject || 'General';
    config.topics = [subject || 'General'];
    config.difficulty = 'Medium';
    config.questionCount = 5;
  } else if (mapping.mode === 'coding') {
    config.difficulty = 'medium';
    config.topics = [subject || 'General'];
  }

  return { route: mapping.route, config, mode: mapping.mode };
}

/**
 * Calculate subject weights based on strength level
 */
function getSubjectWeight(strengthLevel) {
  switch (strengthLevel) {
    case 'weak':
      return 3;
    case 'average':
      return 2;
    case 'strong':
      return 1;
    default:
      return 2;
  }
}

/**
 * Get test types appropriate for a stage
 */
function getTestTypesForStage(stage, _questionTypes, _goalType) {
  const name = (stage?.name || '').toLowerCase();

  // Interview stages
  if (
    name.includes('interview') ||
    name.includes('behavioral') ||
    name.includes('gd') ||
    name.includes('group') ||
    name.includes('pi')
  ) {
    return ['interview-sim'];
  }

  // Coding stages
  if (name.includes('coding') || name.includes('dsa') || name.includes('technical round')) {
    return ['coding-test'];
  }

  // Standard exam stages — all test types
  return ['easy-test', 'medium-test', 'hard-test', 'subject-test', 'timed-test'];
}

/**
 * Distribute days across stages based on weights
 */
function distributeStagesDays(stages, totalDays) {
  if (!stages.length) return [];
  const total = stages.length;
  const baseDays = Math.floor(totalDays / total);
  const remainder = totalDays % total;

  let currentDay = 1;
  return stages.map((stage, idx) => {
    const days = baseDays + (idx < remainder ? 1 : 0);
    const result = { ...stage, duration: days, startDay: currentDay, endDay: currentDay + days - 1 };
    currentDay += days;
    return result;
  });
}

/**
 * Check if a date falls on a preferred day
 */
function isPreferredDay(date, preferredDays) {
  if (!preferredDays || preferredDays.length === 7) return true;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return preferredDays.includes(dayNames[date.getDay()]);
}

/**
 * Core schedule generation function — generates only practice exams/tests
 */
export function generateSchedule(input) {
  const {
    examName = 'Custom Exam',
    goalType = 'custom',
    stages = [],
    subjects = [],
    questionTypes = ['MCQ'],
    totalDuration = 30,
    dailyAvailability = 2,
    preferredDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    startDate = new Date(),
    currentLevel: _currentLevel = 'beginner',
    testPreferences: _testPreferences = {},
  } = input;

  const schedule = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const distributedStages = distributeStagesDays(stages, totalDuration);
  const dailyMinutes = dailyAvailability * 60;

  // Phase boundaries: early (40%), mid (35%), final (25%)
  const phaseBoundaries = [0.4, 0.75, 1.0];

  for (let dayOffset = 0; dayOffset < totalDuration; dayOffset++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + dayOffset);

    if (!isPreferredDay(currentDate, preferredDays)) {
      schedule.push({
        date: new Date(currentDate),
        title: 'Rest Day',
        type: 'rest',
        stage: '',
        subject: '',
        duration: 0,
        priority: 5,
        actionRoute: '',
        actionConfig: {},
        completionStatus: 'planned',
        metadata: { isRestDay: true },
      });
      continue;
    }

    const dayNumber = dayOffset + 1;
    const currentStage =
      distributedStages.find((s) => dayNumber >= s.startDay && dayNumber <= s.endDay) || distributedStages[0];
    const stageName = currentStage?.name || 'General';

    // Determine phase
    const progress = dayOffset / totalDuration;
    let phase = 0;
    for (let p = 0; p < phaseBoundaries.length; p++) {
      if (progress < phaseBoundaries[p]) {
        phase = p;
        break;
      }
    }

    const availableTypes = getTestTypesForStage(currentStage, questionTypes, goalType);

    // Tests per day: 1-3 based on available time
    const testsPerDay = dailyMinutes >= 180 ? 3 : dailyMinutes >= 90 ? 2 : 1;
    const minutesPerTest = Math.floor(dailyMinutes / testsPerDay);

    for (let taskIdx = 0; taskIdx < testsPerDay; taskIdx++) {
      // Pick subject — weighted by weakness
      const subjectIdx = subjects.length > 0 ? pickWeightedSubject(subjects, dayOffset, taskIdx) : -1;
      const subject = subjectIdx >= 0 ? subjects[subjectIdx] : null;
      const subjectName = subject?.name || 'General';

      // Pick test type — varies by phase
      let testType;
      if (phase === 2) {
        // Final phase — more mock tests and hard tests
        const finalTypes = availableTypes.filter((t) =>
          ['mock-test', 'hard-test', 'timed-test', 'interview-sim', 'coding-test'].includes(t)
        );
        testType =
          finalTypes.length > 0
            ? finalTypes[(dayOffset + taskIdx) % finalTypes.length]
            : availableTypes[(dayOffset + taskIdx) % availableTypes.length];
      } else if (phase === 0) {
        // Early phase — more easy and medium tests
        const earlyTypes = availableTypes.filter((t) =>
          ['easy-test', 'medium-test', 'subject-test', 'coding-test'].includes(t)
        );
        testType =
          earlyTypes.length > 0
            ? earlyTypes[(dayOffset + taskIdx) % earlyTypes.length]
            : availableTypes[(dayOffset + taskIdx) % availableTypes.length];
      } else {
        // Mid phase — balanced
        testType = availableTypes[(dayOffset + taskIdx) % availableTypes.length];
      }

      // Insert full mock tests periodically (every 5-7 days)
      if (
        dayOffset > 0 &&
        dayOffset % 6 === 0 &&
        taskIdx === 0 &&
        !['interview-sim', 'coding-test'].includes(testType)
      ) {
        testType = 'mock-test';
      }

      const qType = questionTypes.length > 0 ? questionTypes[0] : 'MCQ';
      const action = getTaskAction(testType, subjectName, stageName, examName, qType);
      const priority = subject
        ? Math.max(1, 6 - getSubjectWeight(subject.strengthLevel || 'average') - (phase === 2 ? 1 : 0))
        : 3;
      const title = buildTaskTitle(testType, subjectName, stageName);

      schedule.push({
        date: new Date(currentDate),
        title,
        type: testType,
        stage: stageName,
        subject: subjectName,
        duration: minutesPerTest,
        priority,
        actionRoute: action.route,
        actionConfig: action.config,
        completionStatus: 'planned',
        metadata: { phase, dayNumber, taskIndex: taskIdx, mode: action.mode },
      });
    }
  }

  return schedule;
}

/**
 * Pick a subject weighted by weakness (weak subjects get picked more often)
 */
function pickWeightedSubject(subjects, dayOffset, taskIdx) {
  if (!subjects.length) return -1;
  const weighted = [];
  subjects.forEach((s, idx) => {
    const weight = getSubjectWeight(s.strengthLevel || 'average');
    for (let i = 0; i < weight; i++) weighted.push(idx);
  });
  return weighted[(dayOffset * 3 + taskIdx) % weighted.length];
}

/**
 * Build a human-readable test title
 */
function buildTaskTitle(testType, subject, stage) {
  const labels = {
    'easy-test': 'Easy Test',
    'medium-test': 'Medium Test',
    'hard-test': 'Hard Test',
    'subject-test': 'Subject Test',
    'mock-test': 'Full Mock Test',
    'timed-test': 'Speed Test',
    'previous-year': 'Previous Year Paper',
    'mixed-test': 'Mixed Test',
    'coding-test': 'Coding Challenge',
    'interview-sim': 'Mock Interview',
    rest: 'Rest Day',
  };
  const label = labels[testType] || 'Practice Test';
  if (testType === 'rest') return 'Rest Day';
  if (testType === 'mock-test') return `${stage} — ${label}`;
  return `${subject} — ${label}`;
}

/**
 * Calculate subject statistics from a schedule
 */
export function calculateSubjectStats(schedule, subjects) {
  return subjects.map((subject) => {
    const tasks = schedule.filter((t) => t.subject === subject.name && t.type !== 'rest');
    const easyTests = tasks.filter((t) => t.type === 'easy-test').length;
    const mediumTests = tasks.filter((t) => t.type === 'medium-test').length;
    const hardTests = tasks.filter((t) => t.type === 'hard-test').length;
    const mocks = tasks.filter((t) => t.type === 'mock-test').length;

    return {
      ...subject,
      totalSessions: tasks.length,
      easyTests,
      mediumTests,
      hardTests,
      mockAllocation: mocks,
    };
  });
}

/**
 * Generate a complete pathway from user input
 */
export function generatePathway(input) {
  const { stages, subjects, ...rest } = input;

  const schedule = generateSchedule(input);
  const enrichedSubjects = calculateSubjectStats(schedule, subjects || []);

  const enrichedStages = (stages || []).map((stage) => ({
    ...stage,
    status: 'upcoming',
  }));

  const weakSubjects = (subjects || []).filter((s) => s.strengthLevel === 'weak').map((s) => s.name);
  const strategySummary = buildStrategySummary(input, schedule, weakSubjects);

  return {
    ...rest,
    stages: enrichedStages,
    subjects: enrichedSubjects,
    schedule,
    totalTasks: schedule.filter((t) => t.type !== 'rest').length,
    completedTasks: 0,
    strategySummary,
  };
}

/**
 * Build a human-readable strategy summary
 */
function buildStrategySummary(input, schedule, weakSubjects) {
  const parts = [];
  const totalTests = schedule.filter((t) => t.type !== 'rest').length;
  const mocks = schedule.filter((t) => t.type === 'mock-test').length;
  const easyTests = schedule.filter((t) => t.type === 'easy-test').length;
  const hardTests = schedule.filter((t) => t.type === 'hard-test').length;

  parts.push(`${input.totalDuration || 30}-day plan with ${totalTests} practice tests.`);

  if (input.stages?.length > 1) {
    parts.push(`Covers ${input.stages.length} exam stages: ${input.stages.map((s) => s.name).join(', ')}.`);
  }

  if (weakSubjects.length > 0) {
    parts.push(`Extra tests for weak areas: ${weakSubjects.join(', ')}.`);
  }

  parts.push(`Includes ${mocks} full mock tests, ${easyTests} easy tests, and ${hardTests} hard tests.`);

  if (input.currentLevel === 'beginner') {
    parts.push('Starts with easier tests, gradually increasing difficulty.');
  } else if (input.currentLevel === 'advanced' || input.currentLevel === 'mock-ready') {
    parts.push('Heavy on mock tests and hard-level practice for final preparation.');
  }

  return parts.join(' ');
}

/**
 * Adapt schedule based on progress feedback
 */
export function adaptSchedule(schedule, taskId, action) {
  return schedule.map((task) => {
    if (task._id?.toString() === taskId || task.date?.toISOString() === taskId) {
      return { ...task, completionStatus: action };
    }
    return task;
  });
}
