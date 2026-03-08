export type InterviewType = 'cs_ops' | 'tech_support' | 'behavioral';
export type QuestionCategory = InterviewType;

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

export interface AnalyzeResponse {
  strengths: string[];
  gaps: string[];
  followUp: string;
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
