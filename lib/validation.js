import { z } from 'zod';

/**
 * Shared email schema with common validation
 */
const emailSchema = z
  .string({
    required_error: 'Email is required',
  })
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform((val) => val.toLowerCase().trim());

/**
 * Password schema with common validation rules
 */
const passwordSchema = z
  .string({
    required_error: 'Password is required',
  })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((val) => /[a-z]/.test(val), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((val) => /[0-9]/.test(val), {
    message: 'Password must contain at least one number',
  });

/**
 * Registration schema
 */
export const registerSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
    })
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => val.trim()),
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Resend verification schema
 */
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({
      required_error: 'Reset token is required',
    })
    .min(1, 'Reset token is required')
    .max(128, 'Invalid token format'),
  newPassword: passwordSchema,
});

/**
 * TTS (Text-to-Speech) schema
 * Validates text length and voice name against supported Kokoro voices.
 */
export const KOKORO_VOICES = [
  'af_bella',
  'af_nicole',
  'af_sarah',
  'af_sky',
  'am_adam',
  'am_michael',
  'bf_emma',
  'bf_isabella',
  'bm_george',
  'bm_lewis',
];

export const ttsSchema = z.object({
  text: z
    .string({ required_error: 'Text is required' })
    .trim()
    .min(1, 'Text is required')
    .max(4000, 'Text must be 4000 characters or less'),
  voice: z
    .enum(KOKORO_VOICES, { errorMap: () => ({ message: `Voice must be one of: ${KOKORO_VOICES.join(', ')}` }) })
    .default('af_bella'),
});

/**
 * Share result schema
 */
export const shareResultSchema = z.object({
  type: z.string().trim().min(1, 'Type is required').max(50),
  title: z.string().trim().min(1, 'Title is required').max(200),
  data: z.record(z.string(), z.unknown(), { required_error: 'Data is required' }),
});

/**
 * Share preset schema
 */
export const sharePresetSchema = z.object({
  presetType: z.string().trim().min(1, 'presetType is required').max(50),
  config: z.record(z.string(), z.unknown(), { required_error: 'Config is required' }),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(500).default(''),
  emoji: z.string().max(10).default('📄'),
});

/**
 * Exam session — create
 */
export const examSessionCreateSchema = z.object({
  examData: z.record(z.string(), z.unknown(), { required_error: 'Exam data is required' }),
  timeRemaining: z.number().int().min(0).optional(),
});

/**
 * Exam session — update
 */
const EXAM_SESSION_STATUSES = ['in_progress', 'paused', 'completed', 'abandoned'];
export const examSessionUpdateSchema = z.object({
  sessionId: z.string().trim().min(1, 'Session ID is required'),
  answers: z.record(z.string(), z.unknown()).optional(),
  markedForReview: z.array(z.unknown()).optional(),
  currentSection: z.union([z.string(), z.number()]).optional(),
  currentQuestion: z.number().int().min(0).optional(),
  timeRemaining: z.number().int().min(0).optional(),
  status: z
    .enum(EXAM_SESSION_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${EXAM_SESSION_STATUSES.join(', ')}` }),
    })
    .optional(),
});

/**
 * Activity — save
 */
const ACTIVITY_TYPES = ['exam', 'interview', 'coding'];
export const activityCreateSchema = z.object({
  type: z.enum(ACTIVITY_TYPES, { errorMap: () => ({ message: `Type must be one of: ${ACTIVITY_TYPES.join(', ')}` }) }),
  title: z.string().trim().min(1, 'Title is required').max(300),
  score: z.number().min(0).default(0),
  totalMarks: z.number().min(0).default(100),
  details: z.record(z.string(), z.unknown()).default({}),
  difficulty: z.string().max(50).optional(),
  duration: z.number().min(0).optional(),
  tags: z.array(z.string().max(100)).default([]),
});

/**
 * Analytics event — track
 */
const ANALYSIS_EVENT_TYPES = [
  // Funnel events
  'exam_start',
  'exam_progress',
  'exam_complete',
  'exam_review',
  'exam_abandon',
  // Question-level events
  'question_view',
  'question_answer',
  'question_correct',
  'question_incorrect',
  'question_marked',
  'question_unmarked',
  // Session events
  'session_create',
  'session_resume',
  'session_pause',
  // Engagement events
  'daily_active',
  'returning_user',
  'new_signup',
  // Interview events
  'interview_start',
  'interview_complete',
];
export const analyticsEventSchema = z.object({
  eventType: z.enum(ANALYSIS_EVENT_TYPES, {
    errorMap: () => ({ message: `Event type must be one of: ${ANALYSIS_EVENT_TYPES.join(', ')}` }),
  }),
  data: z.record(z.string(), z.unknown()).default({}),
  activityId: z.string().nullish(),
  examSessionId: z.string().nullish(),
  questionIndex: z.number().int().min(0).nullish(),
  questionType: z.string().max(50).nullish(),
  timeSpent: z.number().min(0).nullish(),
  isCorrect: z.boolean().nullish(),
  selectedAnswer: z.unknown().optional(),
  correctAnswer: z.unknown().optional(),
  topic: z.string().max(200).nullish(),
  difficulty: z.string().max(50).nullish(),
  sessionId: z.string().nullish(),
});

/**
 * Gamification — award XP
 */
export const gamificationAwardSchema = z.object({
  activityType: z.string().trim().min(1, 'Activity type is required').max(50),
  score: z.number().min(0).default(0),
  totalMarks: z.number().min(0).default(100),
});

/**
 * Study plan — generate
 */
export const studyPlanCreateSchema = z.object({
  regenerate: z.boolean().optional(),
});

/**
 * Study plan — update item
 */
const STUDY_PLAN_ITEM_STATUSES = ['pending', 'in_progress', 'completed', 'skipped'];
export const studyPlanUpdateSchema = z.object({
  action: z.enum(['update_item', 'regenerate'], {
    errorMap: () => ({ message: 'Action must be update_item or regenerate' }),
  }),
  itemId: z.string().optional(),
  status: z
    .enum(STUDY_PLAN_ITEM_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${STUDY_PLAN_ITEM_STATUSES.join(', ')}` }),
    })
    .optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Pathway — create / generate
 */
