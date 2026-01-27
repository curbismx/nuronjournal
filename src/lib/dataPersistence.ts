/**
 * Centralized Data Persistence Service
 * 
 * This service handles ALL data operations with:
 * - Backup-first approach (localStorage before Supabase)
 * - Verification after saves
 * - Retry logic with exponential backoff
 * - Recovery from orphaned backups
 * - Debug logging
 */

import { supabase } from '@/integrations/supabase/client';

type ContentBlock =
  | { type: 'text'; id: string; content: string }
  | { type: 'image'; id: string; url: string; width: number };

interface NoteData {
  id: string;
  title: string;
  contentBlocks: ContentBlock[];
  createdAt: string;
  updatedAt: string;
  weather?: { temp: number; weatherCode: number };
  audio_data?: string;
  folder_id?: string | null;
  is_published?: boolean;
}

interface SaveOptions {
  userId: string;
  isNewNote: boolean;
  folderId?: string | null;
  isEmbedded?: boolean;
}

// === Debug Logging ===

const DEBUG_LOG_KEY = 'nuron-debug-logs';
const MAX_LOG_ENTRIES = 50;

function log(operation: string, details: Record<string, any>) {
  const entry = {
    timestamp: new Date().toISOString(),
    operation,
    ...details
  };
  
  console.log(`[DataPersistence] ${operation}:`, details);
  
  try {
    const logs = JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || '[]');
    logs.unshift(entry);
    // Keep only the last MAX_LOG_ENTRIES
    while (logs.length > MAX_LOG_ENTRIES) {
      logs.pop();
    }
    localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('[DataPersistence] Failed to write debug log:', e);
  }
}

export function getDebugLogs(): any[] {
  try {
    return JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearDebugLogs(): void {
  localStorage.removeItem(DEBUG_LOG_KEY);
}

// === Backup Management ===

const BACKUP_PREFIX = 'nuron-note-backup-';

function createBackup(noteData: NoteData): void {
  const key = `${BACKUP_PREFIX}${noteData.id}`;
  const imageCount = noteData.contentBlocks.filter(b => b.type === 'image').length;
  
  log('backup-create', { 
    noteId: noteData.id, 
    imageCount,
    hasAudio: !!noteData.audio_data,
    titleLength: noteData.title?.length || 0
  });
  
  localStorage.setItem(key, JSON.stringify({
    ...noteData,
    backupCreatedAt: new Date().toISOString()
  }));
}

function removeBackup(noteId: string): void {
  const key = `${BACKUP_PREFIX}${noteId}`;
  localStorage.removeItem(key);
  log('backup-remove', { noteId });
}

function getBackup(noteId: string): NoteData | null {
  const key = `${BACKUP_PREFIX}${noteId}`;
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[DataPersistence] Failed to parse backup:', e);
  }
  return null;
}

function getAllBackups(): { noteId: string; data: NoteData }[] {
  const backups: { noteId: string; data: NoteData }[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_PREFIX)) {
      try {
        const noteId = key.replace(BACKUP_PREFIX, '');
        const data = JSON.parse(localStorage.getItem(key) || '');
        backups.push({ noteId, data });
      } catch (e) {
        console.error('[DataPersistence] Failed to parse backup for key:', key);
      }
    }
  }
  
  return backups;
}

// === Verification ===

async function verifySupabaseSave(noteId: string, expectedImageCount: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('content_blocks')
      .eq('id', noteId)
      .single();
    
    if (error || !data) {
      log('verify-failed', { noteId, error: error?.message || 'No data returned' });
      return false;
    }
    
    const savedBlocks = data.content_blocks as ContentBlock[];
    const savedImageCount = savedBlocks.filter(b => b.type === 'image').length;
    
    const verified = savedImageCount >= expectedImageCount;
    
    log('verify-result', { 
      noteId, 
      expectedImageCount, 
      savedImageCount, 
      verified 
    });
    
    return verified;
  } catch (e) {
    log('verify-error', { noteId, error: (e as Error).message });
    return false;
  }
}

// === Main Save Function ===

