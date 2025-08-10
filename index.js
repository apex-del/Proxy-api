import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/proxy", async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).send("Missing url parameter");
        }

        console.log(`Fetching: ${targetUrl}`);

        // Keep cookies and Referer
        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://megaplay.buzz/"
            }
        });

        if (!response.ok) {
            return res.status(response.status).send(`Error fetching: ${response.status}`);
        }

        let contentType = response.headers.get("content-type") || "";

        // Handle HTML player pages
        if (contentType.includes("text/html")) {
            let html = await response.text();
            const $ = cheerio.load(html);

            // Inject <base> for relative URLs
            const baseProxyUrl = `/proxy?url=${encodeURIComponent(new URL(".", targetUrl).href)}`;
            if ($("head").length > 0) {
                $("head").prepend(`<base href="${baseProxyUrl}">`);
            }

            // Force JS to route all fetch/XHR calls via proxy
            $("script").each((_, el) => {
                let code = $(el).html();
                if (code && code.includes("fetch(")) {
                    code = code.replace(/fetch\s*\(\s*(['"`])(.*?)\1/g, (m, quote, url) => {
                        if (!url.startsWith("http")) {
                            url = new URL(url, targetUrl).href;
                        }
                        return `fetch("/proxy?url=${encodeURIComponent(url)}"`;
                    });
                    $(el).html(code);
                }
            });

            // Rewrite media src/href
            $("script, link, img, iframe, source").each((_, el) => {
                const attr = el.tagName === "link" ? "href" : "src";
                let val = $(el).attr(attr);
                if (val && !val.startsWith("data:") && !val.startsWith("blob:") && !val.startsWith("http")) {
                    let absolute = new URL(val, targetUrl).href;
                    $(el).attr(attr, `/proxy?url=${encodeURIComponent(absolute)}`);
                }
            });

            res.setHeader("content-type", "text/html");
            return res.send($.html());
        }

        // Handle HLS playlists and segments
        if (
            targetUrl.endsWith(".m3u8") ||
            targetUrl.endsWith(".ts") ||
            targetUrl.endsWith(".key")
        ) {
            const text = await response.text();
            // Rewrite segment/playlist paths
            const rewritten = text.replace(/^(?!#)(.*)$/gm, (line) => {
                if (!line.startsWith("http") && !line.startsWith("#")) {
                    const abs = new URL(line, targetUrl).href;
                    return `/proxy?url=${encodeURIComponent(abs)}`;
                }
                return line;
            });
            res.setHeader("content-type", contentType || "application/vnd.apple.mpegurl");
            return res.send(rewritten);
        }

        // Pass-through for other assets
        res.setHeader("content-type", contentType || "application/octet-stream");
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.get("/", (req, res) => {
    res.send(`
        <h1>Megaplay Full Video Proxy</h1>
        <p>Usage: /proxy?url=MEGAPLAY_IFRAME_URL</p>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
