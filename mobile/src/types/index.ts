// User Types
export interface User {
  id: number;
  guest_id: string | null;
  email: string | null;
  display_name: string;
  is_guest: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  display_name?: string;
  email?: string;
  is_guest?: boolean;
}

// Note Types
export type NoteSourceType = 'text' | 'pdf' | 'upload';

export interface Note {
  id: number;
  title: string;
  content: string;
  source_type: NoteSourceType;
  original_filename: string | null;
  char_count: number;
  created_at: string;
  updated_at: string | null;
  user_id: number | null;
  summary_count: number;
}

export interface NoteListItem {
  id: number;
  title: string;
  source_type: NoteSourceType;
  char_count: number;
  created_at: string;
  summary_count: number;
  content_preview: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  source_type?: NoteSourceType;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

// Summary Types
export type SummaryStyle = 'best_fit' | 'technical' | 'casual';
export type SummaryType = 'summary' | 'key_points' | 'flashcards';

export interface Summary {
  id: number;
  note_id: number;
  content: string;
  summary_type: SummaryType;
  summary_length: string; // "auto" or line count as string
  summary_style?: SummaryStyle;
  ai_provider: string;
  ai_model: string;
  generation_time_ms: number | null;
  token_count: number | null;
  compression_ratio: number | null;
  created_at: string;
}

export interface GenerateSummaryRequest {
  line_count?: number | null; // null = AI decides
  summary_type?: SummaryType;
  summary_style?: SummaryStyle;
  force_regenerate?: boolean;
}

// API Types
export interface ApiError { detail: string; }
export interface HealthResponse { status: string; app_name: string; version: string; }

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Notes: undefined;
  NoteEditor: { noteId?: number };
  NoteDetail: { noteId: number };
  SummaryView: { noteId: number; summaryId?: number };
};

