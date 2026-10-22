// Admin installation compatibility. No Cache Storage, private offline snapshots,
// queued mutations or background sync: every request still reaches owner auth.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch((error) => {
      if (event.request.mode !== "navigate") throw error;
      return new Response(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reconnect — Whatelz Admin</title><style>body{font:18px/1.6 system-ui,sans-serif;color:#18181b;background:#fff;padding: max(24px,env(safe-area-inset-top)) 24px;max-width:440px;margin:15vh auto}small{background:#ffe458;padding:8px 12px;border-radius:8px}h1{font-size:32px;line-height:1.2}a{display:inline-block;color:#18181b;background:#ffe458;padding:12px 20px;border-radius:12px;font-weight:600}</style></head><body><small>WHATELZ ADMIN</small><h1>You're offline.</h1><p>Reconnect to read your private dashboard. Your briefs and account data aren't stored offline.</p><a href="/today">Try again</a></body></html>`,
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" } },
      );
    }),
  );
});
