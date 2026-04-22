'use client';
import { useEffect } from 'react';
import { HiOutlineLightBulb, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineRefresh } from 'react-icons/hi';
import styles from '../interview.module.css';

/* ─────────────────────────────────────────────
   SCORE CARD COMPONENT
   ───────────────────────────────────────────── */
function ScoreCard({ avgScore, scores, questionsAnswered, totalQs, grade }) {
  return (
    <div className={styles.resultsScoreCard}>
      <div className={styles.resultsScorePercent}>{avgScore}%</div>
      <div className={styles.resultsScoreGrade}>{grade}</div>
      <div className={styles.resultsScoreStats}>
        <div className={styles.resultsScoreStat}>
          <span className={styles.resultsStatVal} style={{ color: '#818cf8' }}>
            {scores.knowledge}%
          </span>
          <span className={styles.resultsStatLbl}>Knowledge</span>
        </div>
        <div className={styles.resultsScoreStat}>
          <span className={styles.resultsStatVal} style={{ color: '#4ade80' }}>
            {scores.communication}%
          </span>
          <span className={styles.resultsStatLbl}>Communication</span>
        </div>
        <div className={styles.resultsScoreStat}>
          <span className={styles.resultsStatVal} style={{ color: '#fbbf24' }}>
            {scores.confidence}%
          </span>
          <span className={styles.resultsStatLbl}>Confidence</span>
        </div>
        <div className={styles.resultsScoreStat}>
          <span className={styles.resultsStatVal}>
            {questionsAnswered}/{totalQs}
          </span>
          <span className={styles.resultsStatLbl}>Answered</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VERDICT CARD COMPONENT
   ───────────────────────────────────────────── */
function VerdictCard({ analysis }) {
  return (
    <div className={styles.verdictCard}>
      <div className={styles.verdictHeader}>
        <span className={styles.verdictGrade}>{analysis.overallGrade}</span>
        <span
          className={styles.verdictReadiness}
          data-level={analysis.readinessLevel?.replace(/\n/g, '-').toLowerCase()}
        >
          {analysis.readinessLevel}
        </span>
      </div>
      <p className={styles.verdictText}>{analysis.overallVerdict}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOPIC BREAKDOWN COMPONENT
   ───────────────────────────────────────────── */
function TopicBreakdown({ topicBreakdown }) {
  if (!topicBreakdown || topicBreakdown.length === 0) return null;

  return (
    <div className={styles.analysisSection}>
      <h2>📋 Topic-wise Breakdown</h2>
      <div className={styles.topicBreakdown}>
        {topicBreakdown.map((topic, i) => (
          <div key={i} className={styles.topicRow}>
            <span className={styles.topicName}>{topic.topic}</span>
            <div className={styles.topicBar}>
              <div
                className={styles.topicFill}
                style={{
                  width: `${(topic.score / topic.maxScore) * 100}%`,
                  background:
                    topic.score >= 7
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : topic.score >= 4
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                }}
              />
            </div>
            <span className={styles.topicScore}>
              {topic.score}/{topic.maxScore}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STRENGTHS & IMPROVEMENTS COMPONENT
   ───────────────────────────────────────────── */
function StrengthsImprovements({ strengthAreas, improvementAreas }) {
  return (
    <div className={styles.strengthsImprovements}>
      {strengthAreas && strengthAreas.length > 0 && (
        <div className={styles.analysisSection}>
          <h2>💪 Strengths</h2>
          {strengthAreas.map((s, i) => (
            <div key={i} className={styles.strengthItem}>
              <div className={styles.strengthTitle}>✓ {s.area}</div>
              <p className={styles.strengthDetail}>{s.detail}</p>
            </div>
          ))}
        </div>
      )}
      {improvementAreas && improvementAreas.length > 0 && (
        <div className={styles.analysisSection}>
          <h2>🎯 Areas of Improvement</h2>
          {improvementAreas.map((imp, i) => (
            <div key={i} className={styles.improvementItem}>
              <div className={styles.improvementTitle}>⚡ {imp.area}</div>
              <p className={styles.improvementDetail}>{imp.detail}</p>
              {imp.actionItem && (
                <div className={styles.actionItem}>
                  <HiOutlineLightBulb style={{ flexShrink: 0 }} />
                  <span>{imp.actionItem}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMMUNICATION FEEDBACK COMPONENT
   ───────────────────────────────────────────── */
function CommunicationFeedback({ communicationFeedback }) {
  if (!communicationFeedback) return null;

  return (
    <div className={styles.analysisSection}>
      <h2>🗣️ Communication Assessment</h2>
      <div className={styles.commGrid}>
        {communicationFeedback.clarity && (
          <div className={styles.commCard}>
            <h4>Clarity</h4>
            <p>{communicationFeedback.clarity}</p>
          </div>
        )}
        {communicationFeedback.depth && (
          <div className={styles.commCard}>
            <h4>Depth</h4>
            <p>{communicationFeedback.depth}</p>
          </div>
        )}
        {communicationFeedback.examples && (
          <div className={styles.commCard}>
            <h4>Use of Examples</h4>
            <p>{communicationFeedback.examples}</p>
          </div>
        )}
      </div>
      {communicationFeedback.tips && communicationFeedback.tips.length > 0 && (
        <div className={styles.commTips}>
          <h4>💡 Tips</h4>
          <ul>
            {communicationFeedback.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   NEXT STEPS COMPONENT
   ───────────────────────────────────────────── */
function NextSteps({ nextSteps, mockInterviewTip }) {
  if (!nextSteps || nextSteps.length === 0) return null;

  return (
    <div className={styles.analysisSection}>
      <h2>🚀 Next Steps</h2>
      <div className={styles.nextStepsList}>
        {nextSteps.map((step, i) => (
          <div key={i} className={styles.nextStepItem}>
            <span className={styles.nextStepNum}>{i + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
      {mockInterviewTip && (
        <div className={styles.proTip}>
          <strong>💎 Pro Tip:</strong> {mockInterviewTip}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   QUESTION REVIEW COMPONENT
   ───────────────────────────────────────────── */
function QuestionReview({ reviewData, expandedQuestions, onToggleExpand }) {
  return (
    <div className={styles.analysisSection}>
      <h2>📝 Question-by-Question Review</h2>
      {reviewData.map((item, i) => (
        <div key={i} className={styles.summaryQItem}>
          <div className={styles.summaryQHeader} onClick={() => onToggleExpand(i)} style={{ cursor: 'pointer' }}>
            <div className={styles.summaryQLeft}>
              <span className={styles.summaryQNumber}>Q{i + 1}</span>
              <span className={styles.summaryQPreview}>
                {item.question.length > 80 ? item.question.substring(0, 80) + '...' : item.question}
              </span>
            </div>
            <div className={styles.summaryQRight}>
              <span
                className={styles.summaryQScore}
                style={{
                  background:
                    item.score >= 7
                      ? 'rgba(34,197,94,0.12)'
                      : item.score >= 4
                        ? 'rgba(245,158,11,0.12)'
                        : 'rgba(239,68,68,0.12)',
                  color: item.score >= 7 ? '#4ade80' : item.score >= 4 ? '#fbbf24' : '#f87171',
                }}
              >
                {item.score}/10
              </span>
              {expandedQuestions[i] ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
            </div>
          </div>
          {expandedQuestions[i] && (
            <div className={styles.summaryQExpanded}>
              <div className={styles.summaryQQuestion}>{item.question}</div>
              <div className={styles.summaryQAnswer}>{item.answer}</div>
              <div className={styles.summaryQFeedback}>{item.feedback}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANALYSIS LOADING COMPONENT
   ───────────────────────────────────────────── */
function AnalysisLoading() {
  return (
    <div className={styles.analysisLoading}>
      <div className={styles.analysisSpinner} />
      <p>Generating comprehensive analysis...</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN INTERVIEW RESULTS COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewResults({
  interviewConfig,
  scores,
  reviewData,
  expandedQuestions,
  onToggleQuestionExpand,
  analysis,
  analysisLoading,
  onFetchAnalysis,
  onRestart,
}) {
  const totalQs = interviewConfig?.questionCount || 10;
  const avgScore =
    reviewData.length > 0 ? Math.round((reviewData.reduce((s, r) => s + (r.score || 0), 0) / (totalQs * 10)) * 100) : 0;
  const grade =
    avgScore >= 90
      ? 'Excellent!'
      : avgScore >= 75
        ? 'Great Job!'
        : avgScore >= 50
          ? 'Good Effort!'
          : 'Keep Practicing!';
  const questionsAnswered = reviewData.length;
  const isEarlyExit = questionsAnswered < totalQs;

  // Auto-fetch analysis on mount (useEffect to avoid side-effects in render)
  useEffect(() => {
    if (!analysis && !analysisLoading) {
      onFetchAnalysis();
    }
  }, [analysis, analysisLoading, onFetchAnalysis]);

  return (
    <div className={styles.summaryPage}>
      {/* Header */}
      <div className={styles.resultsHeader}>
        <h1>
          📊 Interview <span className="gradient-text">Results</span>
        </h1>
        <p>
          {isEarlyExit
            ? `You exited early after answering ${questionsAnswered} of ${totalQs} questions.`
            : `Here's your comprehensive analysis across ${questionsAnswered} questions.`}
        </p>
      </div>

      {/* Score Card */}
      <ScoreCard
        avgScore={avgScore}
        scores={scores}
        questionsAnswered={questionsAnswered}
        totalQs={totalQs}
        grade={grade}
      />

      {/* AI Analysis Section */}
      {analysisLoading && <AnalysisLoading />}

      {analysis && (
        <>
          {/* Overall Verdict */}
          <VerdictCard analysis={analysis} />

          {/* Topic Breakdown */}
          <TopicBreakdown topicBreakdown={analysis.topicBreakdown} />

          {/* Strengths & Improvements */}
          <StrengthsImprovements strengthAreas={analysis.strengthAreas} improvementAreas={analysis.improvementAreas} />

          {/* Communication Feedback */}
          <CommunicationFeedback communicationFeedback={analysis.communicationFeedback} />

          {/* Next Steps */}
          <NextSteps nextSteps={analysis.nextSteps} mockInterviewTip={analysis.mockInterviewTip} />
        </>
      )}

      {/* Question-by-Question Review */}
      <QuestionReview
        reviewData={reviewData}
        expandedQuestions={expandedQuestions}
        onToggleExpand={onToggleQuestionExpand}
      />

      {/* Actions */}
      <div className={styles.resultActions}>
        <button className={styles.restartBtn} onClick={onRestart}>
          <HiOutlineRefresh /> Start New Interview
        </button>
      </div>
    </div>
  );
}
