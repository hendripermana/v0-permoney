const CACHE_NAME = "permoney-v1"
const STATIC_CACHE = "permoney-static-v1"
const DYNAMIC_CACHE = "permoney-dynamic-v1"
const API_CACHE = "permoney-api-v1"

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
  // Add other static assets
]

const API_CACHE_PATTERNS = [
  /\/api\/v1\/accounts/,
  /\/api\/v1\/transactions/,
  /\/api\/v1\/budgets/,
  /\/api\/v1\/analytics/,
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
    ]).then(() => {
      return self.skipWaiting()
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        return self.clients.claim()
      }),
  )
})

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests with stale-while-revalidate
  if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets with cache-first
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // Handle navigation requests with network-first
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request))
    return
  }

  // Default: network-first with cache fallback
  event.respondWith(handleDefault(request))
})

// API request handler - stale-while-revalidate
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE)
  const cachedResponse = await cache.match(request)

  // Return cached response immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone())

          // Notify clients about cache update
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "CACHE_UPDATED",
                payload: { url: request.url },
              })
            })
          })
        }
      })
      .catch(() => {
        // Network error, keep using cached version
      })

    return cachedResponse
  }

  // No cache, fetch from network
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "This data is not available offline",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Static asset handler - cache-first
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return fallback for images
    if (request.destination === "image") {
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#999">Image unavailable</text></svg>',
        { headers: { "Content-Type": "image/svg+xml" } },
      )
    }
    throw error
  }
}

// Navigation handler - network-first with offline fallback
async function handleNavigation(request) {
  try {
    const response = await fetch(request)

    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Serve offline page
    return caches.match("/offline.html")
  }
}

// Default handler - network-first
async function handleDefault(request) {
  try {
    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE)
    return cache.match(request)
  }
}

// Helper functions
function isApiRequest(request) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(request.url))
}

function isStaticAsset(request) {
  return (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    request.url.includes("/static/")
  )
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync() {
  // Handle queued offline actions
  const cache = await caches.open("offline-actions")
  const requests = await cache.keys()

  for (const request of requests) {
    try {
      await fetch(request)
      await cache.delete(request)
    } catch (error) {
      // Keep in queue for next sync
    }
  }
}
