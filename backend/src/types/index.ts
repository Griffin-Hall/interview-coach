import { QuestionCategory } from '../data/questions';

export type InterviewType = QuestionCategory;

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
  id: string;
  type: InterviewType;
  exchanges: QAExchange[];
  createdAt: string;
  updatedAt: string;
}
