// Service Worker for Bambans Blog
// Provides offline functionality and caching for enhanced user experience

const CACHE_NAME = 'bambans-blog-v1.2.0';
const STATIC_CACHE = 'bambans-static-v1.2.0';
const DYNAMIC_CACHE = 'bambans-dynamic-v1.2.0';

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/blog/',
  '/blog/index.html',
  '/blog/css/style.css',
  '/css/style.css',
  '/js/main.js',
  '/js/blog-utils.js',
  '/js/tailwind_config.js',
  // Fallback offline page
  '/blog/offline.html'
];

// CDN resources to cache
const CDN_RESOURCES = [
  'https://cdn.tailwindcss.com/tailwind.min.js',
  'https://cdn.jsdelivr.net/npm/github-markdown-css@5.2.0/github-markdown.min.css',
  'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
  'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js',
  'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js',
  'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js'
];

// GitHub API URLs to cache
const GITHUB_API_PATTERNS = [
  /^https:\/\/api\.github\.com\/repos\/bambans\/bambans\.github\.io\/contents\/blog\/posts/,
  /^https:\/\/raw\.githubusercontent\.com\/bambans\/bambans\.github\.io\/main\/blog\/posts\//
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES.map(url => new Request(url, {
          cache: 'reload'
        })));
      }),
      
      // Cache CDN resources
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('Service Worker: Caching CDN resources');
        return Promise.allSettled(
          CDN_RESOURCES.map(url => 
            cache.add(new Request(url, {
              mode: 'cors',
              cache: 'default'
            })).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    }).catch(err => {
      console.error('Service Worker: Installation failed', err);
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Handle different types of requests
    if (isStaticFile(url)) {
      return handleStaticFile(request);
    } else if (isCDNResource(url)) {
      return handleCDNResource(request);
    } else if (isGitHubAPI(url)) {
      return handleGitHubAPI(request);
    } else {
      return handleDynamicRequest(request);
    }
  } catch (error) {
    console.error('Service Worker: Fetch error', error);
    return handleOfflineFallback(request);
  }
}

// Handle static files - Cache First strategy
async function handleStaticFile(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return handleOfflineFallback(request);
  }
}

// Handle CDN resources - Cache First with fallback
async function handleCDNResource(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request, {
      mode: 'cors',
      cache: 'default'
    });
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('CDN resource unavailable:', request.url);
    return new Response('/* CDN resource unavailable */', {
      status: 200,
      headers: { 'Content-Type': getContentType(request.url) }
    });
  }
}

// Handle GitHub API - Network First with cache fallback
async function handleGitHubAPI(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } else if (networkResponse.status === 403) {
      // Rate limited - try cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('Service Worker: Using cached response due to rate limit');
        return cachedResponse;
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Network error - try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Using cached GitHub API response');
      return cachedResponse;
    }
    
    // No cache available
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'Unable to fetch data. Please check your connection.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle other dynamic requests
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for a limited time
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return handleOfflineFallback(request);
  }
}

// Handle offline fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/blog/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Return a basic offline response
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Utility functions
function isStaticFile(url) {
  return url.origin === self.location.origin && (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname === '/' ||
    url.pathname === '/blog/' ||
    url.pathname.startsWith('/blog/') && !url.pathname.includes('posts')
  );
}

function isCDNResource(url) {
  return CDN_RESOURCES.some(cdn => url.href.startsWith(cdn.split('?')[0])) ||
         url.hostname.includes('cdn.') ||
         url.hostname.includes('jsdelivr.net') ||
         url.hostname.includes('tailwindcss.com');
}

function isGitHubAPI(url) {
  return GITHUB_API_PATTERNS.some(pattern => pattern.test(url.href));
}

function getContentType(url) {
  if (url.endsWith('.css')) return 'text/css';
  if (url.endsWith('.js')) return 'application/javascript';
  if (url.endsWith('.json')) return 'application/json';
  return 'text/plain';
}

// Message handling for cache management
self.addEventListener('message', event => {
  const { action, data } = event.data;
  
  switch (action) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'CACHE_POST':
      if (data && data.url) {
        cachePost(data.url).then(() => {
          event.ports[0].postMessage({ success: true });
        }).catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      }
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage({ success: true, data: info });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
  }
});

// Cache management functions
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('Service Worker: All caches cleared');
}

async function cachePost(url) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.add(url);
  console.log('Service Worker: Post cached', url);
}

async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    info[name] = {
      count: keys.length,
      urls: keys.slice(0, 10).map(req => req.url) // First 10 URLs
    };
  }
  
  return info;
}

// Periodic cache cleanup
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCache());
  }
});

async function cleanupOldCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const responseDate = new Date(dateHeader).getTime();
        if (now - responseDate > maxAge) {
          await cache.delete(request);
          console.log('Service Worker: Cleaned up old cache entry', request.url);
        }
      }
    }
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Attempt to refresh GitHub API data when connection is restored
    const postsResponse = await fetch('https://api.github.com/repos/bambans/bambans.github.io/contents/blog/posts');
    if (postsResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('https://api.github.com/repos/bambans/bambans.github.io/contents/blog/posts', postsResponse.clone());
      console.log('Service Worker: Background sync completed');
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed', error);
  }
}

console.log('Service Worker: Script loaded');