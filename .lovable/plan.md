

## Fix: Desktop-Only Save Race Condition in Note.tsx

### Problem
There's a race condition on desktop where `contentBlocksRef` is synced via `useEffect` (runs AFTER render) but auto-save reads from it, causing stale data to be saved when typing fast. Mobile is NOT affected because it uses a different save flow.

---

### Change 1: Auto-save useEffect (Lines 2577-2597)
**Issue:** The auto-save timer fires 500ms after content changes, but reads from `contentBlocksRef` which may not be updated yet.

**Fix:** Capture `contentBlocks` and `audioUrls` at the moment the effect runs, then sync them to refs just before calling `saveNote()`.

```typescript
// Before (line 2588-2591)
const timer = setTimeout(() => {
  if (!isTransitioningRef.current) {
    saveNote();
  }
}, 500);

// After
const capturedContentBlocks = contentBlocks;
const capturedAudioUrls = audioUrls;

const timer = setTimeout(() => {
  if (!isTransitioningRef.current) {
    contentBlocksRef.current = capturedContentBlocks;
    audioUrlsRef.current = capturedAudioUrls;
    saveNote();
  }
}, 500);
```

---

### Change 2: Textarea onChange Handler (Lines 3222-3231)
**Issue:** When typing, `setContentBlocks` is called but `contentBlocksRef` is not updated immediately.

**Fix:** Sync ref immediately after state update.

```typescript
// Before (line 3227)
setContentBlocks(newBlocks);

// After
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks;
```

---

### Change 3: Backspace onKeyDown Handler (Lines 3241-3277)
**Issue:** When deleting images or merging text blocks via backspace, the ref is not synced.

**Fix:** Use direct block manipulation instead of functional updates and sync ref immediately.

```typescript
// Before (line 3249)
setContentBlocks(prev => prev.filter(b => b.id !== prevBlock.id));

// After
const newBlocks = contentBlocks.filter(b => b.id !== prevBlock.id);
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks;

// Before (lines 3258-3261)
setContentBlocks(prev => prev
  .filter(b => b.id !== block.id)
  .map(b => b.id === prevBlock.id ? { ...b, content: mergedContent } : b)
);

// After
const newBlocks = contentBlocks
  .filter(b => b.id !== block.id)
  .map(b => b.id === prevBlock.id ? { ...b, content: mergedContent } : b);
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks;
```

---

### Change 4: rewriteText Function (Lines 824-848)
**Issue:** After rewriting text, the ref is not synced with the new blocks.

**Fix:** Compute new blocks first, then set both state and ref.

```typescript
// Before (lines 826-837)
setContentBlocks(prev => {
  const imageBlocks = prev.filter(b => b.type === 'image');
  const rewrittenTextBlock = { ... };
  if (imageBlocks.length > 0) {
    const trailingTextBlock = { ... };
    return [rewrittenTextBlock, ...imageBlocks, trailingTextBlock];
  }
  return [rewrittenTextBlock, ...imageBlocks];
});

// After
const newBlocks = (() => {
  const imageBlocks = contentBlocks.filter(b => b.type === 'image');
  const rewrittenTextBlock = { ... };
  if (imageBlocks.length > 0) {
    const trailingTextBlock = { ... };
    return [rewrittenTextBlock, ...imageBlocks, trailingTextBlock];
  }
  return [rewrittenTextBlock, ...imageBlocks];
})();

setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks;
```

---

### Summary

| Change | Location | Fix |
|--------|----------|-----|
| 1 | Lines 2577-2597 | Capture content at effect time, sync to ref before save |
| 2 | Lines 3222-3231 | Sync ref immediately on textarea change |
| 3 | Lines 3241-3277 | Sync ref on backspace delete/merge |
| 4 | Lines 824-848 | Sync ref after rewrite completes |

This follows the established "sync ref immediately" pattern already used in `handleImageSelect` and other handlers in Note.tsx.

