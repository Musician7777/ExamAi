/**
 * Google Analytics 4 — Custom Event Tracking Utility
 *
 * Wraps gtag event tracking with safe no-op fallbacks when GA is
 * not configured (e.g. dev mode).
 *
 * Consent gating is handled entirely by Google Consent Mode v2 — when
 * consent is denied, GA4 sends cookieless pings for behavioral modeling;
 * when granted, full hits are sent. No manual consent checks here.
 *
 * Usage (client components only):
 *   import { trackEvent } from '@/lib/ga';
 *   trackEvent('exam_generate', { exam_type: 'UPSC', question_count: 20 });
 */

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return; // SSR guard

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return; // No GA configured — silently skip

  // No hasConsent() check — Consent Mode v2 handles consent gating automatically.
  // When consent is denied, GA4 sends cookieless pings for behavioral modeling;
  // when granted, full hits are sent. Manually gating would break modeling.

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

/* ─── Exam funnel: start event ─── */

/**
 * Track when a user actually begins an exam (starts answering questions).
 * Bridges the gap between `exam_generate` and `exam_submit` for funnel analysis.
 */
export function trackExamStart({ examType, questionType, questionCount, duration }) {
  trackEvent('exam_start', {
    exam_type: examType,
    question_type: questionType,
    question_count: questionCount,
    duration,
  });
}

/* ─── Error & exception tracking ─── */

/**
 * Track client-side errors visible in GA4.
 * Debounced automatically — only sends distinct error messages.
 */
const _sentErrors = new Set();
export function trackError({ errorName, errorCategory, fatal = false }) {
  // Debounce: only send each errorName once per session
  const key = `${errorCategory}:${errorName}`;
  if (_sentErrors.has(key)) return;
  _sentErrors.add(key);

  trackEvent('error', {
    error_name: errorName,
    error_category: errorCategory,
    fatal: String(fatal),
  });
}

/* ─── Feature adoption tracking ─── */

/**
 * Track feature usage for product analytics.
 * Helps prioritize development by measuring which features are actually used.
 */
export function trackFeatureUsed({ featureName, context }) {
  trackEvent('feature_used', {
    feature_name: featureName,
    context: context || undefined,
  });
}

/* ─── Cookie consent decision tracking ─── */

/**
 * Track whether the user accepted or rejected analytics cookies.
 * Valuable for understanding consent rate and correlating with behavior.
 */
export function trackConsentDecision({ decision }) {
  trackEvent('consent_decision', {
    consent_decision: decision,
  });
}

/* ─── Internal helper ─── */

/**
 * Execute a gtag function, retrying up to 5× if gtag hasn't loaded yet.
 *
 * The gtag script loads with `afterInteractive` strategy, so it may not be
 * available when React effects first fire. This helper mirrors the retry
 * pattern used in ConsentProvider and keeps all callers DRY.
 *
 * @param {(gtag: Function) => void} fn  — receives `window.gtag` when ready
 * @param {string} label — used in dev-mode warning messages
 */
function withGtagRetry(fn, label) {
  if (typeof window === 'undefined') return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return;

  try {
    if (typeof window.gtag === 'function') {
      fn(window.gtag);
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof window.gtag === 'function') {
          fn(window.gtag);
          clearInterval(interval);
        } else if (attempts >= 5) {
          clearInterval(interval);
        }
      }, 500);
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[GA] ${label} error:`, err.message);
    }
  }
}

/* ─── User identification & properties ─── */

/**
 * Set the GA4 user_id for an authenticated user.
 *
 * Call this once after login (or on mount when a session exists) so GA4 can
 * associate all subsequent hits with a cross-device, cross-session identity.
 *
 * IMPORTANT: Only pass non-PII identifiers (e.g. database ObjectId).
 * Never use email addresses, real names, or other personally identifiable
 * information as the user_id.
 */
export function setUserId(userId) {
  if (!userId) return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return;
  withGtagRetry((gtag) => gtag('config', gaId, { user_id: userId }), 'setUserId');
}

/**
 * Clear the GA4 user_id on logout.
 *
 * Sets user_id to undefined so subsequent events are no longer tied to the
 * previous identity. Also clears user_properties.
 */
export function clearUserId() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return;
  withGtagRetry((gtag) => {
    gtag('config', gaId, { user_id: undefined });
    gtag('set', { user_properties: {} });
  }, 'clearUserId');
}

/**
 * Set GA4 user_properties for audience segmentation.
 *
 * User properties persist for the lifetime of the page and are attached to
 * every subsequent event. Call this once after setting user_id (on login or
 * mount) — no need to repeat on every pageview.
 *
 * IMPORTANT: Never send PII (email, name, phone) as user properties.
 * All values must be strings — GA4 silently drops non-string values.
 */
export function setUserProperties(properties) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return;
  withGtagRetry((gtag) => gtag('set', { user_properties: properties }), 'setUserProperties');
}

/* ─── Page-view tracking for SPA route changes ─── */

/**
 * Send a manual page_view event to GA4.
 *
 * Next.js App Router performs client-side navigation without a full page
 * reload, so the automatic `send_page_view: true` in the gtag config
 * only fires on the initial load. Call this on every route change so
 * GA4 records all virtual pageviews.
 *
 * IMPORTANT: This does NOT check hasConsent() on purpose. Consent Mode v2
 * handles consent gating automatically — when consent is denied, GA4 sends
 * cookieless pings for behavioral modeling; when granted, full hits are
 * sent. Manually gating would break the modeling benefit.
 */
export function trackPageView(url) {
  if (typeof window === 'undefined') return; // SSR guard

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: url,
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GA] trackPageView error:', err.message);
    }
  }
}
