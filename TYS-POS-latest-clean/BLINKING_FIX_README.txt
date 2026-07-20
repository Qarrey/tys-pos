TYS POS - Login Blinking / Redirect Loop Fix

Changes made:
1. Login now confirms both the Supabase session and an active POS profile before opening index.html.
2. Auth guard redirects only when no session exists.
3. Role guard no longer redirects back to login when the session exists but the profile query fails.
   It shows a Retry / Log Out message instead, preventing an endless login-index loop.
4. Admin UI and navigation wait for the same confirmed user profile.
5. Cashiers are allowed to open index.html, purchases.html and register.html.
6. Admin-only pages remain hidden until an active Admin role is confirmed.
7. Legacy service workers and caches are removed automatically.
8. The service worker is disabled during active development.
9. users.html now includes the role guard.

After uploading to GitHub Pages:
- Open the site and reload once.
- The included cleanup script automatically unregisters old service workers and clears old caches.
