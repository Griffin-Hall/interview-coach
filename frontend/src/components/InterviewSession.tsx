import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import type {
  AnalyzeResponse,
  InterviewType,
  QAExchange,
  Question,
  QuestionResponse
} from '../types';
import { analyzeAnswer, fetchQuestions } from '../services/api';
import { formatDuration } from '../utils/session';
import FeedbackPanel from './FeedbackPanel';
import QuestionView from './QuestionView';

export interface InterviewSessionResult {
  exchanges: QAExchange[];
  startedAt: string;
  endedAt: string;
  questionsAsked: number;
  answersAnalyzed: number;
  reason: 'completed' | 'ended_early';
}

interface InterviewSessionProps {
  type: InterviewType;
  onComplete: (result: InterviewSessionResult) => void;
  onExitToHome: () => void;
  onNewInterview: () => void;
  onQuestionAsked: (type: InterviewType) => void;
  onAnswerAnalyzed: (type: InterviewType) => void;
}

export default function InterviewSessionComponent({
  type,
  onComplete,
  onExitToHome,
  onNewInterview,
  onQuestionAsked,
  onAnswerAnalyzed
}: InterviewSessionProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [pagination, setPagination] = useState<{
    current: number;
    total: number;
    hasMore: boolean;
  } | null>(null);
  const [exchanges, setExchanges] = useState<QAExchange[]>([]);
  const [feedback, setFeedback] = useState<AnalyzeResponse | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpMode, setFollowUpMode] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [showSessionStats, setShowSessionStats] = useState(true);
  const [questionsAskedCount, setQuestionsAskedCount] = useState(0);
  const [answersAnalyzedCount, setAnswersAnalyzedCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startedAtRef = useRef(new Date().toISOString());
  const askedPromptIdsRef = useRef<Set<string>>(new Set());

  const registerAskedPrompt = useCallback(
    (promptId: string) => {
      if (askedPromptIdsRef.current.has(promptId)) {
        return;
      }

      askedPromptIdsRef.current.add(promptId);
      setQuestionsAskedCount((previous) => previous + 1);
      onQuestionAsked(type);
    },
    [onQuestionAsked, type]
  );

  const loadQuestion = useCallback(
    async (lastId?: string) => {
      try {
        setIsQuestionLoading(true);
        setError(null);

        const response: QuestionResponse = await fetchQuestions(type, lastId);

        setCurrentQuestion(response.question);
        setPagination(response.pagination);
        setFeedback(null);
        setFollowUpMode(false);
        setFollowUpQuestion(null);

        registerAskedPrompt(`base:${response.question.id}`);
      } catch (loadError) {
        console.error('Failed to load question', loadError);
        setError('Could not load the next question. Please retry.');
      } finally {
        setIsQuestionLoading(false);
      }
    },
    [registerAskedPrompt, type]
  );

  useEffect(() => {
    startedAtRef.current = new Date().toISOString();
    askedPromptIdsRef.current = new Set();
    setExchanges([]);
    setFeedback(null);
    setError(null);
    setFollowUpMode(false);
    setFollowUpQuestion(null);
    setQuestionsAskedCount(0);
    setAnswersAnalyzedCount(0);
    setElapsedSeconds(0);

    void loadQuestion();
  }, [loadQuestion, type]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const elapsed = Math.max(
        0,
        Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000)
      );
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const finalizeSession = useCallback(
    (reason: 'completed' | 'ended_early') => {
      onComplete({
        exchanges,
        startedAt: startedAtRef.current,
        endedAt: new Date().toISOString(),
        questionsAsked: questionsAskedCount,
        answersAnalyzed: answersAnalyzedCount,
        reason
      });
    },
    [answersAnalyzedCount, exchanges, onComplete, questionsAskedCount]
  );

  const handleSubmitAnswer = async (answer: string) => {
    if (!currentQuestion) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const activeQuestionText = followUpMode && followUpQuestion ? followUpQuestion : currentQuestion.text;

    try {
      const analysis = await analyzeAnswer({
        question: activeQuestionText,
        answer,
        interviewType: type
      });

      setFeedback(analysis);
      setAnswersAnalyzedCount((previous) => previous + 1);
      onAnswerAnalyzed(type);

      const exchange: QAExchange = {
        questionId: followUpMode
          ? `${currentQuestion.id}_followup_${exchanges.length + 1}`
          : currentQuestion.id,
        questionText: activeQuestionText,
        userAnswer: answer,
        aiStrengths: analysis.strengths,
        aiGaps: analysis.gaps,
        aiFollowUp: analysis.followUp
      };

      setExchanges((previous) => [...previous, exchange]);
    } catch (submitError) {
      if (axios.isAxiosError(submitError)) {
        const apiMessage = (submitError.response?.data as { error?: string } | undefined)?.error;
        setError(apiMessage || 'Analysis failed. Please try again.');
      } else {
        setError('Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextQuestion = () => {
    if (!pagination) {
      return;
    }

    if (pagination.hasMore && currentQuestion) {
      void loadQuestion(currentQuestion.id);
      return;
    }

    finalizeSession('completed');
  };

  const handleAnswerFollowUp = () => {
    if (!feedback || !currentQuestion) {
      return;
    }

    setFollowUpMode(true);
    setFollowUpQuestion(feedback.followUp);
    setFeedback(null);

    const promptId = `followup:${currentQuestion.id}:${exchanges.length + 1}`;
    registerAskedPrompt(promptId);
  };

  const handleSkip = () => {
    if (!pagination) {
      return;
    }

    if (pagination.hasMore && currentQuestion) {
      void loadQuestion(currentQuestion.id);
      return;
    }

    finalizeSession('completed');
  };

  const handleExitToHomeClick = () => {
    if (exchanges.length > 0) {
      const shouldExit = window.confirm(
        'Leave this interview and return to the landing page? Current run progress will be discarded.'
      );

      if (!shouldExit) {
        return;
      }
    }

    onExitToHome();
  };

  const handleEndSessionClick = () => {
    finalizeSession('ended_early');
  };

  const handleNewInterviewClick = () => {
    const shouldReset = window.confirm(
      'Start a new interview? This resets current session stats and exits this run.'
    );

    if (!shouldReset) {
      return;
    }

    onNewInterview();
  };

  const sessionStrengths = useMemo(
    () => exchanges.reduce((total, exchange) => total + exchange.aiStrengths.length, 0),
    [exchanges]
  );

  const sessionGaps = useMemo(
    () => exchanges.reduce((total, exchange) => total + exchange.aiGaps.length, 0),
    [exchanges]
  );

  const sessionScore = useMemo(() => {
    const denominator = sessionStrengths + sessionGaps;

    if (denominator === 0) {
      return 0;
    }

    return Math.round((sessionStrengths / denominator) * 100);
  }, [sessionGaps, sessionStrengths]);

  const presentedQuestion: Question | null = currentQuestion
    ? {
        ...currentQuestion,
        text: followUpMode && followUpQuestion ? followUpQuestion : currentQuestion.text,
        tags: followUpMode ? [] : currentQuestion.tags
      }
    : null;

  return (
    <section className="interview-shell fade-in">
      <header className="panel interview-toolbar">
        <div>
          <p className="panel-eyebrow">Interview Workspace</p>
          <h2 className="panel-title">Live Coaching Session</h2>
        </div>

        <div className="action-row">
          <button type="button" className="button button-secondary" onClick={handleExitToHomeClick}>
            Exit to Home
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setShowSessionStats((previous) => !previous)}
          >
            {showSessionStats ? 'Hide Session Stats' : 'View Session Stats'}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleEndSessionClick}
            disabled={isAnalyzing}
          >
            End Session / Summary
          </button>
          <button type="button" className="button button-primary" onClick={handleNewInterviewClick}>
            New Interview
          </button>
        </div>
      </header>

      {error ? <p className="notice notice-error">{error}</p> : null}

      <div className="interview-grid">
        <div className="workspace-column">
          {isQuestionLoading && !presentedQuestion ? (
            <article className="panel loading-shell">
              <div className="spinner" aria-hidden="true" />
              <p className="muted-text">Loading next question...</p>
            </article>
          ) : null}

          {presentedQuestion && pagination ? (
            <QuestionView
              question={presentedQuestion}
              interviewType={type}
              currentIndex={pagination.current}
              total={pagination.total}
              onSubmit={handleSubmitAnswer}
              onSkip={handleSkip}
              isLoading={isAnalyzing || isQuestionLoading}
              isFollowUp={followUpMode}
            />
          ) : null}
        </div>

        <aside className="side-column">
          {showSessionStats ? (
            <section className="panel panel-soft session-live-stats">
              <p className="panel-eyebrow">Current Run</p>
              <h3 className="panel-title">Session Stats</h3>
              <div className="stats-row">
                <div className="metric-chip">
                  <span className="metric-label">Questions Asked</span>
                  <span className="metric-value">{questionsAskedCount}</span>
                </div>
                <div className="metric-chip">
                  <span className="metric-label">Answers Analyzed</span>
                  <span className="metric-value">{answersAnalyzedCount}</span>
                </div>
              </div>
              <div className="stats-row">
                <div className="metric-chip">
                  <span className="metric-label">Score Proxy</span>
                  <span className="metric-value">{sessionScore}%</span>
                </div>
                <div className="metric-chip">
                  <span className="metric-label">Time Spent</span>
                  <span className="metric-value">{formatDuration(elapsedSeconds)}</span>
                </div>
              </div>
            </section>
          ) : null}

          <FeedbackPanel
            feedback={feedback}
            isLoading={isAnalyzing}
            onNextQuestion={handleNextQuestion}
            onAnswerFollowUp={handleAnswerFollowUp}
            hasMoreQuestions={pagination?.hasMore ?? false}
          />
        </aside>
      </div>
    </section>
  );
}
