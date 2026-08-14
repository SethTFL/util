// deno run --allow-net server.ts

Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const incomingUrl = new URL(req.url);

    const targetUrl = decodeURIComponent(
      incomingUrl.pathname.replace(/^\/+/, "")
    );

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return new Response(
        "Path must contain a full URL beginning with http:// or https://",
        { status: 400 }
      );
    }

    const headers = new Headers(req.headers);

    // Remove problematic hop-by-hop headers
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : req.body,
      redirect: "manual",
    });

const responseHeaders = new Headers(upstream.headers);

// Let Deno recalculate it.
responseHeaders.delete("content-length");

responseHeaders.set("Access-Control-Allow-Origin", "*");
responseHeaders.set("Access-Control-Allow-Methods", "*");
responseHeaders.set("Access-Control-Allow-Headers", "*");

responseHeaders.delete("content-encoding");
responseHeaders.delete("content-length");
responseHeaders.delete("transfer-encoding");
responseHeaders.delete("connection");
responseHeaders.delete("keep-alive");

return new Response(upstream.body, {
  status: upstream.status,
  statusText: upstream.statusText,
  headers: responseHeaders,
});

  } catch (err) {
    return new Response(`Proxy error: ${err}`, {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});