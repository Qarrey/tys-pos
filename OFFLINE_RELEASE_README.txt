TYS POS FINAL OFFLINE RELEASE
=============================
This release restores a versioned service worker and caches the POS pages and local JavaScript.

IMPORTANT:
1. Deploy to GitHub Pages, then open every important page once while online.
2. Refresh once and wait for Console: "TYS POS offline mode ready."
3. Test offline by turning off Wi-Fi after the pages have loaded once.
4. Existing local POS data remains available offline.
5. A first-time login still requires internet. Supabase cloud writes require internet unless that module already has its own queue.
6. Do not include js/disable-service-worker.js on any page; it intentionally unregisters the service worker.

Release cache: tys-pos-v1.0.0-final
