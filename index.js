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

        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://megaplay.buzz/"
            }
        });

        if (!response.ok) {
            return res.status(response.status).send(`Error fetching: ${response.status}`);
        }

        let contentType = response.headers.get("content-type");

        // Process HTML content
        if (contentType && contentType.includes("text/html")) {
            let html = await response.text();
            const $ = cheerio.load(html);

            // Inject <base> tag so all relative requests go through proxy
            const baseProxyUrl = `/proxy?url=${encodeURIComponent(new URL(".", targetUrl).href)}`;
            if ($("head").length > 0) {
                $("head").prepend(`<base href="${baseProxyUrl}">`);
            }

            // Rewrite src/href attributes for absolute URLs
            $("script, link, img, iframe, source").each((_, el) => {
                const attr = el.tagName === "link" ? "href" : "src";
                let val = $(el).attr(attr);
                if (val && !val.startsWith("data:") && !val.startsWith("blob:") && !val.startsWith("http")) {
                    let absolute = new URL(val, targetUrl).href;
                    $(el).attr(attr, `/proxy?url=${encodeURIComponent(absolute)}`);
                }
            });

            html = $.html();
            res.setHeader("content-type", "text/html");
            return res.send(html);
        }

        // Pass-through for non-HTML assets
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
        <h1>Megaplay Proxy with Base Injection</h1>
        <p>Usage: /proxy?url=YOUR_URL</p>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
