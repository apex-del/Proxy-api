const targetUrl = 'https://megaplay.buzz/stream/s-2/143128/sub';

async function fetchStream(request) {
    const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://megaplay.buzz/',
            'Origin': 'https://megaplay.buzz',
            // Add any additional headers here
        }
    });

    if (response.status === 410) {
        // If 410, try to bypass by changing headers or providing alternate data
        return new Response('Stream link expired or removed. Try again later.', { status: 410 });
    }

    // If the status is not 410, pass the response body to the client
    const contentType = response.headers.get('Content-Type');
    const body = await response.text();

    return new Response(body, {
        status: response.status,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache', // Control caching behavior
        },
    });
}

addEventListener('fetch', event => {
    event.respondWith(fetchStream(event.request));
});
