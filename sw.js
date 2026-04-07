// Service Worker - ZennBR PWA
const CACHE_NAME = 'zennbr-v1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/utils.js',
  '/js/storage.js',
  '/js/tasks.js',
  '/js/habits.js',
  '/js/calendar.js',
  '/js/finance.js',
  '/js/goals.js',
  '/js/ai-coach.js',
  '/js/charts.js',
  '/js/pomodoro.js',
  '/js/app.js',
  '/manifest.json'
];

// Instalação: faz cache dos assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Service Worker: alguns arquivos não foram cacheados:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: estratégia cache-first para assets, network-first para API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignora requisições à API OpenAI (sempre network)
  if (url.hostname === 'api.openai.com') {
    return;
  }

  // Ignora requisições a CDNs externas (usa network com fallback)
  if (url.hostname !== self.location.hostname && url.hostname !== 'localhost') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets locais: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => {
        // Fallback para index.html em caso de erro de navegação
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
