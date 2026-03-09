import type { InterviewType, VisitStats } from '../types';
import { interviewTypeLabels } from '../utils/session';

interface VisitStatsWidgetProps {
  stats: VisitStats;
  className?: string;
}

export default function VisitStatsWidget({ stats, className }: VisitStatsWidgetProps) {
  const perTypeSummary = Object.entries(stats.perType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${count} ${interviewTypeLabels[type as InterviewType]}`)
    .join(' | ');

  const startedAt = new Date(stats.startedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <section className={`panel panel-soft ${className ?? ''}`.trim()}>
      <p className="panel-eyebrow">Current Session</p>
      <h3 className="panel-title">Live Interview Stats</h3>
      <p className="muted-text">
        {stats.answersAnalyzed} questions answered
        {perTypeSummary ? ` | ${perTypeSummary}` : ''}
      </p>

      <div className="stats-row">
        <div className="metric-chip">
          <span className="metric-label">Questions Asked</span>
          <span className="metric-value">{stats.questionsAsked}</span>
        </div>
        <div className="metric-chip">
          <span className="metric-label">Answers Analyzed</span>
          <span className="metric-value">{stats.answersAnalyzed}</span>
        </div>
      </div>

      <p className="micro-copy">Session started at {startedAt}. Resets on New Interview or refresh.</p>
    </section>
  );
}
