export type InterviewType = 'cs_ops' | 'tech_support' | 'behavioral' | 'custom';
export type QuestionCategory = InterviewType;
export type CustomQuestionMode = 'job_description' | 'role_prompt';

export interface Question {
  id: string;
  category: QuestionCategory;
  text: string;
  tags?: string[];
}

export interface QuestionPagination {
  current: number;
  total: number;
  hasMore: boolean;
}

export interface QuestionResponse {
  question: Question;
  pagination: QuestionPagination;
}

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

export interface GenerateCustomQuestionsRequest {
  mode: CustomQuestionMode;
  input: string;
  questionCount?: number;
}

export interface GenerateCustomQuestionsResponse {
  roleLabel: string;
  questions: Question[];
  meta: AnalyzeMeta;
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
  id?: string;
  type: InterviewType;
  exchanges: QAExchange[];
  createdAt?: string;
  updatedAt?: string;
  durationSeconds?: number;
  questionsAsked?: number;
  answersAnalyzed?: number;
  reason?: 'completed' | 'ended_early';
  customRoleLabel?: string;
  customQuestionMode?: CustomQuestionMode;
}

export interface CategoryInfo {
  id: InterviewType;
  name: string;
  count: number;
}

export interface SavedSession {
  id: string;
  type: InterviewType;
  exchangeCount: number;
  createdAt: string;
}

export interface SessionListResponse {
  sessions: SavedSession[];
  total: number;
}

export interface SessionRunStats {
  questionsAnswered: number;
  strengthsCount: number;
  gapsCount: number;
  averageScore: number;
  timeSpentSeconds: number;
}

export interface VisitStats {
  questionsAsked: number;
  answersAnalyzed: number;
  perType: Record<InterviewType, number>;
  startedAt: string;
}
