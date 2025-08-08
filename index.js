import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/proxy", async (req, res) => {
    const target = req.query.url || "https://megaplay.buzz/stream/s-2/143128/sub";

    try {
        const response = await fetch(target, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Referer": "https://megaplay.buzz/",
                "Origin": "https://megaplay.buzz",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",
                "Range": req.headers.range || "bytes=0-"
            }
        });

        // Forward status and headers to client
        res.status(response.status);
        for (let [key, value] of response.headers) {
            res.setHeader(key, value);
        }

        // Stream body
        response.body.pipe(res);

    } catch (err) {
        console.error(err);
        res.status(500).send("Proxy error");
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
