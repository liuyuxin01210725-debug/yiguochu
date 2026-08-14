import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const serviceWorkerSource = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://app.test';

function requestKey(input) {
  const raw = typeof input === 'string' ? input : input.url;
  return new URL(raw, `${ORIGIN}/`).href;
}

function serviceWorkerHarness(fetchImpl) {
  const listeners = new Map();
  const stores = new Map();
  const cacheFor = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async addAll(urls) {
        for (const url of urls) {
          const response = await fetchImpl(new Request(requestKey(url)));
          if (!response || !response.ok) throw new Error(`precache failed: ${url}`);
          store.set(requestKey(url), response.clone());
        }
      },
      async put(request, response) {
        store.set(requestKey(request), response.clone());
      },
      async match(request) {
        const response = store.get(requestKey(request));
        return response ? response.clone() : undefined;
      },
      async keys() {
        return [...store.keys()].map(url => new Request(url));
      },
    };
  };
  const caches = {
    async open(name) { return cacheFor(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(request) {
      for (const name of stores.keys()) {
        const response = await cacheFor(name).match(request);
        if (response) return response;
      }
      return undefined;
    },
  };
  const self = {
    clients: { async claim() {} },
    skipWaiting() {},
    addEventListener(type, handler) { listeners.set(type, handler); },
  };
  vm.runInContext(serviceWorkerSource, vm.createContext({
    self,
    caches,
    fetch: fetchImpl,
    URL,
    Request,
    Response,
    Promise,
    location: { origin: ORIGIN },
  }), { filename: 'sw.js' });
  return { listeners, stores, caches };
}

test('service worker installation precaches the PWA start page', async () => {
  const harness = serviceWorkerHarness(async request => new Response(`network:${request}`));
  let installWork;
  harness.listeners.get('install')({
    waitUntil(promise) { installWork = promise; },
  });

  assert.ok(installWork, 'install must extend its lifetime until the app shell is cached');
  await installWork;
  const cacheName = [...harness.stores.keys()][0];
  assert.ok(cacheName, 'install must create a versioned cache');
  const cachedUrls = [...harness.stores.get(cacheName).keys()];
  assert.ok(cachedUrls.includes(`${ORIGIN}/`));
  assert.ok(cachedUrls.includes(`${ORIGIN}/index.html`));
  assert.ok(cachedUrls.includes(`${ORIGIN}/recipes/`));
  assert.ok(cachedUrls.includes(`${ORIGIN}/recipes/index.html`));
  assert.equal(cachedUrls.includes(`${ORIGIN}/source-recipes.html`), false);
  assert.equal(cachedUrls.includes(`${ORIGIN}/source-recipes/index.html`), false);
  assert.ok(cachedUrls.includes(`${ORIGIN}/cook/`));
  assert.ok(cachedUrls.includes(`${ORIGIN}/cook/index.html`));
});

test('service worker install fails closed when a generated shell references a missing asset', async () => {
  const harness = serviceWorkerHarness(async request => {
    if (new URL(request.url).pathname === '/cook/index.html') return new Response('missing', { status: 404 });
    return new Response(`network:${request}`, { status: 200 });
  });
  let installWork;
  harness.listeners.get('install')({ waitUntil(promise) { installWork = promise; } });
  await assert.rejects(installWork, /precache failed/u);
});

test('an offline source catalog navigation serves the source catalog shell', async () => {
  const harness = serviceWorkerHarness(() => new Promise(() => {}));
  const cache = await harness.caches.open('yiguochu-shell-v5');
  await cache.put(`${ORIGIN}/source-recipes/index.html`, new Response('cached source catalog'));
  let responsePromise;
  harness.listeners.get('fetch')({
    request: new Request(`${ORIGIN}/source-recipes/`, {
      method: 'GET',
      headers: { accept: 'text/html' },
    }),
    respondWith(promise) { responsePromise = promise; },
    waitUntil() {},
  });
  const response = await Promise.race([
    responsePromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('source catalog navigation waited for network')), 100)),
  ]);
  assert.equal(await response.text(), 'cached source catalog');
});

test('an offline canonical recipe navigation serves the recipe shell', async () => {
  const harness = serviceWorkerHarness(() => new Promise(() => {}));
  const cache = await harness.caches.open('yiguochu-shell-v5');
  await cache.put(`${ORIGIN}/index.html`, new Response('cached home'));
  await cache.put(`${ORIGIN}/recipes/index.html`, new Response('cached recipes'));
  let responsePromise;
  harness.listeners.get('fetch')({
    request: new Request(`${ORIGIN}/recipes?id=xinjiang-lamb-pilaf`, {
      method: 'GET',
      headers: { accept: 'text/html' },
    }),
    respondWith(promise) { responsePromise = promise; },
    waitUntil() {},
  });

  const response = await Promise.race([
    responsePromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('recipe navigation waited for network')), 100)),
  ]);
  assert.equal(await response.text(), 'cached recipes');
});

test('an offline step-by-step navigation serves the cook shell', async () => {
  const harness = serviceWorkerHarness(() => new Promise(() => {}));
  const cache = await harness.caches.open('yiguochu-shell-v5');
  await cache.put(`${ORIGIN}/cook/index.html`, new Response('cached cook'));
  let responsePromise;
  harness.listeners.get('fetch')({
    request: new Request(`${ORIGIN}/cook/?id=xinjiang-lamb-pilaf`, {
      method: 'GET',
      headers: { accept: 'text/html' },
    }),
    respondWith(promise) { responsePromise = promise; },
    waitUntil() {},
  });
  const response = await Promise.race([
    responsePromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('cook navigation waited for network')), 100)),
  ]);
  assert.equal(await response.text(), 'cached cook');
});

test('a cached PWA navigation opens without waiting for a stalled network', async () => {
  const harness = serviceWorkerHarness(() => new Promise(() => {}));
  const cache = await harness.caches.open('yiguochu-shell-v5');
  await cache.put(`${ORIGIN}/index.html`, new Response('cached home'));
  let responsePromise;
  let backgroundWork;
  harness.listeners.get('fetch')({
    request: new Request(`${ORIGIN}/`, {
      method: 'GET',
      headers: { accept: 'text/html' },
    }),
    respondWith(promise) { responsePromise = promise; },
    waitUntil(promise) { backgroundWork = promise; },
  });

  const response = await Promise.race([
    responsePromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('navigation waited for network')), 100)),
  ]);
  assert.equal(await response.text(), 'cached home');
  assert.ok(backgroundWork, 'online refresh should continue in the background');
});
