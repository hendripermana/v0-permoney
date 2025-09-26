/**
 * Cloudflare Pages Function - API Proxy to Oracle Cloud VM
 * Proxies API requests to powerful Oracle VM backend (24GB RAM, 4CPU)
 */

export async function onRequest(context: EventContext<any, any, any>) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Get the path after /api/
  const apiPath = url.pathname.replace('/api/', '');

  // Oracle Cloud VM backend URL (replace with your VM IP)
  const BACKEND_URL = `http://your-oracle-vm-ip:3001/api/${apiPath}`;

  try {
    // Add query parameters if any
    const searchParams = url.search;
    const backendUrl = searchParams ? `${BACKEND_URL}${searchParams}` : BACKEND_URL;

    console.log(`Proxying request to: ${backendUrl}`);

    // Forward the request to Oracle VM backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'User-Agent': request.headers.get('User-Agent') || '',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined,
    });

    // Get response headers
    const responseHeaders = new Headers();

    // Copy important headers from backend response
    for (const [key, value] of response.headers.entries()) {
      if ([
        'content-type',
        'cache-control',
        'etag',
        'last-modified',
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset'
      ].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    // Add Cloudflare-specific headers
    responseHeaders.set('X-Proxied-By', 'Cloudflare Pages');
    responseHeaders.set('X-Backend-Server', 'Oracle Cloud VM');

    // Return the response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('API Proxy Error:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to proxy request to backend',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Source': 'Cloudflare Pages Proxy',
        },
      }
    );
  }
}
