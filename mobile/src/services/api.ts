/**
 * API Service Layer - Centralized API communication using Axios.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

declare const __DEV__: boolean;
import { API_CONFIG } from '../constants';
import { User, CreateUserRequest, Note, NoteListItem, CreateNoteRequest, UpdateNoteRequest, Summary, GenerateSummaryRequest, HealthResponse, ApiError } from '../types';

export class ApiServiceError extends Error {
  status: number;
  detail: string;
  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
    this.detail = detail;
  }
}

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (__DEV__) console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error: Error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (__DEV__) console.log(`📥 ${response.status} ${response.config.url}`);
      return response;
    },
    (error: AxiosError<ApiError>) => {
      const status = error.response?.status || 500;
      const detail = error.response?.data?.detail || error.message;
      if (__DEV__) console.error(`❌ ${status}: ${detail}`);
      throw new ApiServiceError(`API Error: ${detail}`, status, detail);
    }
  );

  return client;
};

const apiClient = createApiClient();

// Health API
export const healthApi = {
  check: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>(API_CONFIG.ENDPOINTS.HEALTH);
    return response.data;
  },
};

// Users API
export const usersApi = {
  create: async (data?: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>(API_CONFIG.ENDPOINTS.USERS, data || {});
    return response.data;
  },
  getById: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`);
    return response.data;
  },
  getByGuestId: async (guestId: string): Promise<User> => {
    const response = await apiClient.get<User>(`${API_CONFIG.ENDPOINTS.USERS}/guest/${guestId}`);
    return response.data;
  },
};

// Notes API
export const notesApi = {
  list: async (params?: { user_id?: number; skip?: number; limit?: number; search?: string }): Promise<NoteListItem[]> => {
    const response = await apiClient.get<NoteListItem[]>(API_CONFIG.ENDPOINTS.NOTES, { params });
    return response.data;
  },
  get: async (noteId: number): Promise<Note> => {
    const response = await apiClient.get<Note>(`${API_CONFIG.ENDPOINTS.NOTES}/${noteId}`);
    return response.data;
  },
  create: async (data: CreateNoteRequest, userId?: number): Promise<Note> => {
    const params = userId ? { user_id: userId } : {};
    const response = await apiClient.post<Note>(API_CONFIG.ENDPOINTS.NOTES, data, { params });
    return response.data;
  },
  uploadPdf: async (file: { uri: string; name: string; type: string }, title?: string, userId?: number): Promise<Note> => {
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.type || 'application/pdf' } as any);
    const params: Record<string, string | number> = {};
    if (title) params.title = title;
    if (userId) params.user_id = userId;
    const response = await apiClient.post<Note>(`${API_CONFIG.ENDPOINTS.NOTES}/upload/pdf`, formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  update: async (noteId: number, data: UpdateNoteRequest): Promise<Note> => {
    const response = await apiClient.put<Note>(`${API_CONFIG.ENDPOINTS.NOTES}/${noteId}`, data);
    return response.data;
  },
  delete: async (noteId: number): Promise<void> => {
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.NOTES}/${noteId}`);
  },
};

// Summaries API
interface AsyncJobResponse {
  job_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  cached?: boolean;
  summary?: {
    id: number; content: string; summary_type: string; summary_length: string;
    summary_style?: string; ai_provider?: string; ai_model?: string; generation_time_ms?: number;
    token_count?: number; compression_ratio?: number; created_at?: string;
  };
  error?: string;
}

export const summariesApi = {
  generate: async (noteId: number, options?: GenerateSummaryRequest): Promise<Summary> => {
    const response = await apiClient.post<Summary>(`${API_CONFIG.ENDPOINTS.SUMMARIES}/notes/${noteId}`, options || {});
    return response.data;
  },
  generateAsync: async (noteId: number, options?: GenerateSummaryRequest): Promise<AsyncJobResponse> => {
    const response = await apiClient.post<AsyncJobResponse>(`${API_CONFIG.ENDPOINTS.SUMMARIES}/notes/${noteId}/async`, options || {});
    return response.data;
  },
  getJobStatus: async (jobId: string): Promise<AsyncJobResponse> => {
    const response = await apiClient.get<AsyncJobResponse>(`${API_CONFIG.ENDPOINTS.SUMMARIES}/jobs/${jobId}`);
    return response.data;
  },
  generateWithPolling: async (noteId: number, options?: GenerateSummaryRequest, onProgress?: (status: string, message?: string) => void): Promise<Summary> => {
    if (onProgress) onProgress('pending', 'Starting summary job...');
    const job = await summariesApi.generateAsync(noteId, options);
    
    if (job.cached && job.summary) {
      if (onProgress) onProgress('completed', 'Using cached summary');
      return {
        id: job.summary.id, note_id: noteId, content: job.summary.content,
        summary_type: job.summary.summary_type as any, summary_length: job.summary.summary_length as any,
        ai_provider: job.summary.ai_provider || 'unknown', ai_model: job.summary.ai_model || 'cached',
        generation_time_ms: job.summary.generation_time_ms || 0, token_count: job.summary.token_count || 0,
        compression_ratio: job.summary.compression_ratio || 0, created_at: job.summary.created_at || new Date().toISOString(),
      };
    }
    
    if (!job.job_id) throw new Error('No job ID returned');
    
    const pollInterval = API_CONFIG.POLL_INTERVAL || 2000;
    const maxAttempts = 180;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      const status = await summariesApi.getJobStatus(job.job_id);
      
      if (onProgress) {
        const progressMsg = status.status === 'processing' ? `Processing... (${Math.round(status.progress)}%)` : status.status;
        onProgress(status.status, progressMsg);
      }
      
      if (status.status === 'completed' && status.summary) {
        return {
          id: status.summary.id, note_id: noteId, content: status.summary.content,
          summary_type: status.summary.summary_type as any, summary_length: status.summary.summary_length as any,
          ai_provider: status.summary.ai_provider || 'unknown', ai_model: status.summary.ai_model || 'unknown',
          generation_time_ms: status.summary.generation_time_ms || 0, token_count: status.summary.token_count || 0,
          compression_ratio: status.summary.compression_ratio || 0, created_at: status.summary.created_at || new Date().toISOString(),
        };
      }
      
      if (status.status === 'failed') throw new Error(status.error || 'Summary generation failed');
    }
    
    throw new Error('Summary generation timed out');
  },
  getForNote: async (noteId: number): Promise<Summary[]> => {
    const response = await apiClient.get<Summary[]>(`${API_CONFIG.ENDPOINTS.SUMMARIES}/notes/${noteId}`);
    return response.data;
  },
  get: async (summaryId: number): Promise<Summary> => {
    const response = await apiClient.get<Summary>(`${API_CONFIG.ENDPOINTS.SUMMARIES}/${summaryId}`);
    return response.data;
  },
  delete: async (summaryId: number): Promise<void> => {
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.SUMMARIES}/${summaryId}`);
  },
};

export const api = { health: healthApi, users: usersApi, notes: notesApi, summaries: summariesApi };
export default api;
