// Service Worker for Enhanced Blog
// Provides offline functionality and caching

const CACHE_NAME = 'bambans-blog-v2.1.0';
const STATIC_CACHE = 'bambans-blog-static-v2.1.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/blog/',
  '/blog/index.html',
  '/blog/css/style.css',
  '/blog/js/main.js',
  '/css/style.css',
  '/index.html',
  // CDN resources (will be cached on first load)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400&display=swap',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
  'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js',
  'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js',
  'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css',
  'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css'
];

// GitHub API URLs that should be cached
const GITHUB_API_PATTERN = /^https:\/\/api\.github\.com\/repos\/bambans\/bambans\.github\.io/;
const GITHUB_RAW_PATTERN = /^https:\/\/raw\.githubusercontent\.com\/bambans\/bambans\.github\.io/;

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('SW: Install event');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('SW: Caching static files');
        return cache.addAll(STATIC_FILES.filter(url => !url.startsWith('http')));
      }),
      // Cache CDN resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('SW: Caching CDN resources');
        const cdnUrls = STATIC_FILES.filter(url => url.startsWith('http'));
        return Promise.allSettled(
          cdnUrls.map(url => 
            fetch(url, { mode: 'cors' })
              .then(response => response.ok ? cache.put(url, response) : Promise.resolve())
              .catch(() => Promise.resolve()) // Ignore CDN errors during install
          )
        );
      })
    ]).then(() => {
      console.log('SW: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticFile(request.url)) {
    event.respondWith(handleStaticFile(request));
  } else if (isGitHubAPI(request.url)) {
    event.respondWith(handleGitHubAPI(request));
  } else if (isCDNResource(request.url)) {
    event.respondWith(handleCDNResource(request));
  } else {
    event.respondWith(handleOtherRequests(request));
  }
});

// Check if request is for a static file
function isStaticFile(url) {
  return url.includes('/blog/') || 
         url.includes('/css/') || 
         url.includes('/js/') ||
         url.endsWith('.html') ||
         url.endsWith('.css') ||
         url.endsWith('.js') ||
         url.endsWith('/');
}

// Check if request is to GitHub API
function isGitHubAPI(url) {
  return GITHUB_API_PATTERN.test(url) || GITHUB_RAW_PATTERN.test(url);
}

// Check if request is for CDN resource
function isCDNResource(url) {
  return url.includes('cdn.jsdelivr.net') ||
         url.includes('cdn.tailwindcss.com') ||
         url.includes('fonts.googleapis.com') ||
         url.includes('fonts.gstatic.com');
}

// Handle static files - cache first strategy
async function handleStaticFile(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Serving static file from cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('SW: Cached static file:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Static file not available offline:', request.url);
    
    // Return offline page for HTML requests
    if (request.url.endsWith('.html') || request.url.endsWith('/')) {
      return new Response(getOfflinePage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Handle GitHub API - network first with cache fallback
async function handleGitHubAPI(request) {
  try {
    console.log('SW: Fetching from GitHub API:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('SW: Cached GitHub API response:', request.url);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('SW: GitHub API network failed, trying cache:', request.url);
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Serving GitHub API from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('SW: GitHub API not available offline:', request.url);
    return new Response(JSON.stringify({
      error: 'Offline - GitHub API not available',
      message: 'Please check your internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle CDN resources - cache first with network fallback
async function handleCDNResource(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Serving CDN resource from cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request, { mode: 'cors' });
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('SW: Cached CDN resource:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: CDN resource not available:', request.url);
    return new Response('CDN resource unavailable offline', { status: 503 });
  }
}

// Handle other requests - network only
async function handleOtherRequests(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('SW: Other request failed:', request.url);
    return new Response('Network error', { status: 503 });
  }
}

// Generate offline page HTML
function getOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - @bambans</title>
        <style>
            body {
                font-family: 'Roboto Mono', monospace;
                background-color: #121212;
                color: #ffffff;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                text-align: center;
            }
            .container {
                max-width: 600px;
                padding: 2rem;
            }
            h1 {
                color: #40e0d0;
                font-size: 2.5rem;
                margin-bottom: 1rem;
            }
            p {
                color: #d1d5db;
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 1.5rem;
            }
            .status {
                background-color: #1f2937;
                border: 1px solid #4b5563;
                border-radius: 8px;
                padding: 1rem;
                margin: 1.5rem 0;
            }
            .retry-btn {
                background-color: #8a2be2;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-family: inherit;
                font-size: 1rem;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .retry-btn:hover {
                background-color: #9333ea;
            }
            .terminal-prompt {
                color: #40e0d0;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔌 Offline Mode</h1>
            <div class="status">
                <p><span class="terminal-prompt">bambans@blog:~$</span> Connection status: OFFLINE</p>
            </div>
            <p>
                You're currently offline, but don't worry! The blog has been cached 
                and some content is still available.
            </p>
            <p>
                Cached posts and static content will load normally. 
                To access new posts, please check your internet connection.
            </p>
            <button class="retry-btn" onclick="window.location.reload()">
                🔄 Retry Connection
            </button>
            <br><br>
            <p style="font-size: 0.9rem; opacity: 0.7;">
                Service Worker: Active | Cache: Available
            </p>
        </div>
    </body>
    </html>
  `;
}

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('SW: Background sync triggered');
    event.waitUntil(
      // Perform any background sync tasks here
      Promise.resolve()
    );
  }
});

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  console.log('SW: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New blog post available!',
    icon: '/img/otavio.ico',
    badge: '/img/otavio.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Read Post',
        icon: '/img/otavio.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/img/otavio.ico'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('New Blog Post', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/blog/')
    );
  }
});

console.log('SW: Service Worker loaded successfully');