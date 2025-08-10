import express from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";
import url from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Main proxy route
app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing url parameter");

  try {
    const r = await fetch(target, {
      headers: { "User-Agent": req.get("User-Agent") || "Mozilla/5.0" }
    });

    // Clone headers
    const contentType = r.headers.get("content-type") || "";

    // If HTML, rewrite asset URLs
    if (contentType.includes("text/html")) {
      let html = await r.text();
      const $ = cheerio.load(html);

      // Rewrite <script>, <link>, <img>, <video>, <source>, etc.
      $("script[src], link[href], img[src], video[src], source[src]").each((i, el) => {
        const attr = el.name === "link" ? "href" : "src";
        const orig = $(el).attr(attr);
        if (orig && !orig.startsWith("data:")) {
          const absUrl = new URL(orig, target).href;
          $(el).attr(attr, `/proxy?url=${encodeURIComponent(absUrl)}`);
        }
      });

      // Rewrite <iframe>
      $("iframe[src]").each((i, el) => {
        const orig = $(el).attr("src");
        if (orig && !orig.startsWith("data:")) {
          const absUrl = new URL(orig, target).href;
          $(el).attr("src", `/proxy?url=${encodeURIComponent(absUrl)}`);
        }
      });

      res.set("Content-Type", "text/html");
      return res.send($.html());
    }

    // For non-HTML: pipe raw content
    res.set("Content-Type", contentType);
    r.body.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.get("/", (req, res) => {
  res.send(`<h2>Megaplay Proxy Running</h2><p>Use <code>/proxy?url=...</code> to load content.</p>`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
