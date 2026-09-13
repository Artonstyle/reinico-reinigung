// Version bei App-Veröffentlichungen erhöhen. Keine persönlichen Daten cachen.
const VERSION = 'reinico-time-2026-09-13-1';
self.addEventListener('install', () => {});
self.addEventListener('message', event => {
  if (event.data === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/stempel.html')) {
    // Immer aktuelle HTML laden. Keine Offline-Stempelbuchungen vortäuschen.
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => new Response(
      '<!doctype html><html lang="de"><meta name="viewport" content="width=device-width"><body style="background:#0f172a;color:white;font:18px system-ui;padding:24px"><h1>REINICO TIME</h1><p>Keine Verbindung. Zum Stempeln bitte wieder online gehen.</p><button onclick="location.reload()">Erneut versuchen</button></body></html>',
      {status:503,headers:{'Content-Type':'text/html; charset=utf-8'}})));
  }
});
