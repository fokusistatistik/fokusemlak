// FOKUS Emlak - Service Worker
// PWA offline support and caching strategy

const CACHE_NAME = 'fokus-emlak-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/listings.html',
    '/login.html',
    '/offline.html',
    '/assets/css/style.css',
    '/assets/js/main.js',
    '/assets/js/api.js',
    '/assets/js/auth.js',
    '/assets/js/chatbot.js',
    '/manifest.json'
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching pre-cache resources');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome extensions and other protocols
    if (!url.protocol.startsWith('http')) return;

    // Skip API calls (let them go to network)
    if (url.hostname.includes('n8n.fokusistatistik.com')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ error: 'Offline', message: 'No internet connection' }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            })
        );
        return;
    }

    // Strategy: Cache First, fallback to Network
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Serving from cache:', request.url);
                    return cachedResponse;
                }

                return fetch(request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache successful responses
                        caches.open(CACHE_NAME).then((cache) => {
                            // Only cache same-origin requests
                            if (url.origin === location.origin) {
                                console.log('[SW] Caching new resource:', request.url);
                                cache.put(request, responseToCache);
                            }
                        });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }

                        // Return a generic offline response for other requests
                        return new Response('Offline - Resource not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'Yeni bildirim',
        icon: '/assets/img/icon-192x192.png',
        badge: '/assets/img/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'fokus-notification',
        requireInteraction: false,
        actions: [
            { action: 'open', title: 'Aç', icon: '/assets/img/icon-open.png' },
            { action: 'close', title: 'Kapat', icon: '/assets/img/icon-close.png' }
        ],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('FOKUS Emlak', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Background sync event (for offline form submissions)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-forms') {
        event.waitUntil(syncForms());
    }
});

async function syncForms() {
    console.log('[SW] Syncing offline forms...');

    try {
        const cache = await caches.open('fokus-offline-forms');
        const requests = await cache.keys();

        for (const request of requests) {
            try {
                const response = await cache.match(request);
                const data = await response.json();

                // Try to submit the form
                await fetch(request.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                // If successful, remove from cache
                await cache.delete(request);
                console.log('[SW] Form synced successfully');
            } catch (error) {
                console.error('[SW] Form sync failed:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync forms error:', error);
    }
}

// Message event (for communication with main thread)
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                return self.clients.matchAll();
            }).then((clients) => {
                clients.forEach((client) => client.postMessage({ type: 'CACHE_CLEARED' }));
            })
        );
    }
});

console.log('[SW] Service worker loaded successfully');
