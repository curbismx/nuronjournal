

## Fix: Sync contentBlocksRef in 4 Additional Locations

### Problem
Same race condition as previously fixed - `setContentBlocks` is called but `contentBlocksRef` is not immediately synced, which can cause stale data to be saved during auto-save.

---

### Change 1: Transcription Result Handler (Lines 1259-1270)
**Location:** Inside the transcription success callback

**Current Code:**
```typescript
setContentBlocks(prev => {
  // Remove placeholder
  const withoutPlaceholder = prev.filter(b => b.id !== transcriptionPlaceholderId);
  // Add transcribed text
  const lastBlock = withoutPlaceholder[withoutPlaceholder.length - 1];
  if (lastBlock && lastBlock.type === 'text') {
    const currentContent = (lastBlock as { type: 'text'; id: string; content: string }).content;
    const newContent = currentContent ? currentContent + ' ' + data.text : data.text;
    return [...withoutPlaceholder.slice(0, -1), { ...lastBlock, content: newContent }];
  }
  return [...withoutPlaceholder, { type: 'text', id: crypto.randomUUID(), content: data.text }];
});
```

**Updated Code:**
```typescript
const newBlocks = (() => {
  const withoutPlaceholder = contentBlocks.filter(b => b.id !== transcriptionPlaceholderId);
  const lastBlock = withoutPlaceholder[withoutPlaceholder.length - 1];
  if (lastBlock && lastBlock.type === 'text') {
    const currentContent = (lastBlock as { type: 'text'; id: string; content: string }).content;
    const newContent = currentContent ? currentContent + ' ' + data.text : data.text;
    return [...withoutPlaceholder.slice(0, -1), { ...lastBlock, content: newContent }];
  }
  return [...withoutPlaceholder, { type: 'text', id: crypto.randomUUID(), content: data.text }];
})();
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks;
```

---

### Change 2: Web Speech Stop Recording Cleanup (Lines 1939-1949)
**Location:** Inside the stopWebSpeechRecording cleanup logic

**Current Code:**
```typescript
// Convert interim markers to final text (keep the text, just remove ||)
setContentBlocks(prev => {
  const lastBlock = prev[prev.length - 1];
  if (lastBlock && lastBlock.type === 'text') {
    const content = (lastBlock as { type: 'text'; id: string; content: string }).content;
    // Replace || with space and trim - this keeps the interim text as final
    const cleanContent = content.replace(/\|\|/g, ' ').trim();
    return [...prev.slice(0, -1), { ...lastBlock, content: cleanContent }];
  }
  return prev;
});
```

**Updated Code:**
```typescript
// Convert interim markers to final text (keep the text, just remove ||)
const newBlocks = (() => {
  const lastBlock = contentBlocks[contentBlocks.length - 1];
  if (lastBlock && lastBlock.type === 'text') {
    const content = (lastBlock as { type: 'text'; id: string; content: string }).content;
    const cleanContent = content.replace(/\|\|/g, ' ').trim();
    return [...contentBlocks.slice(0, -1), { ...lastBlock, content: cleanContent }];
  }
  return contentBlocks;
})();
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks;
```

---

### Change 3: Mouse Image Resize Handler (Lines 2788-2790)
**Location:** Inside `handleMouseMove` in `startResizeMouse`

**Current Code:**
```typescript
setContentBlocks(prev => prev.map(b =>
  b.type === 'image' && b.id === id ? { ...b, width: newWidth } : b
));
```

**Updated Code:**
```typescript
const newBlocks = contentBlocks.map(b =>
  b.type === 'image' && b.id === id ? { ...b, width: newWidth } : b
);
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks;
```

---

### Change 4: Touch Image Resize Handler (Lines 2819-2821)
**Location:** Inside `handleTouchMove` in `startResizeTouch`

**Current Code:**
```typescript
setContentBlocks(prev => prev.map(b =>
  b.type === 'image' && b.id === id ? { ...b, width: newWidth } : b
));
```

**Updated Code:**
```typescript
const newBlocks = contentBlocks.map(b =>
  b.type === 'image' && b.id === id ? { ...b, width: newWidth } : b
);
setContentBlocks(newBlocks);
contentBlocksRef.current = newBlocks;
```

---

### Summary

| Change | Location | Context |
|--------|----------|---------|
| 1 | Lines 1259-1270 | Transcription result handler |
| 2 | Lines 1939-1949 | Web speech stop recording cleanup |
| 3 | Lines 2788-2790 | Mouse image resize handler |
| 4 | Lines 2819-2821 | Touch image resize handler |

All four changes follow the established "sync ref immediately" pattern to prevent stale data during auto-save.

