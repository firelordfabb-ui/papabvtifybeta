import http from 'http';
import { Ytdl, chooseFormat } from '@distube/ytdl-core';

const ytdl = new Ytdl();
let cachedFormats = new Map();

async function getAudioUrl(id) {
  if (cachedFormats.has(id)) return cachedFormats.get(id);
  const info = await ytdl.getInfo(id);
  const format = chooseFormat(info.formats, { filter: f => f.hasAudio && !f.hasVideo, quality: 'highestaudio' });
  cachedFormats.set(id, format);
  return format;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:5432');
  if (url.pathname === '/stream') {
    const id = url.searchParams.get('id') || 'AQpEIZ8dNcU';
    try {
      const format = await getAudioUrl(id);
      const range = req.headers.range;

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      if (range) {
        headers['Range'] = range;
      }

      const proxyRes = await fetch(format.url, { headers });
      
      res.statusCode = proxyRes.status; // 206 or 200
      res.setHeader('Content-Type', format.mimeType || 'audio/webm');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const contentRange = proxyRes.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      
      const contentLength = proxyRes.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      console.log(`Stream proxy responding with status ${proxyRes.status}, range=${range}, contentRange=${contentRange}`);

      const reader = proxyRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (e) {
      console.error('Proxy error:', e.message);
      res.statusCode = 500;
      res.end(e.message);
    }
  }
});

server.listen(5432, async () => {
  console.log('Testing Range seek request...');
  // Request second half of audio (bytes=2000000-)
  const res = await fetch('http://localhost:5432/stream?id=AQpEIZ8dNcU', {
    headers: { 'Range': 'bytes=2000000-' }
  });
  console.log('Client received status:', res.status);
  console.log('Client received Content-Range:', res.headers.get('content-range'));
  console.log('Client received Accept-Ranges:', res.headers.get('accept-ranges'));
  server.close();
  process.exit(0);
});
