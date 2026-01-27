

## Fix: Image Saving in Note.tsx

### Problem
Images added to notes are not being saved properly because:
1. `contentBlocksRef` is not synced immediately after state update
2. No explicit save is triggered after adding an image

---

### Changes to `handleImageSelect` (Lines 2608-2702)

**Location:** `src/pages/Note.tsx`

The function needs 4 additions:

#### Addition 1: Sync ref after cursor-position insert (after line 2666)
```typescript
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks; // FIX: Sync ref immediately
```

#### Addition 2: Save after cursor-position insert (after textarea resize, before return)
```typescript
// FIX: Explicitly save after image is added
setTimeout(() => {
  saveNoteRef.current?.();
}, 100);
```

#### Addition 3: Change fallback block creation and sync ref (lines 2684-2689)
Replace the functional state update with direct assignment + ref sync:
```typescript
// Fallback: add to end if no cursor position
const newBlocks = [
  ...contentBlocks,
  { type: 'image' as const, id: imageId, url, width: 100 },
  { type: 'text' as const, id: newTextId, content: '' }
];
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks; // FIX: Sync ref immediately
```

#### Addition 4: Save after fallback insert (after textarea resize at end)
```typescript
// FIX: Explicitly save after image is added
setTimeout(() => {
  saveNoteRef.current?.();
}, 100);
```

---

### Summary of Fixes

| Location | Current Issue | Fix |
|----------|---------------|-----|
| Line 2666 | State set but ref not synced | Add `contentBlocksRef.current = newBlocks;` |
| After line 2678 | No save triggered | Add `saveNoteRef.current?.()` call |
| Lines 2685-2689 | Functional update doesn't sync ref | Use direct assignment + ref sync |
| End of function | No save triggered | Add `saveNoteRef.current?.()` call |

This follows the established "capture-at-start" and "sync ref immediately" patterns already used elsewhere in Note.tsx.

