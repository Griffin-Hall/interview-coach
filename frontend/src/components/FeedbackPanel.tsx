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
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-gray-400">Analyzing your answer...</p>
        <p className="text-sm text-gray-500">This may take a few seconds</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-semibold text-white mb-2">AI Feedback</h3>
        <p className="text-gray-400 max-w-xs">
          Submit your answer to receive AI-powered feedback on strengths, gaps, and follow-up questions.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>🤖</span> AI Feedback
      </h3>

      {/* Strengths */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Strengths
        </h4>
        <ul className="space-y-2">
          {feedback.strengths.map((strength, index) => (
            <li key={index} className="flex gap-3 text-gray-300 text-sm">
              <span className="text-green-500 flex-shrink-0">✓</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Gaps */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Areas to Improve
        </h4>
        <ul className="space-y-2">
          {feedback.gaps.map((gap, index) => (
            <li key={index} className="flex gap-3 text-gray-300 text-sm">
              <span className="text-amber-500 flex-shrink-0">•</span>
              <span>{gap}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Follow-up Question */}
      <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Follow-up Question
        </h4>
        <p className="text-gray-300 text-sm italic">{feedback.followUp}</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onAnswerFollowUp}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Answer Follow-up Question
        </button>
        <button
          onClick={onNextQuestion}
          disabled={!hasMoreQuestions}
          className="w-full py-3 px-4 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasMoreQuestions ? 'Next Question →' : 'Finish Interview'}
        </button>
      </div>
    </div>
  );
}
