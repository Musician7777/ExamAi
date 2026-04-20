/**
 * Google Analytics 4 — Custom Event Tracking Utility
 *
 * Wraps gtag event tracking with safe no-op fallbacks when GA is
 * not configured (e.g. dev mode) or the user has not consented.
 *
 * Consent is stored in localStorage under 'examai_cookie_consent'.
 * The GA script is only loaded after the user accepts analytics cookies.
 *
 * Usage (client components only):
 *   import { trackEvent } from '@/lib/ga';
 *   trackEvent('exam_generate', { exam_type: 'UPSC', question_count: 20 });
 */

const CONSENT_KEY = 'examai_cookie_consent';

function hasConsent() {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return; // SSR guard

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return; // No GA configured — silently skip

  if (!hasConsent()) return; // User hasn't accepted analytics cookies

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch (err) {
    // Never let analytics break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GA] trackEvent error:', err.message);
    }
  }
}

/* ─── Predefined event helpers for consistency ─── */

export function trackExamGenerate({
  examType,
  questionCount,
  questionType,
  difficulty,
  hasSubjects,
  subjectCount,
  timeLimit,
}) {
  trackEvent('exam_generate', {
    exam_type: examType,
    question_count: questionCount,
    question_type: questionType,
    difficulty,
    has_subjects: hasSubjects,
    subject_count: subjectCount,
    time_limit: timeLimit,
  });
}

export function trackExamSubmit({ score, totalMarks, percent, correct, wrong, unanswered, timeTaken, questionType }) {
  trackEvent('exam_submit', {
    score,
    total_marks: totalMarks,
    percent,
    correct,
    wrong,
    unanswered,
    time_taken: timeTaken,
    question_type: questionType,
  });
}

export function trackInterviewStart({ interviewType, role, difficulty, questionCount, tone }) {
  trackEvent('interview_start', {
    interview_type: interviewType,
    role,
    difficulty,
    question_count: questionCount,
    tone,
  });
}

export function trackInterviewComplete({ avgScore, questionsAnswered, totalQuestions, interviewType, role }) {
  trackEvent('interview_complete', {
    avg_score: avgScore,
    questions_answered: questionsAnswered,
    total_questions: totalQuestions,
    interview_type: interviewType,
    role,
  });
}

export function trackCodingSubmit({ problemTitle, language, score, passed }) {
  trackEvent('coding_submit', {
    problem_title: problemTitle,
    language,
    score,
    passed,
  });
}

export function trackUserSignUp({ method }) {
  trackEvent('sign_up', { method });
}

export function trackUserSignIn({ method }) {
  trackEvent('login', { method });
}

export function trackShareResult({ resultType }) {
  trackEvent('share_result', { result_type: resultType });
}

export function trackPdfUpload({ pageCount, detectedQuestions }) {
  trackEvent('pdf_upload', {
    page_count: pageCount,
    detected_questions: detectedQuestions,
  });
}
