

## Comprehensive Data Persistence Overhaul

This plan implements a bulletproof data persistence system to prevent image loss and data corruption. The root cause of issues is the lack of a unified save/verification system across multiple data channels (React state, refs, localStorage, Supabase, postMessage).

---

## Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                   Current Problem                                │
├─────────────────────────────────────────────────────────────────┤
│  Multiple save paths:                                            │
│  • React state updates → useEffect auto-save                    │
│  • Direct saveNote() calls                                       │
│  • postMessage to parent                                         │
│  • localStorage writes                                           │
│                                                                  │
│  No verification that data actually persisted                   │
│  No recovery mechanism for failed saves                         │
│  Refs can be out of sync with state                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Solution                                       │
├─────────────────────────────────────────────────────────────────┤
│  1. Create centralized dataPersistence service                  │
│  2. Backup-first approach (localStorage before Supabase)        │
│  3. Verify saves by reading back from database                  │
│  4. Keep backups until verification succeeds                    │
│  5. Recover lost data on app startup                            │
│  6. Sync refs immediately after state changes                   │
│  7. Log everything for debugging                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Create Data Persistence Service

### New File: `src/lib/dataPersistence.ts`

This centralized service handles ALL data operations:

| Function | Purpose |
|----------|---------|
| `saveNote()` | Single entry point for all saves with backup, retry, and verification |
| `loadNote()` | Multi-source loading with fallback chain |
| `runIntegrityCheck()` | Startup recovery from backups |
| `getDebugLogs()` | Retrieve last 50 log entries |
| `clearDebugLogs()` | Clear debug history |

**Key Features:**
- Logs every operation to `nuron-debug-logs` localStorage (last 50 entries)
- Always creates backup in localStorage BEFORE attempting Supabase save
- Retries Supabase saves up to 3 times with exponential backoff
- VERIFIES each save by reading back and comparing image counts
- Only removes backup after verified success
- Fallback chain: Supabase → cache → localStorage → backup

---

## Part 2: Update Note.tsx

### 2.1 Import the Service
```typescript
import { saveNote as persistNote, loadNote as fetchNote, runIntegrityCheck } from '@/lib/dataPersistence';
```

### 2.2 Replace saveNote Function (around line 2311)

The new `saveNote` function will:
1. Sync refs with current state BEFORE capturing values
2. Create backup immediately
3. Use the centralized `persistNote()` function
4. Handle success/failure appropriately
5. Notify parent window as before

### 2.3 Add Explicit Save After Image Insert

After `handleImageSelect` completes (around line 2700), add:
```typescript
// EXPLICIT SAVE after image is added
setTimeout(() => {
  console.log('[Note] Explicit save after image add');
  saveNoteRef.current?.();
}, 200);
```

### 2.4 Sync contentBlocksRef Immediately

Update these locations to sync the ref immediately after setState:

| Location | Line | Context |
|----------|------|---------|
| Image insert at cursor | ~2666 | `setContentBlocks(newBlocks); contentBlocksRef.current = newBlocks;` |
| Image append to end | ~2685 | After setContentBlocks in fallback path |
| After audio recording | ~1157 | After transcription content update |
| After rewrite | ~809 | After rewritten content replaces text blocks |

### 2.5 Add Integrity Check on Startup

New useEffect after other initialization effects:
```typescript
useEffect(() => {
  const checkIntegrity = async () => {
    const { recovered, issues } = await runIntegrityCheck();
    if (recovered > 0) {
      toast.success(`Recovered ${recovered} note(s) from backup`);
    }
  };
  
  if (!isEmbedded) {
    checkIntegrity();
  }
}, []);
```

---

## Part 3: Update Index.tsx

### 3.1 Import the Service
```typescript
import { runIntegrityCheck, getDebugLogs } from '@/lib/dataPersistence';
```

### 3.2 Add Integrity Check on Startup

New useEffect triggered when user is authenticated:
```typescript
useEffect(() => {
  const checkIntegrity = async () => {
    if (!user) return;
    
    const { recovered, issues } = await runIntegrityCheck();
    
    if (recovered > 0) {
      toast.success(`Recovered ${recovered} note(s) from backup`);
      // Reload notes to show recovered content
      const stored = localStorage.getItem('nuron-notes-cache');
      if (stored) {
        setSavedNotes(JSON.parse(stored));
      }
    }
  };
  
  checkIntegrity();
}, [user]);
```

### 3.3 Add Debug Log Viewer (Optional)

Add to Settings section for troubleshooting:
```typescript
<button
  onClick={() => {
    const logs = getDebugLogs();
    console.log('=== NURON DEBUG LOGS ===');
    logs.forEach((log: any) => console.log(log));
    toast.info(`${logs.length} log entries printed to console`);
  }}
  className="w-full py-3 px-4 rounded-xl bg-white/10 text-white/80 text-left font-outfit"
>
  View Debug Logs (Console)
</button>
```

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/dataPersistence.ts` | **NEW** | Centralized data service (~300 lines) |
| `src/pages/Note.tsx` | **MODIFY** | Import service, replace saveNote, add ref syncs, add integrity check |
| `src/pages/Index.tsx` | **MODIFY** | Import service, add integrity check, add debug button |

---

## How This Fixes Image Loss

1. **Backup First**: Before any Supabase attempt, data is backed up to localStorage
2. **Verification**: After save, we READ BACK from database and compare image counts
3. **Retry**: Failed saves retry 3 times with exponential backoff
4. **Recovery**: On startup, we find orphaned backups and re-save them
5. **Ref Sync**: Immediately sync refs after state changes so async operations use fresh data
6. **Logging**: Every operation is logged for debugging

---

## Verification Scenarios

After implementation, these scenarios should work:

1. Add image to note → Close app → Reopen → Image is there
2. Add multiple images → Switch notes → Switch back → All images preserved
3. Add content offline → Kill app → Go online → Open app → Content recovered
4. Check debug logs → See verified save entries for each operation

