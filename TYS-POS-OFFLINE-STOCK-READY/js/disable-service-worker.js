//======================================================
// TYS POS
// DISABLE LEGACY SERVICE WORKER AND CACHES
//======================================================

(async function disableLegacyServiceWorker() {
    try {
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(registration => registration.unregister()));
        }

        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
        }
    } catch (error) {
        console.warn("Could not remove old service-worker cache:", error);
    }
})();
