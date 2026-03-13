

## Two Fixes for Note.tsx

### Fix 1: NodeJS.Timeout TypeScript errors (Lines 278-291)
Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` for all 5 refs. This is a standard fix for environments where `@types/node` isn't available.

**Lines affected:** 278, 284, 285, 289, 291

```typescript
// Before
const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
// After
const recordingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

Same pattern for all 5 occurrences.

### Fix 2: Add ✕ cancel button for move note (after line 3020)
Insert a new block after the existing `showMoveNote` paragraph to add a close button visible only on mobile (`md:hidden`).

```typescript
{showMoveNote && (
  <button
    onClick={() => setShowMoveNote(false)}
    aria-label="Cancel move"
    className="absolute top-0 md:hidden"
    style={{
      right: `calc(30px + env(safe-area-inset-right))`
    }}
  >
    <span className="text-white text-[28px] font-light leading-none">✕</span>
  </button>
)}
```

