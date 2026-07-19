# LexData complete relogin + registrations fix

This patch does four things:

1. Replaces deprecated/buggy middleware behavior with `proxy.ts` that preserves rotated Supabase cookies during redirects.
2. Adds `components/AuthSync.tsx` and mounts it in `app/layout.tsx`, so the browser refreshes tokens and server-rendered auth UI updates after login/logout/token refresh.
3. Replaces `/manager/registrations` with the clean registration-management page from the original registrations fix style, including confirm/reject and pagination.
4. Makes `lib/auth.ts` backward compatible with existing admin/manager actions by returning `user`, `profile`, `admin`, and top-level `id`.

## Apply

From PowerShell in your project root:

```powershell
Expand-Archive .\lexdata-complete-relogin-registration-patch.zip -DestinationPath .\_auth_fix -Force
.\_auth_fix\apply-fix.ps1
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

Then test:

- `/logout`
- `/login`
- `/auth-check`
- `/manager/registrations`
- `/login?next=%2Fmanager%2Fregistrations`
- `/admin`

Commit and push after the local build succeeds:

```powershell
git status
git add proxy.ts components/AuthSync.tsx app/layout.tsx app/login app/manager/registrations app/admin/registrations app/admin/page.tsx lib/auth.ts lib/supabase/client.ts
git add _backups/middleware.ts.disabled.txt
git commit -m "Fix Supabase relogin issue and restore registrations page"
git push origin main
```
