// 果音ドリル Service Worker
// オフラインでも動くようにキャッシュを管理
const CACHE_VERSION = 'kanon-quiz-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

// インストール時：基本ファイルをキャッシュ
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// アクティブ化時：古いキャッシュを削除
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// フェッチ：キャッシュ優先、なければネットワークから取得してキャッシュに保存
self.addEventListener('fetch', (e) => {
  // GETリクエストのみキャッシュ
  if (e.request.method !== 'GET') return;
  // Googleフォントなど外部はネットワーク優先（オフライン時はキャッシュフォールバック）
  const url = new URL(e.request.url);
  const isExternal = url.origin !== location.origin;

  if (isExternal) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 同一オリジン：キャッシュ優先
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
