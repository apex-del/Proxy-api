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
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36",
            },
        });

        const contentType = response.headers.get("content-type");
        res.set("Content-Type", contentType || "text/html");

        const body = await response.text();
        res.send(body);
    } catch (err) {
        res.status(500).send("Error fetching stream: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
