import { useState, useRef, useEffect } from 'react';
import type { Question, InterviewType } from '../types';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface QuestionViewProps {
  question: Question;
  interviewType: InterviewType;
  currentIndex: number;
  total: number;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  isLoading: boolean;
}

const typeLabels: Record<InterviewType, string> = {
  cs_ops: 'Customer Support',
  tech_support: 'Tech Support',
  behavioral: 'Behavioral'
};

const typeColors: Record<InterviewType, string> = {
  cs_ops: 'bg-green-500/20 text-green-400 border-green-500/30',
  tech_support: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  behavioral: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
};

export default function QuestionView({
  question,
  interviewType,
  currentIndex,
  total,
  onSubmit,
  onSkip,
  isLoading
}: QuestionViewProps) {
  const [answer, setAnswer] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    isListening,
    transcript,
    interimTranscript,
    error: sttError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechToText();

  // Sync transcript with answer
  useEffect(() => {
    if (transcript || interimTranscript) {
      setAnswer((prev) => {
        const base = prev.endsWith(' ') || prev === '' ? prev : prev + ' ';
        return base + transcript + interimTranscript;
      });
    }
  }, [transcript, interimTranscript]);

  // Reset when question changes
  useEffect(() => {
    setAnswer('');
    resetTranscript();
  }, [question.id, resetTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !isLoading) {
      // Stop recording if active
      if (isListening) {
        stopListening();
      }
      onSubmit(answer.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[interviewType]}`}>
            {typeLabels[interviewType]}
          </span>
          <span className="text-gray-400 text-sm">
            Question {currentIndex} of {total}
          </span>
        </div>
        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentIndex / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-800 rounded-xl p-6 mb-4">
        <h2 className="text-xl text-white font-medium leading-relaxed">
          {question.text}
        </h2>
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {question.tags.map((tag) => (
              <span key={tag} className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tips for behavioral */}
      {interviewType === 'behavioral' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-400">
            <span className="font-semibold">💡 STAR Method Reminder:</span> Structure your answer with
            <span className="font-medium"> Situation</span>,{' '}
            <span className="font-medium">Task</span>,{' '}
            <span className="font-medium">Action</span>, and{' '}
            <span className="font-medium">Result</span>
          </p>
        </div>
      )}

      {/* Speech-to-text error */}
      {sttError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">⚠️ {sttError}</p>
        </div>
      )}

      {/* Answer Input */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here... (Ctrl+Enter to submit)"
            className="w-full h-full bg-gray-800 text-white placeholder-gray-500 rounded-xl p-4 resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          
          {/* Recording indicator */}
          {isListening && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-400 font-medium">Recording...</span>
            </div>
          )}
          
          <div className="absolute bottom-3 right-3 text-xs text-gray-500">
            {answer.length} chars
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSkip}
              disabled={isLoading}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Skip question
            </button>
            
            {/* Voice input button */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {isListening ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Record Answer
                  </>
                )}
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!answer.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </>
            ) : (
              'Submit Answer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
