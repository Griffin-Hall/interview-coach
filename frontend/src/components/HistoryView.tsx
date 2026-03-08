import { useState, useEffect } from 'react';
import type { SavedSession, InterviewSession, InterviewType } from '../types';
import { fetchSessions, fetchSession, deleteSession } from '../services/api';

interface HistoryViewProps {
  onBack: () => void;
}

const typeLabels: Record<InterviewType, string> = {
  cs_ops: 'Customer Support',
  tech_support: 'Tech Support',
  behavioral: 'Behavioral'
};

const typeColors: Record<InterviewType, string> = {
  cs_ops: 'bg-green-500/20 text-green-400',
  tech_support: 'bg-purple-500/20 text-purple-400',
  behavioral: 'bg-amber-500/20 text-amber-400'
};

export default function HistoryView({ onBack }: HistoryViewProps) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetchSessions();
      setSessions(response.sessions);
    } catch (err) {
      setError('Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetchSession(id);
      setSelectedSession(response.session);
    } catch (err) {
      setError('Failed to load session details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      setError('Failed to delete session');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportSession = (session: InterviewSession) => {
    const typeLabel = typeLabels[session.type];
    let markdown = `# Interview Session - ${typeLabel}\n\n`;
    markdown += `**Date:** ${formatDate(session.createdAt || '')}\n\n`;
    markdown += `**Questions:** ${session.exchanges.length}\n\n`;
    markdown += `---\n\n`;

    session.exchanges.forEach((exchange, index) => {
      markdown += `## Question ${index + 1}\n\n`;
      markdown += `**Q:** ${exchange.questionText}\n\n`;
      markdown += `**Your Answer:**\n${exchange.userAnswer}\n\n`;
      markdown += `### AI Feedback\n\n`;
      markdown += `**Strengths:**\n`;
      exchange.aiStrengths.forEach(s => {
        markdown += `- ${s}\n`;
      });
      markdown += `\n**Areas to Improve:**\n`;
      exchange.aiGaps.forEach(g => {
        markdown += `- ${g}\n`;
      });
      markdown += `\n**Follow-up Question:** ${exchange.aiFollowUp}\n\n`;
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-session-${session.type}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (selectedSession) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedSession(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to History
          </button>
          <button
            onClick={() => exportSession(selectedSession)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Export as Markdown
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[selectedSession.type]}`}>
              {typeLabels[selectedSession.type]}
            </span>
            <span className="text-gray-400 text-sm">
              {formatDate(selectedSession.createdAt || '')}
            </span>
          </div>
          <p className="text-gray-300">
            {selectedSession.exchanges.length} question{selectedSession.exchanges.length !== 1 ? 's' : ''} answered
          </p>
        </div>

        <div className="space-y-6">
          {selectedSession.exchanges.map((exchange, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Question {index + 1}
              </h3>
              <p className="text-gray-300 mb-4">{exchange.questionText}</p>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 mb-2">Your Answer:</p>
                <p className="text-white whitespace-pre-wrap">{exchange.userAnswer}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {exchange.aiStrengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-400 mb-2">Areas to Improve</h4>
                  <ul className="space-y-1">
                    {exchange.aiGaps.map((g, i) => (
                      <li key={i} className="text-sm text-gray-300">• {g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                <p className="text-sm text-blue-400 font-medium">Follow-up: {exchange.aiFollowUp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-white">Session History</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No sessions yet</p>
          <p className="text-sm">Complete an interview to see your history here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className="bg-gray-800 hover:bg-gray-750 rounded-xl p-4 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[session.type]}`}>
                  {typeLabels[session.type]}
                </span>
                <div>
                  <p className="text-white font-medium">
                    {session.exchangeCount} question{session.exchangeCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-400">{formatDate(session.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">View →</span>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  title="Delete session"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
