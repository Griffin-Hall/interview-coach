import axios from 'axios';
import type {
  QuestionResponse,
  QuestionCategory,
  AnalyzeRequest,
  AnalyzeResponse,
  CategoryInfo,
  SessionListResponse,
  InterviewSession,
  SavedSession
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Questions API
export const fetchQuestions = async (
  category: QuestionCategory,
  lastId?: string
): Promise<QuestionResponse> => {
  const params = new URLSearchParams();
  params.append('category', category);
  if (lastId) params.append('lastId', lastId);
  
  const response = await api.get(`/questions?${params.toString()}`);
  return response.data;
};

export const fetchCategories = async (): Promise<{ categories: CategoryInfo[] }> => {
  const response = await api.get('/questions/categories');
  return response.data;
};

// Analysis API
export const analyzeAnswer = async (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const response = await api.post('/analyze-answer', data);
  return response.data;
};

// Sessions API
export const fetchSessions = async (): Promise<SessionListResponse> => {
  const response = await api.get('/sessions');
  return response.data;
};

export const fetchSession = async (id: string): Promise<{ session: InterviewSession }> => {
  const response = await api.get(`/sessions/${id}`);
  return response.data;
};

export const saveSession = async (session: InterviewSession): Promise<{ session: SavedSession }> => {
  const response = await api.post('/sessions', session);
  return response.data;
};

export const deleteSession = async (id: string): Promise<void> => {
  await api.delete(`/sessions/${id}`);
};

export default api;
