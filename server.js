import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Universal proxy route
app.get("/proxy", async (req, res) => {
    const target = req.query.url;
    if (!target) {
        return res.status(400).send("Error: Missing url parameter");
    }

    try {
        const response = await fetch(target, {
            headers: {
                "Referer": "https://hianimes.lv/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36"
            }
        });

        const contentType = response.headers.get("content-type") || "text/html";
        res.set("Content-Type", contentType);

        if (contentType.includes("text/html")) {
            let body = await response.text();

            // Rewrite ALL megaplay.buzz asset URLs to go through proxy
            body = body.replace(
                /https:\/\/megaplay\.buzz/gi,
                `${req.protocol}://${req.get("host")}/proxy?url=https://megaplay.buzz`
            );

            res.send(body);
        } else {
            // Not HTML (JS, CSS, video, etc.) — just stream it directly
            response.body.pipe(res);
        }
    } catch (err) {
        res.status(500).send("Error fetching: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
