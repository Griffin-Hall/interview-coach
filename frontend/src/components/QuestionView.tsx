import { useEffect, useRef, useState } from 'react';
import type { InterviewType, Question, SpeechVoice } from '../types';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface QuestionViewProps {
  question: Question;
  interviewType: InterviewType;
  currentIndex: number;
  total: number;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  onReadAloud: () => void;
  readAloudVoice: SpeechVoice;
  availableVoices: SpeechVoice[];
  onReadAloudVoiceChange: (voice: SpeechVoice) => void;
  isReadingAloud: boolean;
  isGeneratingAudio: boolean;
  readAloudError: string | null;
  isLoading: boolean;
  isFollowUp?: boolean;
}

const MIN_ANSWER_LENGTH = 20;

const typeLabels: Record<InterviewType, string> = {
  cs_ops: 'Customer Support',
  tech_support: 'Technical Support',
  behavioral: 'Behavioral',
  custom: 'Custom Role'
};

export default function QuestionView({
  question,
  interviewType,
  currentIndex,
  total,
  onSubmit,
  onSkip,
  onReadAloud,
  readAloudVoice,
  availableVoices,
  onReadAloudVoiceChange,
  isReadingAloud,
  isGeneratingAudio,
  readAloudError,
  isLoading,
  isFollowUp = false
}: QuestionViewProps) {
  const [answer, setAnswer] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const spokenSoFarRef = useRef('');

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

  useEffect(() => {
    const combined = `${transcript}${interimTranscript}`.trim();

    if (!combined || combined === spokenSoFarRef.current) {
      return;
    }

    const addition = combined.startsWith(spokenSoFarRef.current)
      ? combined.slice(spokenSoFarRef.current.length).trim()
      : combined;

    if (addition) {
      setAnswer((previous) => {
        if (!previous.trim()) {
          return addition;
        }

        return `${previous.trimEnd()} ${addition}`;
      });
    }

    spokenSoFarRef.current = combined;
  }, [interimTranscript, transcript]);

  useEffect(() => {
    setAnswer('');
    setValidationError(null);
    resetTranscript();
    spokenSoFarRef.current = '';

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [question.id, question.text, resetTranscript]);

  const submitCurrentAnswer = () => {
    const trimmedAnswer = answer.trim();

    if (trimmedAnswer.length < MIN_ANSWER_LENGTH) {
      setValidationError(`Please provide at least ${MIN_ANSWER_LENGTH} characters before submitting.`);
      return;
    }

    setValidationError(null);

    if (isListening) {
      stopListening();
    }

    onSubmit(trimmedAnswer);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoading) {
      submitCurrentAnswer();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (!isLoading) {
        submitCurrentAnswer();
      }
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
      return;
    }

    resetTranscript();
    spokenSoFarRef.current = '';
    startListening();
  };

  const progress = total > 0 ? Math.min(100, Math.max(0, (currentIndex / total) * 100)) : 0;

  return (
    <section className="panel workspace-panel">
      <header className="question-header">
        <div>
          <p className="question-type">{typeLabels[interviewType]}</p>
          <h2>{isFollowUp ? 'Follow-up Prompt' : `Question ${currentIndex} of ${total}`}</h2>
        </div>
        <div className="progress-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <article className="question-card slide-up">
        <p>{question.text}</p>
        {question.tags && question.tags.length > 0 ? (
          <div className="tag-row">
            {question.tags.map((tag) => (
              <span key={`${question.id}_${tag}`} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>

      {interviewType === 'behavioral' ? (
        <aside className="notice notice-info">
          Use STAR for clarity: Situation, Task, Action, Result.
        </aside>
      ) : null}

      {sttError ? (
        <aside className="notice notice-error">Speech input: {sttError}</aside>
      ) : null}

      {readAloudError ? <aside className="notice notice-error">{readAloudError}</aside> : null}

      {validationError ? <aside className="notice notice-error">{validationError}</aside> : null}

      <form onSubmit={handleSubmit} className="answer-form">
        <label htmlFor="answer-input" className="summary-label">
          Your Answer
        </label>
        <div className="answer-area-wrap">
          <textarea
            id="answer-input"
            ref={textareaRef}
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              if (validationError) {
                setValidationError(null);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Write your response here. Press Ctrl+Enter to submit."
            className="answer-textarea"
          />
          <p className="char-count">{answer.length} chars</p>
        </div>

        <div className="form-actions">
          <div className="left-actions">
            <button type="button" className="button button-ghost" onClick={onSkip} disabled={isLoading}>
              Skip
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onReadAloud}
              disabled={isGeneratingAudio}
              title="Generate spoken audio for this question"
            >
              {isGeneratingAudio
                ? 'Loading Audio...'
                : isReadingAloud
                  ? 'Stop Audio'
                  : 'Read Aloud'}
            </button>
            <label className="voice-control">
              <span>Voice</span>
              <select
                value={readAloudVoice}
                className="voice-select"
                onChange={(event) => onReadAloudVoiceChange(event.target.value as SpeechVoice)}
                disabled={isGeneratingAudio || isReadingAloud}
                aria-label="Read aloud voice"
              >
                {availableVoices.map((voice) => (
                  <option key={voice} value={voice}>
                    {voice}
                  </option>
                ))}
              </select>
            </label>
            {isSupported ? (
              <button
                type="button"
                className={`button ${isListening ? 'button-danger' : 'button-secondary'}`}
                onClick={toggleRecording}
                disabled={isLoading}
              >
                {isListening ? 'Stop Recording' : 'Record Answer'}
              </button>
            ) : null}
          </div>
          <p className="micro-copy">Read aloud uses an AI-generated voice.</p>

          <button
            type="submit"
            className="button button-primary"
            disabled={isLoading || answer.trim().length === 0}
          >
            {isLoading ? 'Analyzing...' : 'Submit Answer'}
          </button>
        </div>
      </form>
    </section>
  );
}
