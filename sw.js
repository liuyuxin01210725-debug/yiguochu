const C = 'yiguochu-shell-v3';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // 代理 API / 非 GET 永远走网络, 绝不缓存
  if (e.request.method !== 'GET' || u.pathname.indexOf('/generate-meal') >= 0 || u.pathname.indexOf('/health') >= 0) return;
  if (u.origin !== location.origin) return;
  const accept = e.request.headers.get('accept') || '';
  if (e.request.mode === 'navigate' || accept.indexOf('text/html') >= 0) {
    e.respondWith(fetch(e.request).then(resp => {
      if (resp && resp.ok) { const cp = resp.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
      return resp;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./'))));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      if (resp && resp.ok) { const cp = resp.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
      return resp;
    }).catch(() => caches.match('./')))
  );
});
