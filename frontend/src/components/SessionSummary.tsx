import { useMemo, useState } from 'react';
import type { InterviewSession } from '../types';
import {
  buildSessionMarkdown,
  calculateSessionRunStats,
  formatDuration,
  formatInterviewType,
  formatSessionDate
} from '../utils/session';

interface SessionSummaryProps {
  session: InterviewSession;
  onBackHome: () => void;
  onNewInterview: () => void;
  onViewHistory: () => void;
}

export default function SessionSummary({
  session,
  onBackHome,
  onNewInterview,
  onViewHistory
}: SessionSummaryProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const stats = useMemo(() => calculateSessionRunStats(session), [session]);

  const handleCopySummary = async () => {
    const markdown = buildSessionMarkdown(session);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopyStatus('success');
      window.setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (error) {
      console.error('Failed to copy summary', error);
      setCopyStatus('error');
      window.setTimeout(() => setCopyStatus('idle'), 2500);
    }
  };

  return (
    <section className="summary-layout fade-in">
      <div className="summary-header panel">
        <div>
          <p className="panel-eyebrow">Session Summary</p>
          <h2 className="panel-title">{formatInterviewType(session.type)}</h2>
          <p className="muted-text">{formatSessionDate(session.createdAt)}</p>
        </div>

        <div className="action-row">
          <button type="button" className="button button-secondary" onClick={onBackHome}>
            Back to Modes
          </button>
          <button type="button" className="button button-secondary" onClick={onViewHistory}>
            View History
          </button>
          <button type="button" className="button button-secondary" onClick={handleCopySummary}>
            Copy Summary
          </button>
          <button type="button" className="button button-primary" onClick={onNewInterview}>
            New Interview
          </button>
        </div>

        {copyStatus === 'success' && (
          <p className="inline-feedback inline-feedback-success">
            Session summary copied to clipboard as Markdown.
          </p>
        )}
        {copyStatus === 'error' && (
          <p className="inline-feedback inline-feedback-error">
            Could not copy summary. Try again in a secure browser context.
          </p>
        )}
      </div>

      <div className="summary-metrics grid-3">
        <article className="panel panel-soft metric-card">
          <p className="metric-label">Questions Answered</p>
          <p className="metric-value">{stats.questionsAnswered}</p>
        </article>
        <article className="panel panel-soft metric-card">
          <p className="metric-label">Score Proxy</p>
          <p className="metric-value">{stats.averageScore}%</p>
          <p className="micro-copy">
            {stats.strengthsCount} strengths vs {stats.gapsCount} gaps
          </p>
        </article>
        <article className="panel panel-soft metric-card">
          <p className="metric-label">Time Spent</p>
          <p className="metric-value">{formatDuration(stats.timeSpentSeconds)}</p>
        </article>
      </div>

      {session.exchanges.length === 0 ? (
        <article className="panel empty-state">
          <h3>No analyzed answers yet</h3>
          <p>
            End this session once at least one answer is submitted to see strengths, gaps, and follow-up
            prompts.
          </p>
        </article>
      ) : (
        <div className="summary-list">
          {session.exchanges.map((exchange, index) => (
            <article key={`${exchange.questionId}_${index}`} className="panel summary-item">
              <header className="summary-item-header">
                <p className="panel-eyebrow">Question {index + 1}</p>
                <h3>{exchange.questionText}</h3>
              </header>

              <section className="summary-answer-block">
                <p className="summary-label">Your Answer</p>
                <p className="summary-answer-text">{exchange.userAnswer}</p>
              </section>

              <section className="summary-feedback-grid">
                <div>
                  <p className="summary-label">Strengths</p>
                  <ul className="summary-bullets summary-bullets-positive">
                    {exchange.aiStrengths.map((strength, strengthIndex) => (
                      <li key={`${exchange.questionId}_strength_${strengthIndex}`}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="summary-label">Gaps</p>
                  <ul className="summary-bullets summary-bullets-warning">
                    {exchange.aiGaps.map((gap, gapIndex) => (
                      <li key={`${exchange.questionId}_gap_${gapIndex}`}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="summary-followup">
                <p className="summary-label">Follow-up Question</p>
                <p>{exchange.aiFollowUp}</p>
              </section>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
