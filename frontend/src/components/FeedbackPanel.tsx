import type { AnalyzeResponse } from '../types';

interface FeedbackPanelProps {
  feedback: AnalyzeResponse | null;
  isLoading: boolean;
  onNextQuestion: () => void;
  onAnswerFollowUp: () => void;
  hasMoreQuestions: boolean;
}

export default function FeedbackPanel({
  feedback,
  isLoading,
  onNextQuestion,
  onAnswerFollowUp,
  hasMoreQuestions
}: FeedbackPanelProps) {
  if (isLoading) {
    return (
      <aside className="panel feedback-panel loading-shell">
        <div className="spinner" aria-hidden="true" />
        <p className="panel-title">Analyzing answer</p>
        <p className="muted-text">Generating strengths, gaps, and a follow-up question.</p>
      </aside>
    );
  }

  if (!feedback) {
    return (
      <aside className="panel feedback-panel empty-state">
        <h3>AI Feedback</h3>
        <p>Submit an answer to see strengths, gaps, and a follow-up prompt here.</p>
      </aside>
    );
  }

  return (
    <aside className="panel feedback-panel slide-up">
      <header className="feedback-header">
        <p className="panel-eyebrow">Analysis</p>
        <h3>AI Feedback</h3>
      </header>

      {feedback.meta?.source === 'fallback' && feedback.meta.message ? (
        <div className="notice notice-warning">
          <p>{feedback.meta.message}</p>
        </div>
      ) : null}

      <section className="feedback-section">
        <p className="summary-label">Strengths</p>
        <ul className="summary-bullets summary-bullets-positive">
          {feedback.strengths.map((strength, index) => (
            <li key={`strength_${index}`}>{strength}</li>
          ))}
        </ul>
      </section>

      <section className="feedback-section">
        <p className="summary-label">Gaps</p>
        <ul className="summary-bullets summary-bullets-warning">
          {feedback.gaps.map((gap, index) => (
            <li key={`gap_${index}`}>{gap}</li>
          ))}
        </ul>
      </section>

      <section className="feedback-section followup-card">
        <p className="summary-label">Follow-up Question</p>
        <p>{feedback.followUp}</p>
      </section>

      <div className="feedback-actions">
        <button type="button" className="button button-secondary" onClick={onAnswerFollowUp}>
          Answer Follow-up
        </button>
        <button type="button" className="button button-primary" onClick={onNextQuestion}>
          {hasMoreQuestions ? 'Next Question' : 'Finish Interview'}
        </button>
      </div>
    </aside>
  );
}
