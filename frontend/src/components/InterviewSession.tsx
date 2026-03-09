import { useState, useEffect } from 'react';
import axios from 'axios';
import type { 
  InterviewType, 
  Question, 
  QuestionResponse, 
  QAExchange,
  AnalyzeResponse 
} from '../types';
import { fetchQuestions, analyzeAnswer } from '../services/api';
import QuestionView from './QuestionView';
import FeedbackPanel from './FeedbackPanel';

interface InterviewSessionProps {
  type: InterviewType;
  onComplete: (exchanges: QAExchange[]) => void;
  onExit: () => void;
}

export default function InterviewSessionComponent({ type, onComplete, onExit }: InterviewSessionProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [pagination, setPagination] = useState<{ current: number; total: number; hasMore: boolean } | null>(null);
  const [exchanges, setExchanges] = useState<QAExchange[]>([]);
  const [feedback, setFeedback] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpMode, setFollowUpMode] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);

  // Load first question on mount
  useEffect(() => {
    loadQuestion();
  }, [type]);

  const loadQuestion = async (lastId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response: QuestionResponse = await fetchQuestions(type, lastId);
      setCurrentQuestion(response.question);
      setPagination(response.pagination);
      setFeedback(null);
      setFollowUpMode(false);
      setFollowUpQuestion(null);
    } catch (err) {
      setError('Failed to load question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!currentQuestion) return;

    setIsLoading(true);
    setError(null);

    try {
      const questionText = followUpMode && followUpQuestion 
        ? followUpQuestion 
        : currentQuestion.text;

      const analysis = await analyzeAnswer({
        question: questionText,
        answer,
        interviewType: type
      });

      setFeedback(analysis);

      // Save exchange
      const exchange: QAExchange = {
        questionId: currentQuestion.id,
        questionText,
        userAnswer: answer,
        aiStrengths: analysis.strengths,
        aiGaps: analysis.gaps,
        aiFollowUp: analysis.followUp
      };

      setExchanges(prev => [...prev, exchange]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErrorMessage = (err.response?.data as { error?: string } | undefined)?.error;
        setError(apiErrorMessage || 'Failed to analyze answer. Please try again.');
      } else {
        setError('Failed to analyze answer. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!pagination) return;
    
    if (pagination.hasMore && currentQuestion) {
      loadQuestion(currentQuestion.id);
    } else {
      onComplete(exchanges);
    }
  };

  const handleAnswerFollowUp = () => {
    if (feedback) {
      setFollowUpMode(true);
      setFollowUpQuestion(feedback.followUp);
      setFeedback(null);
    }
  };

  const handleSkip = () => {
    if (pagination?.hasMore && currentQuestion) {
      loadQuestion(currentQuestion.id);
    } else {
      onComplete(exchanges);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-400 mb-4">⚠️ {error}</div>
        <button
          onClick={() => loadQuestion()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Exit
          </button>
          <h1 className="text-lg font-semibold text-white">Interview Session</h1>
        </div>
        <div className="text-sm text-gray-400">
          {exchanges.length} question{exchanges.length !== 1 ? 's' : ''} answered
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question & Answer */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentQuestion && pagination && (
            <QuestionView
              question={{
                ...currentQuestion,
                text: followUpQuestion || currentQuestion.text
              }}
              interviewType={type}
              currentIndex={pagination.current}
              total={pagination.total}
              onSubmit={handleSubmitAnswer}
              onSkip={handleSkip}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Right: Feedback Panel */}
        <div className="w-96 border-l border-gray-800 bg-gray-900/50">
          <FeedbackPanel
            feedback={feedback}
            isLoading={isLoading && !feedback}
            onNextQuestion={handleNextQuestion}
            onAnswerFollowUp={handleAnswerFollowUp}
            hasMoreQuestions={pagination?.hasMore || false}
          />
        </div>
      </div>
    </div>
  );
}
