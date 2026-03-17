const CACHE = 'ira-v1';
const PAGES = [
  '/index.html',
  '/guard-hub.html',
  '/service-tracker.html',
  '/orders.html',
  '/manifest.json',
];

// Install — cache all pages
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PAGES)).then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', e => {
  // Only handle GET requests for our own pages
  if(e.request.method !== 'GET') return;
  // Let Supabase/Google Fonts go straight to network, no caching
  const url = new URL(e.request.url);
  if(url.hostname.includes('supabase.co') ||
     url.hostname.includes('googleapis.com') ||
     url.hostname.includes('gstatic.com') ||
     url.hostname.includes('docs.google.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache a fresh copy of our own pages
        if(PAGES.some(p => e.request.url.endsWith(p.replace('/',''))) || e.request.url.endsWith('/')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
