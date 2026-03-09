import type { InterviewSession, InterviewType, SessionRunStats } from '../types';

export const interviewTypeLabels: Record<InterviewType, string> = {
  cs_ops: 'CS Ops',
  tech_support: 'Tech Support',
  behavioral: 'Behavioral'
};

export const interviewTypeLongLabels: Record<InterviewType, string> = {
  cs_ops: 'Customer Support Operations',
  tech_support: 'Technical Support / SaaS',
  behavioral: 'Behavioral (STAR)'
};

export function formatInterviewType(type: InterviewType): string {
  return interviewTypeLongLabels[type];
}

export function calculateSessionRunStats(session: InterviewSession): SessionRunStats {
  const strengthsCount = session.exchanges.reduce(
    (total, exchange) => total + exchange.aiStrengths.length,
    0
  );
  const gapsCount = session.exchanges.reduce((total, exchange) => total + exchange.aiGaps.length, 0);
  const denominator = strengthsCount + gapsCount;

  const averageScore = denominator > 0 ? Math.round((strengthsCount / denominator) * 100) : 0;

  const fallbackDurationSeconds =
    session.createdAt && session.updatedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(session.updatedAt).getTime() - new Date(session.createdAt).getTime()) / 1000
          )
        )
      : 0;

  return {
    questionsAnswered: session.exchanges.length,
    strengthsCount,
    gapsCount,
    averageScore,
    timeSpentSeconds: session.durationSeconds ?? fallbackDurationSeconds
  };
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatSessionDate(value?: string): string {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function buildSessionMarkdown(session: InterviewSession): string {
  const stats = calculateSessionRunStats(session);
  const heading = formatInterviewType(session.type);
  const lines: string[] = [
    `# AI Interview Session Summary`,
    '',
    `**Type:** ${heading}`,
    `**Date:** ${formatSessionDate(session.createdAt)}`,
    `**Questions Answered:** ${stats.questionsAnswered}`,
    `**Score Proxy:** ${stats.averageScore}% (${stats.strengthsCount} strengths / ${stats.gapsCount} gaps)`,
    `**Time Spent:** ${formatDuration(stats.timeSpentSeconds)}`,
    ''
  ];

  session.exchanges.forEach((exchange, index) => {
    lines.push(`## Question ${index + 1}`);
    lines.push('');
    lines.push(`**Prompt:** ${exchange.questionText}`);
    lines.push('');
    lines.push('**Your Answer:**');
    lines.push(exchange.userAnswer);
    lines.push('');
    lines.push('**Strengths:**');
    exchange.aiStrengths.forEach((strength) => {
      lines.push(`- ${strength}`);
    });
    lines.push('');
    lines.push('**Gaps:**');
    exchange.aiGaps.forEach((gap) => {
      lines.push(`- ${gap}`);
    });
    lines.push('');
    lines.push(`**Follow-up:** ${exchange.aiFollowUp}`);
    lines.push('');
  });

  return lines.join('\n');
}

export function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
