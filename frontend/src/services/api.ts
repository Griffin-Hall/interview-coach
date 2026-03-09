import axios from 'axios';
import type {
  QuestionResponse,
  QuestionCategory,
  AnalyzeRequest,
  AnalyzeResponse,
  GenerateSpeechRequest,
  SpeechVoicesResponse,
  GenerateCustomQuestionsRequest,
  GenerateCustomQuestionsResponse,
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

export const generateCustomQuestions = async (
  data: GenerateCustomQuestionsRequest
): Promise<GenerateCustomQuestionsResponse> => {
  const response = await api.post('/questions/custom', data);
  return response.data;
};

export const generateSpeechAudio = async (data: GenerateSpeechRequest): Promise<Blob> => {
  try {
    const response = await api.post('/speech', data, {
      responseType: 'blob'
    });

    return response.data as Blob;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const contentType = error.response.headers?.['content-type'];

      if (typeof contentType === 'string' && contentType.includes('application/json')) {
        const bodyText = await error.response.data.text();

        try {
          const parsed = JSON.parse(bodyText) as { error?: string };
          throw new Error(parsed.error || 'Failed to generate speech audio.');
        } catch {
          throw new Error('Failed to generate speech audio.');
        }
      }
    }

    throw error;
  }
};

export const fetchSpeechVoices = async (): Promise<SpeechVoicesResponse> => {
  const response = await api.get('/speech/voices');
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
