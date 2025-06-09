// Service Worker for Performance and Offline Capabilities
'use strict';

const CACHE_NAME = 'bambans-blog-v2.0.0';
const STATIC_CACHE = 'bambans-static-v2.0.0';
const DYNAMIC_CACHE = 'bambans-dynamic-v2.0.0';

// Configuration
const SW_CONFIG = {
    maxCacheSize: 50, // Maximum cached entries
    cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
    networkTimeout: 5000, // 5 seconds
    enableLogs: false // Set to true for debugging
};

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/blog/',
    '/blog/index.html',
    '/css/normalize.css',
    '/css/main.css',
    '/blog/css/blog.css',
    '/js/main.js',
    '/blog/js/markdown-renderer.js',
    '/blog/js/mermaid-handler.js',
    '/blog/js/blog-app.js',
    '/img/otavio.ico',
    '/img/otavio-pixel-sem-bg.png'
];

// Critical CDN resources to cache (reduced list)
const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    log('[SW] Installing service worker');
    
    event.waitUntil(
        cacheStaticAssets()
            .then(() => {
                log('[SW] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache assets:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    log('[SW] Activating service worker');
    
    event.waitUntil(
        Promise.all([
            cleanOldCaches(),
            cleanExpiredEntries()
        ]).then(() => {
            log('[SW] Service worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticAsset(request)) {
        event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(networkFirst(request));
    } else if (isCDNAsset(request)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(staleWhileRevalidate(request));
    }
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'CACHE_URLS':
                if (event.data.payload) {
                    cacheUrls(event.data.payload);
                }
                break;
            case 'CLEAR_CACHE':
                clearAllCaches();
                break;
        }
    }
});

/**
 * Cache static assets
 */
async function cacheStaticAssets() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        
        // Cache static assets with retry logic
        const cachePromises = STATIC_ASSETS.map(async (url) => {
            try {
                await cache.add(url);
                return { url, success: true };
            } catch (error) {
                log(`Failed to cache: ${url}`, error);
                return { url, success: false };
            }
        });
        
        // Cache critical CDN assets
        const cdnPromises = CDN_ASSETS.map(async (url) => {
            try {
                const response = await fetchWithTimeout(url, {
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (response.ok) {
                    await cache.put(url, response);
                    return { url, success: true };
                }
            } catch (error) {
                log(`Failed to cache CDN: ${url}`, error);
            }
            return { url, success: false };
        });
        
        const results = await Promise.all([...cachePromises, ...cdnPromises]);
        const failed = results.filter(r => !r.success);
        
        if (failed.length > 0) {
            log(`Failed to cache ${failed.length} assets`);
        }
        
    } catch (error) {
        console.error('[SW] Cache operation failed:', error);
    }
}

/**
 * Clean old caches
 */
async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [STATIC_CACHE, DYNAMIC_CACHE];
    
    const deletePromises = cacheNames
        .filter(cacheName => !validCaches.includes(cacheName))
        .map(cacheName => {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
        });
    
    return Promise.all(deletePromises);
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse && !isExpired(cachedResponse)) {
            return cachedResponse;
        }
        
        const networkResponse = await fetchWithTimeout(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            await addToCache(cache, request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        log('Cache-first strategy failed:', error);
        const cachedResponse = await caches.match(request);
        return cachedResponse || createErrorResponse('Resource not available offline');
    }
}

/**
 * Network-first strategy for API requests
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetchWithTimeout(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            await addToCache(cache, request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        log('Network failed, trying cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return createErrorResponse('Network error and no cached version available');
    }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Background fetch (don't await)
    fetchWithTimeout(request)
        .then(networkResponse => {
            if (networkResponse.ok) {
                addToCache(cache, request, networkResponse.clone());
            }
        })
        .catch(error => log('Background fetch failed:', error));
    
    return cachedResponse || 
           fetchWithTimeout(request).catch(() => createErrorResponse('Resource not available'));
}

/**
 * Check if request is for static asset
 */
function isStaticAsset(request) {
    const url = new URL(request.url);
    
    return STATIC_ASSETS.some(asset => {
        const assetUrl = new URL(asset, self.location.origin);
        return url.pathname === assetUrl.pathname;
    });
}

/**
 * Check if request is API request
 */
function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.hostname === 'api.github.com';
}

/**
 * Check if request is CDN asset
 */
function isCDNAsset(request) {
    const url = new URL(request.url);
    return url.hostname === 'cdn.jsdelivr.net' || 
           url.hostname === 'unpkg.com' ||
           CDN_ASSETS.includes(request.url);
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    for (const url of urls) {
        try {
            await cache.add(url);
        } catch (error) {
            console.warn(`[SW] Failed to cache URL: ${url}`, error);
        }
    }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
    await Promise.all(deletePromises);
    console.log('[SW] All caches cleared');
}

/**
 * Create error response
 */
function createErrorResponse(message) {
    return new Response(
        JSON.stringify({
            error: message,
            timestamp: new Date().toISOString()
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

/**
 * Background sync for failed requests (if supported)
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Implement background sync logic here
    console.log('[SW] Background sync triggered');
}

/**
 * Push notification handling (if needed)
 */
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/img/otavio.ico',
            badge: '/img/otavio-pixel-sem-bg.png',
            data: data.url
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.notification.data) {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
});

/**
 * Utility functions
 */

// Logging utility
function log(message, ...args) {
    if (SW_CONFIG.enableLogs) {
        console.log(`[SW] ${message}`, ...args);
    }
}

// Fetch with timeout
async function fetchWithTimeout(request, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SW_CONFIG.networkTimeout);
    
    try {
        const response = await fetch(request, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Check if response is expired
function isExpired(response) {
    if (!response.headers.has('sw-cached-date')) return false;
    
    const cachedDate = new Date(response.headers.get('sw-cached-date'));
    const now = new Date();
    return (now.getTime() - cachedDate.getTime()) > SW_CONFIG.cacheExpiration;
}

// Add to cache with metadata
async function addToCache(cache, request, response) {
    try {
        // Clone response and add timestamp
        const responseClone = response.clone();
        const headers = new Headers(responseClone.headers);
        headers.set('sw-cached-date', new Date().toISOString());
        
        const responseWithDate = new Response(responseClone.body, {
            status: responseClone.status,
            statusText: responseClone.statusText,
            headers: headers
        });
        
        await cache.put(request, responseWithDate);
        
        // Clean cache if it's getting too large
        await cleanCacheSize(cache);
        
    } catch (error) {
        log('Failed to add to cache:', error);
    }
}

// Clean cache size
async function cleanCacheSize(cache) {
    const keys = await cache.keys();
    if (keys.length > SW_CONFIG.maxCacheSize) {
        const keysToDelete = keys.slice(0, keys.length - SW_CONFIG.maxCacheSize);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
        log(`Cleaned ${keysToDelete.length} cache entries`);
    }
}

// Clean expired entries
async function cleanExpiredEntries() {
    try {
        const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE];
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (const request of requests) {
                const response = await cache.match(request);
                if (response && isExpired(response)) {
                    await cache.delete(request);
                    log(`Deleted expired entry: ${request.url}`);
                }
            }
        }
    } catch (error) {
        log('Error cleaning expired entries:', error);
    }
}

log('Service worker script loaded');