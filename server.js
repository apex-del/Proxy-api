import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy route
app.get("/:id/:type", async (req, res) => {
  const { id, type } = req.params;

  // Build target URL
  const targetUrl = `https://megaplay.buzz/stream/s-2/${id}/${type}`;

  try {
    // Pass through video range headers if client requests partial content
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Referer": "https://megaplay.buzz/",
      "Origin": "https://megaplay.buzz",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
    };
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    // Fetch from the origin
    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
    });

    // Copy response headers
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Allow CORS for browsers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "*");

    // Stream back to the client
    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
