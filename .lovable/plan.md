
## Fix: Default Folder Empty on Login

### Problem
When a user logs in, the notes list doesn't automatically reload because the `loadNotes` useEffect only depends on `currentFolder?.id`. Since the folder doesn't change on login, the notes from the database aren't fetched.

---

### Change in `src/pages/Index.tsx`

**Location:** Line 1048

**Before:**
```typescript
    loadNotes();
  }, [currentFolder?.id]);
```

**After:**
```typescript
    loadNotes();
  }, [currentFolder?.id, user]);
```

---

### Why This Works

| Trigger | Before | After |
|---------|--------|-------|
| Folder changes | Reloads notes | Reloads notes |
| User logs in | Does nothing | Reloads notes |
| User logs out | Does nothing | Reloads notes |

Adding `user` to the dependency array ensures that when the authentication state changes (user logs in or out), the `loadNotes` function runs again. This fetches the user's notes from Supabase after login, instead of showing an empty folder.

---

### Summary

| File | Line | Change |
|------|------|--------|
| `src/pages/Index.tsx` | 1048 | Add `user` to dependency array |
