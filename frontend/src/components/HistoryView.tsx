import type { InterviewSession } from '../types';
import { formatSessionDate, interviewTypeLongLabels } from '../utils/session';

interface HistoryViewProps {
  sessions: InterviewSession[];
  onBack: () => void;
  onOpenSession: (session: InterviewSession) => void;
}

export default function HistoryView({ sessions, onBack, onOpenSession }: HistoryViewProps) {
  return (
    <section className="history-layout fade-in">
      <header className="panel history-header">
        <div>
          <p className="panel-eyebrow">Interview History</p>
          <h2 className="panel-title">Current Browser Session</h2>
          <p className="muted-text">Stored in memory only. Refreshing the page clears this list.</p>
        </div>

        <button type="button" className="button button-secondary" onClick={onBack}>
          Back to Home
        </button>
      </header>

      {sessions.length === 0 ? (
        <article className="panel empty-state">
          <h3>No interviews yet</h3>
          <p>Finish at least one interview to populate your in-browser session history.</p>
        </article>
      ) : (
        <div className="history-list">
          {sessions.map((session) => (
            <article key={session.id} className="panel history-item">
              <div>
                <p className="history-type">
                  {session.customRoleLabel || interviewTypeLongLabels[session.type]}
                </p>
                <p className="muted-text">{formatSessionDate(session.updatedAt || session.createdAt)}</p>
                <p className="micro-copy">
                  {session.exchanges.length} analyzed answer
                  {session.exchanges.length === 1 ? '' : 's'}
                </p>
              </div>

              <button
                type="button"
                className="button button-secondary"
                onClick={() => onOpenSession(session)}
              >
                Open Summary
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
