const C = 'yiguochu-shell-v5';
const ARTIFACT_SCOPE = '__YIGUOCHU_ARTIFACT_SCOPE__';
// The build injects a scope-specific list. The source fallback is deliberately
// runtime-only so a raw source worker never caches research pages by accident.
const injectedShell = '__YIGUOCHU_SHELL_JSON__';
const SHELL = injectedShell === '__YIGUOCHU_SHELL_JSON__'
  ? ['./','./index.html','./recipes/','./recipes/index.html','./cook/','./cook/index.html','./manifest.json','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png']
  : JSON.parse(injectedShell);
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
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
    const fallback = /\/source-recipes\/?$/.test(u.pathname)
      ? './source-recipes/index.html'
      : /\/recipes(?:\.html)?\/?$/.test(u.pathname) ? './recipes/index.html'
        : /\/cook(?:\.html)?\/?$/.test(u.pathname) ? './cook/index.html' : './index.html';
    e.respondWith(caches.open(C).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true }) || await cache.match(fallback);
      const network = fetch(e.request).then(resp => {
        if (resp && resp.ok) { const cp = resp.clone(); cache.put(e.request, cp); }
        return resp;
      });
      if (cached) {
        e.waitUntil(network.catch(() => {}));
        return cached;
      }
      return network.catch(() => cache.match(fallback));
    }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      if (resp && resp.ok) { const cp = resp.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
      return resp;
    }).catch(() => caches.match('./')))
  );
});
