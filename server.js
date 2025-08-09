import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

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

            // 1. Force HTTPS for everything from megaplay
            body = body.replace(/http:\/\/megaplay\.buzz/gi, "https://megaplay.buzz");
            body = body.replace(/\/\/megaplay\.buzz/gi, "https://megaplay.buzz");

            // 2. Route all HTTPS megaplay URLs through our proxy
            body = body.replace(
                /https:\/\/megaplay\.buzz/gi,
                `${req.protocol}://${req.get("host")}/proxy?url=https://megaplay.buzz`
            );

            res.send(body);
        } else {
            // For non-HTML (JS, CSS, video files), just stream
            response.body.pipe(res);
        }
    } catch (err) {
        res.status(500).send("Error fetching: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
