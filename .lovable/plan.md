

## Fix: Debug Logs Panel Not Visible

### Problem

When clicking "View Debug Logs", the panel doesn't appear because:
- The Settings panel comes **after** the Debug Logs panel in the DOM
- When `showDebugLogs` becomes `true`, the Settings panel is still visible (`showSettings` is still `true`)
- Since both panels share the same position (`absolute top-[150px]`), the Settings panel covers the Debug Logs panel

### Solution

Update the **Settings panel visibility condition** to hide when Debug Logs is showing.

---

### File: `src/pages/Index.tsx`

**Change 1: Update Settings panel visibility (line 3692)**

Current:
```typescript
className={`... ${showSettings || showAccountDetails || showChangePassword ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
```

Updated:
```typescript
className={`... ${(showSettings || showAccountDetails || showChangePassword) && !showDebugLogs ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
```

This ensures the Settings panel hides when the Debug Logs panel is shown.

---

### Summary

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `&& !showDebugLogs` to Settings panel visibility condition (line 3692) |

This is a one-line fix that ensures the Debug Logs panel becomes visible by hiding the Settings panel that was covering it.

