import { useCallback, useEffect, useMemo, useState } from 'react';
import HistoryView from './components/HistoryView';
import InterviewSessionComponent, {
  type InterviewSessionResult
} from './components/InterviewSession';
import InterviewTypeSelector from './components/InterviewTypeSelector';
import SessionSummary from './components/SessionSummary';
import VisitStatsWidget from './components/VisitStatsWidget';
import { fetchCategories } from './services/api';
import type { CategoryInfo, InterviewSession, InterviewType, VisitStats } from './types';
import {
  createSessionId,
  formatSessionDate,
  interviewTypeLabels,
  interviewTypeLongLabels
} from './utils/session';
import './index.css';

type View = 'home' | 'interview' | 'history' | 'summary';

const createVisitStats = (): VisitStats => ({
  questionsAsked: 0,
  answersAnalyzed: 0,
  perType: {
    cs_ops: 0,
    tech_support: 0,
    behavioral: 0
  },
  startedAt: new Date().toISOString()
});

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<InterviewSession[]>([]);
  const [activeSummary, setActiveSummary] = useState<InterviewSession | null>(null);
  const [visitStats, setVisitStats] = useState<VisitStats>(() => createVisitStats());
  const [interviewKey, setInterviewKey] = useState(0);

  useEffect(() => {
    void loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchCategories();
      setCategories(response.categories);
    } catch (loadError) {
      console.error('Failed to load categories', loadError);
      setError('Could not load interview types. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (!selectedType) {
      return;
    }

    setInterviewKey((previous) => previous + 1);
    setCurrentView('interview');
  };

  const handleQuestionAsked = useCallback(() => {
    setVisitStats((previous) => ({
      ...previous,
      questionsAsked: previous.questionsAsked + 1,
      perType: previous.perType
    }));
  }, []);

  const handleAnswerAnalyzed = useCallback((type: InterviewType) => {
    setVisitStats((previous) => ({
      ...previous,
      answersAnalyzed: previous.answersAnalyzed + 1,
      perType: {
        ...previous.perType,
        [type]: previous.perType[type] + 1
      }
    }));
  }, []);

  const handleCompleteInterview = useCallback(
    (result: InterviewSessionResult) => {
      if (!selectedType) {
        return;
      }

      const durationSeconds = Math.max(
        0,
        Math.round(
          (new Date(result.endedAt).getTime() - new Date(result.startedAt).getTime()) / 1000
        )
      );

      const session: InterviewSession = {
        id: createSessionId(),
        type: selectedType,
        exchanges: result.exchanges,
        createdAt: result.startedAt,
        updatedAt: result.endedAt,
        durationSeconds,
        questionsAsked: result.questionsAsked,
        answersAnalyzed: result.answersAnalyzed,
        reason: result.reason
      };

      setSessionHistory((previous) => [session, ...previous]);
      setActiveSummary(session);
      setCurrentView('summary');
      setSelectedType(null);
    },
    [selectedType]
  );

  const handleExitInterviewToHome = () => {
    setSelectedType(null);
    setCurrentView('home');
  };

  const handleNewInterview = () => {
    setVisitStats(createVisitStats());
    setSelectedType(null);
    setActiveSummary(null);
    setCurrentView('home');
    setInterviewKey((previous) => previous + 1);
  };

  const openSessionSummary = (session: InterviewSession) => {
    setActiveSummary(session);
    setCurrentView('summary');
  };

  const sessionTypeBreakdown = useMemo(() => {
    const entries = Object.entries(visitStats.perType) as Array<[InterviewType, number]>;

    return entries
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `${count} ${interviewTypeLabels[type]}`)
      .join(' | ');
  }, [visitStats.perType]);

  const recentSessions = useMemo(() => sessionHistory.slice(0, 4), [sessionHistory]);

  const renderHomeView = () => {
    if (isLoading) {
      return (
        <section className="panel loading-shell fade-in">
          <div className="spinner" aria-hidden="true" />
          <p className="muted-text">Loading interview modes...</p>
        </section>
      );
    }

    if (error) {
      return (
        <section className="panel empty-state fade-in">
          <h3>{error}</h3>
          <button type="button" className="button button-primary" onClick={loadCategories}>
            Retry
          </button>
        </section>
      );
    }

    return (
      <div className="home-grid">
        <InterviewTypeSelector
          categories={categories}
          selectedType={selectedType}
          onSelect={setSelectedType}
          onStart={handleStartInterview}
        />

        <aside className="home-secondary">
          <VisitStatsWidget stats={visitStats} />

          <section className="panel panel-soft">
            <p className="panel-eyebrow">History Snapshot</p>
            <h3 className="panel-title">Recent Interviews</h3>
            {recentSessions.length === 0 ? (
              <p className="muted-text">No interview sessions completed in this tab yet.</p>
            ) : (
              <div className="mini-session-list">
                {recentSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className="mini-session-card"
                    onClick={() => openSessionSummary(session)}
                  >
                    <span>{interviewTypeLabels[session.type]}</span>
                    <span>{session.exchanges.length} answers</span>
                    <span>{formatSessionDate(session.updatedAt || session.createdAt)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="action-row action-row-compact">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setCurrentView('history')}
              >
                Open Full History
              </button>
            </div>
          </section>
        </aside>
      </div>
    );
  };

  const renderView = () => {
    switch (currentView) {
      case 'interview':
        if (!selectedType) {
          return (
            <section className="panel empty-state">
              <h3>No interview mode selected</h3>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setCurrentView('home')}
              >
                Return Home
              </button>
            </section>
          );
        }

        return (
          <InterviewSessionComponent
            key={`interview_${interviewKey}_${selectedType}`}
            type={selectedType}
            onComplete={handleCompleteInterview}
            onExitToHome={handleExitInterviewToHome}
            onNewInterview={handleNewInterview}
            onQuestionAsked={handleQuestionAsked}
            onAnswerAnalyzed={handleAnswerAnalyzed}
          />
        );

      case 'summary':
        if (!activeSummary) {
          return (
            <section className="panel empty-state">
              <h3>No session summary selected</h3>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setCurrentView('home')}
              >
                Return Home
              </button>
            </section>
          );
        }

        return (
          <SessionSummary
            session={activeSummary}
            onBackHome={() => setCurrentView('home')}
            onNewInterview={handleNewInterview}
            onViewHistory={() => setCurrentView('history')}
          />
        );

      case 'history':
        return (
          <HistoryView
            sessions={sessionHistory}
            onBack={() => setCurrentView('home')}
            onOpenSession={openSessionSummary}
          />
        );

      case 'home':
      default:
        return renderHomeView();
    }
  };

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-one" aria-hidden="true" />
      <div className="bg-orb bg-orb-two" aria-hidden="true" />

      <header className="app-header">
        <div className="app-header-inner">
          <button type="button" className="brand" onClick={() => setCurrentView('home')}>
            <span className="brand-kicker">AI Interview Coach</span>
            <span className="brand-title">Portfolio-Ready Practice Workspace</span>
          </button>

          <div className="header-right">
            <p className="header-stats">
              Current Session: {visitStats.answersAnalyzed} questions answered
              {sessionTypeBreakdown ? ` | ${sessionTypeBreakdown}` : ''}
            </p>

            <div className="action-row action-row-compact">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setCurrentView('history')}
              >
                History
              </button>
              <button type="button" className="button button-primary" onClick={handleNewInterview}>
                New Interview
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="layout-frame">{renderView()}</main>

      <footer className="app-footer">
        <p>
          In-memory experience for this tab only. Landing -&gt; interview -&gt; summary with copy-ready output.
        </p>
        {selectedType ? <p>Current mode: {interviewTypeLongLabels[selectedType]}</p> : null}
      </footer>
    </div>
  );
}

export default App;
