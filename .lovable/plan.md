

## Full-Screen Debug Log Viewer

Replace the current "View Debug Logs" button (which prints to console) with a full-screen overlay that displays logs directly in the app, making it usable on mobile devices.

---

## Overview

The debug log viewer will be a full-screen overlay that:
- Shows all log entries from `nuron-debug-logs` localStorage key
- Displays timestamp, operation name, and data for each entry
- Has a back button to close the viewer
- Has a clear button to delete all logs
- Uses the same visual styling as other settings panels

---

## Changes Required

### File 1: `src/lib/dataPersistence.ts`

No changes needed - `getDebugLogs()` and `clearDebugLogs()` already exist.

---

### File 2: `src/pages/Index.tsx`

#### 2.1 Add State Variable

Add a new state variable near other show/hide states (around line 351):

```typescript
const [showDebugLogs, setShowDebugLogs] = useState(false);
const [debugLogs, setDebugLogs] = useState<any[]>([]);
```

#### 2.2 Add Import for clearDebugLogs

Update the import from dataPersistence (line 78):

```typescript
import { runIntegrityCheck, getDebugLogs, clearDebugLogs } from '@/lib/dataPersistence';
```

#### 2.3 Update Back Button Logic

Update the back button click handler (around line 3461-3472) to handle the debug logs view:

```typescript
onClick={() => {
  if (showDebugLogs) {
    setShowDebugLogs(false);
  } else if (showChangePassword) {
    setShowChangePassword(false);
  } else if (showAccountDetails) {
    // ... rest of existing logic
```

#### 2.4 Update Header Title

Update the header title logic (around line 3491) to show "DEBUG LOGS" when active:

```typescript
{showDebugLogs ? 'DEBUG LOGS' : showChangePassword ? 'CHANGE PASSWORD' : ...}
```

#### 2.5 Update Back Icon Visibility

Update the condition for showing the back icon (around line 3476):

```typescript
{showDebugLogs || showSettings || showAccountDetails || showChangePassword || showFolders ? (
```

#### 2.6 Replace Debug Logs Button

Replace the existing button (lines 3826-3844) with one that opens the viewer:

```typescript
<button
  onClick={() => {
    setDebugLogs(getDebugLogs());
    setShowDebugLogs(true);
  }}
  className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-[10px] px-4 py-4 flex items-center justify-between transition-colors text-[20px] font-light"
>
  <span>View Debug Logs</span>
  <img src={accountArrow} alt="" className="w-[20px] h-[20px] opacity-60" />
</button>
```

#### 2.7 Add Debug Logs Panel

Add a new panel in the settings area (after the showSettings panel, around line 3631). This panel will display when `showDebugLogs` is true:

```typescript
{/* Debug Logs panel */}
<div 
  className={`absolute inset-x-0 top-[150px] bottom-0 px-8 pt-[80px] transition-opacity duration-200 overflow-hidden flex flex-col ${showDebugLogs ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
  style={{ backgroundColor: themeColors[theme] }}
>
  <div className="flex items-center justify-between mb-4">
    <span className="text-white/60 text-[14px] font-outfit">
      {debugLogs.length} log entries
    </span>
    <button
      onClick={() => {
        clearDebugLogs();
        setDebugLogs([]);
        toast.success('Debug logs cleared');
      }}
      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-[10px] text-[14px] font-outfit transition-colors"
    >
      Clear All
    </button>
  </div>
  
  <div className="flex-1 overflow-y-auto pb-[100px]">
    {debugLogs.length === 0 ? (
      <div className="text-white/40 text-center py-8 font-outfit">
        No debug logs yet
      </div>
    ) : (
      <div className="space-y-3">
        {debugLogs.map((log, index) => (
          <div 
            key={index} 
            className="bg-white/5 border border-white/10 rounded-[10px] p-4 font-mono text-[12px]"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-white/90 font-semibold">
                {log.operation}
              </span>
              <span className="text-white/40 text-[10px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <pre className="text-white/60 whitespace-pre-wrap break-all overflow-x-auto">
              {JSON.stringify(
                Object.fromEntries(
                  Object.entries(log).filter(([key]) => key !== 'operation' && key !== 'timestamp')
                ),
                null,
                2
              )}
            </pre>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```

---

## Visual Design

| Element | Style |
|---------|-------|
| Background | Theme color (same as settings) |
| Log entry card | `bg-white/5 border border-white/10 rounded-[10px]` |
| Operation name | White, semibold, monospace |
| Timestamp | White/40, 10px, right-aligned |
| Data | White/60, 12px monospace, pre-formatted |
| Clear button | Red/20 bg, red text |
| Empty state | Centered, white/40 text |

---

## Summary

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add state, update back button, add debug logs panel |
| `src/lib/dataPersistence.ts` | No changes (already has required functions) |

This creates a mobile-friendly debug log viewer that integrates seamlessly with the existing settings navigation pattern.

