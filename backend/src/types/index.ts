import { QuestionCategory } from '../data/questions';

export type InterviewType = QuestionCategory;

export interface AnalyzeRequest {
  question: string;
  answer: string;
  interviewType: InterviewType;
}

export interface AnalyzeMeta {
  source: 'llm' | 'fallback';
  message?: string;
}

export interface AnalyzeResponse {
  strengths: string[];
  gaps: string[];
  followUp: string;
  meta?: AnalyzeMeta;
}

export interface QAExchange {
  questionId: string;
  questionText: string;
  userAnswer: string;
  aiStrengths: string[];
  aiGaps: string[];
  aiFollowUp: string;
}

export interface InterviewSession {
  id: string;
  type: InterviewType;
  exchanges: QAExchange[];
  createdAt: string;
  updatedAt: string;
}

export type CustomQuestionMode = 'job_description' | 'role_prompt';

export interface GeneratedCustomQuestion {
  id: string;
  category: 'custom';
  text: string;
  tags?: string[];
}

export interface GenerateCustomQuestionsRequest {
  mode: CustomQuestionMode;
  input: string;
  questionCount?: number;
}

export interface GenerateCustomQuestionsResponse {
  roleLabel: string;
  questions: GeneratedCustomQuestion[];
  meta: {
    source: 'llm' | 'fallback';
    message?: string;
  };
}
