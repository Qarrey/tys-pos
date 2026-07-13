const CACHE_VERSION = 'tys-pos-v1.0.0-final';
const APP_SHELL = [
  './','./index.html','./login.html','./styles.css','./manifest.json','./app.js','./inventory-seed.js',
  './inventory.html','./stocktake.html','./register.html','./purchases.html','./suppliers.html','./customers.html','./expenses.html','./reports.html','./backup.html','./settings.html','./categories.html','./users.html','./returns.html','./stock.html','./stock-history.html','./alerts.html','./daily-summary.html','./monthly-summary.html','./yearly-summary.html','./payment-report.html','./product-profit.html','./profit.html',
  './js/database.js','./js/utils.js','./js/navigation.js','./js/sales.js','./js/inventory.js','./js/dashboard.js','./js/categories.js','./js/cloud-products.js','./js/cloud-sales.js','./js/cloud-stocktake.js','./js/stocktake.js','./js/register.js','./js/purchases.js','./js/suppliers.js','./js/customers.js','./js/expenses.js','./js/reports.js','./js/backup.js','./js/settings.js','./js/users.js','./js/returns.js','./js/stock.js','./js/auth-guard.js','./js/user-session.js','./js/admin-ui-guard.js','./js/role-guard.js','./js/supabase-config.js','./js/pwa-register.js'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE_VERSION).then(c=>c.put(event.request,copy)); return response; })));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE_VERSION).then(c=>c.put(event.request,copy)); return response; }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if(response.ok){const copy=response.clone();caches.open(CACHE_VERSION).then(c=>c.put(event.request,copy));} return response; })));
});