export async function saveNote(
  noteData: NoteData,
  options: SaveOptions
): Promise<{ success: boolean; error?: string }> {
  const { userId, isNewNote, folderId, isEmbedded } = options;
  const imageCount = noteData.contentBlocks.filter(b => b.type === 'image').length;
  
  log('save-start', { 
    noteId: noteData.id, 
    imageCount,
    isNewNote,
    folderId,
    titleLength: noteData.title?.length || 0
  });
  
  // Step 1: Create backup BEFORE attempting save
  createBackup(noteData);
  
  // Step 2: Build upsert data
  const upsertData: any = {
    id: noteData.id,
    user_id: userId,
    title: noteData.title,
    content_blocks: noteData.contentBlocks,
    created_at: noteData.createdAt,
    updated_at: noteData.updatedAt,
    weather: noteData.weather,
    audio_data: noteData.audio_data || null
  };
  
  // Only set folder_id for new notes
  if (isNewNote && folderId && folderId !== 'local-notes') {
    upsertData.folder_id = folderId;
    upsertData.is_published = false;
  }
  
  // Step 3: Retry save up to 3 times
  let lastError: string | null = null;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    log('save-attempt', { noteId: noteData.id, attempt });
    
    const { error } = await supabase.from('notes').upsert(upsertData);
    
    if (!error) {
      // Step 4: Verify the save
      const verified = await verifySupabaseSave(noteData.id, imageCount);
      
      if (verified) {
        // Success! Remove backup
        removeBackup(noteData.id);
        localStorage.setItem('nuron-has-created-note', 'true');
        
        // Update cache (only in non-embedded mode)
        if (!isEmbedded) {
          updateLocalCache(noteData);
        }
        
        log('save-success', { noteId: noteData.id, attempt });
        return { success: true };
      } else {
        lastError = 'Verification failed - saved data may be incomplete';
        log('save-verification-failed', { noteId: noteData.id, attempt });
      }
    } else {
      lastError = error.message;
      log('save-error', { noteId: noteData.id, attempt, error: error.message });
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  // All retries failed - keep backup for recovery
  log('save-failed', { noteId: noteData.id, error: lastError });
  return { success: false, error: lastError || 'Save failed after 3 attempts' };
}

// === Local Cache Management ===

function updateLocalCache(noteData: NoteData): void {
  try {
    const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
    const existingIndex = cached.findIndex((n: any) => n.id === noteData.id);
    
    if (existingIndex >= 0) {
      cached[existingIndex] = noteData;
    } else {
      cached.unshift(noteData);
    }
    
    localStorage.setItem('nuron-notes-cache', JSON.stringify(cached));
    log('cache-updated', { noteId: noteData.id });
  } catch (e) {
    log('cache-update-error', { noteId: noteData.id, error: (e as Error).message });
  }
}

// === Load Note with Fallback Chain ===

export async function loadNote(noteId: string): Promise<NoteData | null> {
  log('load-start', { noteId });
  
  // Try 1: Supabase
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();
    
    if (data && !error) {
      const noteData: NoteData = {
        id: data.id,
        title: data.title || '',
        contentBlocks: data.content_blocks as ContentBlock[],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        weather: data.weather as { temp: number; weatherCode: number } | undefined,
        audio_data: data.audio_data || undefined,
        folder_id: data.folder_id,
        is_published: data.is_published || false
      };
      log('load-success', { noteId, source: 'supabase' });
      return noteData;
    }
  } catch (e) {
    log('load-supabase-error', { noteId, error: (e as Error).message });
  }
  
  // Try 2: Local cache
  try {
    const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
    const cachedNote = cached.find((n: any) => n.id === noteId);
    if (cachedNote) {
      log('load-success', { noteId, source: 'cache' });
      return cachedNote;
    }
  } catch (e) {
    log('load-cache-error', { noteId, error: (e as Error).message });
  }
  
  // Try 3: localStorage (for non-logged-in users)
  try {
    const local = JSON.parse(localStorage.getItem('nuron-notes') || '[]');
    const localNote = local.find((n: any) => n.id === noteId);
    if (localNote) {
      log('load-success', { noteId, source: 'localStorage' });
      return localNote;
    }
  } catch (e) {
    log('load-localStorage-error', { noteId, error: (e as Error).message });
  }
  
  // Try 4: Backup
  const backup = getBackup(noteId);
  if (backup) {
    log('load-success', { noteId, source: 'backup' });
    return backup;
  }
  
  log('load-failed', { noteId });
  return null;
}

// === Integrity Check and Recovery ===

export async function runIntegrityCheck(): Promise<{ recovered: number; issues: string[] }> {
  const issues: string[] = [];
  let recovered = 0;
  
  log('integrity-check-start', {});
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    log('integrity-check-skip', { reason: 'No authenticated user' });
    return { recovered: 0, issues: ['No authenticated user'] };
  }
  
  const backups = getAllBackups();
  log('integrity-check-backups-found', { count: backups.length });
  
  for (const { noteId, data } of backups) {
    // Check if this backup has meaningful content
    const hasContent = data.title?.trim() || 
      data.contentBlocks.some(b => 
        b.type === 'image' || 
        (b.type === 'text' && b.content?.trim())
      ) ||
      data.audio_data;
    
    if (!hasContent) {
      // Empty backup, remove it
      removeBackup(noteId);
      continue;
    }
    
    // Check if note exists in database
    const { data: existingNote, error } = await supabase
      .from('notes')
      .select('id, content_blocks')
      .eq('id', noteId)
      .single();
    
    if (error || !existingNote) {
      // Note doesn't exist in DB - try to recover it
      log('integrity-check-recovering', { noteId });
      
      const result = await saveNote(data, {
        userId: session.user.id,
        isNewNote: true,
        folderId: data.folder_id,
        isEmbedded: false
      });
      
      if (result.success) {
        recovered++;
        log('integrity-check-recovered', { noteId });
      } else {
        issues.push(`Failed to recover note ${noteId}: ${result.error}`);
      }
    } else {
      // Note exists - check if backup has more images
      const backupImageCount = data.contentBlocks.filter(b => b.type === 'image').length;
      const dbBlocks = existingNote.content_blocks as ContentBlock[];
      const dbImageCount = dbBlocks.filter(b => b.type === 'image').length;
      
      if (backupImageCount > dbImageCount) {
        // Backup has more images - restore from backup
        log('integrity-check-image-mismatch', { 
          noteId, 
          backupImages: backupImageCount, 
          dbImages: dbImageCount 
        });
        
        const result = await saveNote(data, {
          userId: session.user.id,
          isNewNote: false,
          folderId: data.folder_id,
          isEmbedded: false
        });
        
        if (result.success) {
          recovered++;
          log('integrity-check-restored-images', { noteId });
        } else {
          issues.push(`Failed to restore images for note ${noteId}: ${result.error}`);
        }
      } else {
        // DB is up to date, remove backup
        removeBackup(noteId);
      }
    }
  }
  
  log('integrity-check-complete', { recovered, issueCount: issues.length });
  return { recovered, issues };
}

// === Count Images Helper ===

export function countImages(contentBlocks: ContentBlock[]): number {
  return contentBlocks.filter(b => b.type === 'image').length;
}