const GOAL_TYPES = [
  'competitive-exam',
  'school-college',
  'interview-preparation',
  'coding-interview',
  'skill-learning',
  'custom',
];
const CURRENT_LEVELS = ['beginner', 'intermediate', 'advanced', 'practicing', 'mock-ready'];
export const pathwayCreateSchema = z.object({
  examName: z.string().trim().min(1, 'Exam name is required').max(200),
  goalType: z
    .enum(GOAL_TYPES, { errorMap: () => ({ message: `Goal type must be one of: ${GOAL_TYPES.join(', ')}` }) })
    .default('custom'),
  stages: z
    .array(
      z.object({
        name: z.string().max(100),
        objective: z.string().max(300).optional(),
        practiceFocus: z.array(z.string().max(100)).optional(),
      })
    )
    .max(10)
    .optional(),
  subjects: z
    .array(
      z.object({
        name: z.string().max(100),
        strengthLevel: z.enum(['weak', 'average', 'strong']).optional(),
      })
    )
    .max(20)
    .optional(),
  questionTypes: z.array(z.string().max(50)).max(10).optional(),
  totalDuration: z.number().int().min(1).max(365).optional(),
  dailyAvailability: z.number().min(0.5).max(16).optional(),
  preferredDays: z.array(z.string().max(5)).max(7).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentLevel: z.enum(CURRENT_LEVELS).optional(),
  testPreferences: z
    .object({
      easyTests: z.number().min(0).max(100).optional(),
      mediumTests: z.number().min(0).max(100).optional(),
      hardTests: z.number().min(0).max(100).optional(),
      mockTests: z.number().min(0).max(100).optional(),
    })
    .optional(),
  constraints: z.array(z.string().max(200)).max(10).optional(),
  regenerate: z.boolean().optional(),
});

/**
 * Pathway — update task or settings
 */
const PATHWAY_TASK_STATUSES = ['planned', 'in_progress', 'completed', 'skipped'];
export const pathwayUpdateSchema = z.object({
  action: z.enum(['update_task', 'regenerate', 'update_settings'], {
    errorMap: () => ({ message: 'Action must be update_task, regenerate, or update_settings' }),
  }),
  taskId: z.string().optional(),
  status: z
    .enum(PATHWAY_TASK_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${PATHWAY_TASK_STATUSES.join(', ')}` }),
    })
    .optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Chat — study assistant
 */
export const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'ai']),
        text: z.string().max(4000),
      })
    )
    .max(20)
    .default([]),
  context: z.record(z.string(), z.unknown()).default({}),
});

/**
 * Code execution
 * NOTE: SUPPORTED_LANGUAGES must stay in sync with getSupportedLanguages() in codeExecutionService.js
 */
const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'ruby', 'typescript'];
export const codeExecuteSchema = z.object({
  code: z.string().min(1, 'Code is required').max(100000, 'Code must be 100,000 characters or less'),
  language: z.enum(SUPPORTED_LANGUAGES, {
    errorMap: () => ({ message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}` }),
  }),
  stdin: z.string().max(10000).optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
      })
    )
    .max(50)
    .optional(),
  timeout: z.number().int().min(1000).max(30000).optional(),
});

/**
 * Gemini AI — prompt request
 * NOTE: GEMINI_PROMPT_TYPES must stay in sync with PROMPT_BUILDERS keys in gemini/route.js
 */
const GEMINI_PROMPT_TYPES = [
  'generate-exam',
  'generate-pathway',
  'interview-question',
  'interview-respond',
  'evaluate-answer',
  'interview-analysis',
  'analyze-code',
  'fetch-exam-config',
  'fetch-subject-overview',
  'fetch-interview-config',
  'fetch-coding-config',
  'chat',
];
export const geminiPromptSchema = z.object({
  type: z.enum(GEMINI_PROMPT_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${GEMINI_PROMPT_TYPES.join(', ')}` }),
  }),
  config: z.any().optional(),
});

/**
 * User — update profile (PATCH)
 * name, image, showAds are independent optional updates.
 * currentPassword + newPassword must both be present if either is provided.
 * newEmail is validated as an email address.
 */
export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').max(100).optional(),
    image: z.string().max(1_000_000).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: passwordSchema.optional(),
    newEmail: emailSchema.optional(),
    showAds: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If one password field is provided, the other must be too
      if (data.currentPassword && !data.newPassword) return false;
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    { message: 'Both currentPassword and newPassword are required to change password' }
  );

/**
 * User — delete account (DELETE)
 * Password is optional (Google auth users don't need it),
 * but if provided it must be non-empty.
 */
export const userDeleteSchema = z.object({
  password: z.string().min(1, 'Password is required').optional(),
});

/**
 * Validate request body against a schema
 * Returns { success, data, error } object
 */
export function validateRequest(schema, body) {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return first error message for simplicity
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }
    return { success: false, error: 'Invalid request format' };
  }
}
