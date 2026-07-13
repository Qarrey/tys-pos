// TYS POS final offline shell registration.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' });
      registration.update().catch(() => {});
      console.log('TYS POS offline mode ready.');
    } catch (error) {
      console.error('Offline mode could not start:', error);
    }
  });
}
