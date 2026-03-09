import { useRef, useState } from 'react';
import { generateCustomQuestions } from '../services/api';
import type { AnalyzeMeta, CustomQuestionMode, Question } from '../types';

export interface CustomInterviewConfig {
  roleLabel: string;
  questions: Question[];
  mode: CustomQuestionMode;
  sourceInput: string;
  generationMeta: AnalyzeMeta;
}

interface CustomInterviewBuilderProps {
  onStartCustom: (config: CustomInterviewConfig) => void;
}

const MIN_CUSTOM_INPUT_LENGTH = 30;

export default function CustomInterviewBuilder({ onStartCustom }: CustomInterviewBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);

  const validateInput = (value: string): string | null => {
    if (value.trim().length < MIN_CUSTOM_INPUT_LENGTH) {
      return `Please provide at least ${MIN_CUSTOM_INPUT_LENGTH} characters.`;
    }

    return null;
  };

  const createCustomInterview = async (mode: CustomQuestionMode, input: string) => {
    const validationError = validateInput(input);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNotice(null);

    try {
      const generated = await generateCustomQuestions({
        mode,
        input,
        questionCount: 6
      });

      onStartCustom({
        roleLabel: generated.roleLabel,
        questions: generated.questions,
        mode,
        sourceInput: input,
        generationMeta: generated.meta
      });
    } catch (generationError) {
      console.error('Failed to generate custom interview questions', generationError);
      setError('Could not generate custom questions right now. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      setJobDescription(content);
      setNotice(`Imported ${file.name}`);
      setError(null);
    } catch (fileError) {
      console.error('Failed reading imported file', fileError);
      setError('Could not read this file. Please use a plain text format.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section className="panel panel-soft custom-builder">
      <p className="panel-eyebrow">Custom</p>
      <h3 className="panel-title">Role-Specific Interview</h3>
      <p className="muted-text">
        Paste a job description or describe a role, and AI will generate targeted interview questions.
      </p>

      <label className="summary-label" htmlFor="custom-job-description">
        Job Description
      </label>
      <textarea
        id="custom-job-description"
        className="answer-textarea custom-input"
        value={jobDescription}
        onChange={(event) => {
          setJobDescription(event.target.value);
          if (error) {
            setError(null);
          }
        }}
        placeholder="Paste a job description here, then generate role-specific questions."
      />

      <div className="action-row">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating}
        >
          Import JD File
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => void createCustomInterview('job_description', jobDescription)}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Start from Custom'}
        </button>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setIsRoleFlyoutOpen(true)}
          disabled={isGenerating}
        >
          Describe Role
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json"
        className="visually-hidden"
        onChange={(event) => void handleImportFile(event)}
      />

      {notice ? <p className="micro-copy custom-notice">{notice}</p> : null}
      {error ? <p className="notice notice-error">{error}</p> : null}

      {isRoleFlyoutOpen ? (
        <div className="flyout-overlay" role="dialog" aria-modal="true" aria-label="Describe role">
          <div className="flyout-panel slide-up">
            <header className="flyout-header">
              <div>
                <p className="panel-eyebrow">Describe Role</p>
                <h3 className="panel-title">Create Questions from Role Prompt</h3>
              </div>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setIsRoleFlyoutOpen(false)}
                disabled={isGenerating}
              >
                Close
              </button>
            </header>

            <p className="muted-text">
              Example: Full stack engineer focused on React, Node.js, API design, and system reliability.
            </p>

            <label className="summary-label" htmlFor="role-description-input">
              Role Description
            </label>
            <textarea
              id="role-description-input"
              className="answer-textarea custom-input"
              value={roleDescription}
              onChange={(event) => {
                setRoleDescription(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Describe the role and interview style you want to practice."
            />

            <div className="action-row">
              <button
                type="button"
                className="button button-primary"
                onClick={() => void createCustomInterview('role_prompt', roleDescription)}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Questions'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
