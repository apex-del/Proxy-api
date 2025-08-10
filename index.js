import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy route
app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('Missing URL');
    }

    // Fetch the target page (server-side bypasses browser restrictions)
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36'
      }
    });

    // Load HTML and keep iframe as-is
    const $ = cheerio.load(response.data);
    const iframeSrc = $('iframe').attr('src');

    if (!iframeSrc) {
      return res.status(404).send('Iframe not found');
    }

    // Serve HTML page with the iframe
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MegaPlay Proxy</title>
          <meta charset="UTF-8" />
          <style>
            body { margin: 0; padding: 0; }
            iframe { width: 100vw; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${iframeSrc}" allowfullscreen></iframe>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error fetching content');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
