/**
 * Custom React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiServiceError } from '../services/api';
import { guestStorage, userStorage, notesCache } from '../services/storage';
import { User, Note, NoteListItem, Summary, CreateNoteRequest, UpdateNoteRequest, GenerateSummaryRequest } from '../types';

// User Hook
interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initializeUser: () => Promise<void>;
  clearUser: () => Promise<void>;
}

export const useUser = (): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedUser = await userStorage.getUser();
      if (storedUser) { setUser(storedUser); setIsLoading(false); return; }

      const guestId = await guestStorage.getGuestId();
      if (guestId) {
        try {
          const existingUser = await api.users.getByGuestId(guestId);
          await userStorage.setUser(existingUser);
          setUser(existingUser);
          setIsLoading(false);
          return;
        } catch { /* Guest ID not found, create new */ }
      }

      const newUser = await api.users.create({ is_guest: true });
      if (newUser.guest_id) await guestStorage.setGuestId(newUser.guest_id);
      await userStorage.setUser(newUser);
      setUser(newUser);
    } catch (err) {
      setError(err instanceof ApiServiceError ? err.detail : 'Failed to initialize user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearUser = useCallback(async () => {
    await guestStorage.clearGuestId();
    await userStorage.clearUser();
    setUser(null);
  }, []);

  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = await userStorage.getUser();
        if (storedUser) setUser(storedUser);
      } catch { /* No stored user */ }
      finally { setIsLoading(false); }
    };
    checkStoredUser();
  }, []);

  return { user, isLoading, error, initializeUser, clearUser };
};

// Notes Hook
interface UseNotesReturn {
  notes: NoteListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createNote: (data: CreateNoteRequest) => Promise<Note | null>;
  deleteNote: (noteId: number) => Promise<boolean>;
}

export const useNotes = (userId?: number): UseNotesReturn => {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNotes = await api.notes.list({ user_id: userId });
      setNotes(fetchedNotes);
      await notesCache.setNotes(fetchedNotes);
    } catch (err) {
      setError(err instanceof ApiServiceError ? err.detail : 'Failed to fetch notes');
      const cachedNotes = await notesCache.getNotes();
      if (cachedNotes.length > 0) setNotes(cachedNotes);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createNote = useCallback(async (data: CreateNoteRequest): Promise<Note | null> => {
    try {
      const note = await api.notes.create(data, userId);
      await refresh();
      return note;
    } catch (err) {
      setError(err instanceof ApiServiceError ? err.detail : 'Failed to create note');
      return null;
    }
  }, [userId, refresh]);

  const deleteNote = useCallback(async (noteId: number): Promise<boolean> => {
    try {
      await api.notes.delete(noteId);
      setNotes((prev: NoteListItem[]) => prev.filter((n: NoteListItem) => n.id !== noteId));
      return true;
    } catch (err) {
      setError(err instanceof ApiServiceError ? err.detail : 'Failed to delete note');
      return false;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { notes, isLoading, error, refresh, createNote, deleteNote };
};

// Single Note Hook
interface UseNoteReturn {
  note: Note | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateNote: (data: UpdateNoteRequest) => Promise<boolean>;
}

export const useNote = (noteId: number | undefined): UseNoteReturn => {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!noteId) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNote = await api.notes.get(noteId);
      setNote(fetchedNote);
    } catch (err) {
      setError(err instanceof ApiServiceError ? err.detail : 'Failed to fetch note');
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  const updateNote = useCallback(async (data: UpdateNoteRequest): Promise<boolean> => {
    if (!noteId) return false;
    try {
      const updatedNote = await api.notes.update(noteId, data);
      setNote(updatedNote);
      return true;
    } catch (err) {
      setError(err instanceof ApiServiceError ? err.detail : 'Failed to update note');
      return false;
    }
  }, [noteId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { note, isLoading, error, refresh, updateNote };
};

// Summary Hook
interface UseSummaryReturn {
  summaries: Summary[];
  currentSummary: Summary | null;
  isGenerating: boolean;
  progressMessage: string;
  error: string | null;
  generateSummary: (options?: GenerateSummaryRequest) => Promise<Summary | null>;
  loadSummaries: () => Promise<void>;
}

export const useSummary = (noteId: number | undefined): UseSummaryReturn => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadSummaries = useCallback(async () => {
    if (!noteId) return;
    try {
      const fetchedSummaries = await api.summaries.getForNote(noteId);
      setSummaries(fetchedSummaries);
      if (fetchedSummaries.length > 0) setCurrentSummary(fetchedSummaries[0]);
    } catch (err) {
      setError(err instanceof ApiServiceError ? err.detail : 'Failed to fetch summaries');
    }
  }, [noteId]);

  const generateSummary = useCallback(async (options?: GenerateSummaryRequest): Promise<Summary | null> => {
    if (!noteId) return null;
    setIsGenerating(true);
    setError(null);
    setProgressMessage('Starting summary generation...');
    try {
      const summary = await api.summaries.generateWithPolling(noteId, options, (status, message) => {
        if (status === 'pending') setProgressMessage('Waiting in queue...');
        else if (status === 'processing') setProgressMessage(message || 'AI is generating summary...');
        else if (status === 'completed') setProgressMessage('Summary complete!');
      });
      setCurrentSummary(summary);
      setSummaries((prev: Summary[]) => [summary, ...prev]);
      setProgressMessage('');
      return summary;
    } catch (err) {
      setError(err instanceof ApiServiceError ? err.detail : 'Failed to generate summary');
      setProgressMessage('');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [noteId]);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  return { summaries, currentSummary, isGenerating, progressMessage, error, generateSummary, loadSummaries };
};

// API Health Hook
interface UseApiHealthReturn {
  isConnected: boolean;
  isChecking: boolean;
  checkHealth: () => Promise<boolean>;
}

export const useApiHealth = (): UseApiHealthReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      await api.health.check();
      setIsConnected(true);
      return true;
    } catch {
      setIsConnected(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  return { isConnected, isChecking, checkHealth };
};
