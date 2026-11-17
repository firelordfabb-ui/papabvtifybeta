import http from 'http';
import yts from 'yt-search';
import { Ytdl } from '@distube/ytdl-core';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:4321');
  
  if (url.pathname === '/api/search') {
    const q = url.searchParams.get('q') || 'trending music indonesia';
    try {
      const results = await yts(q);
      const songs = results.videos.slice(0, 15).map(v => ({
        id: v.videoId,
        title: v.title,
        artist: v.author.name,
        duration: v.seconds,
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        streamUrl: `/api/stream?id=${v.videoId}`
      }));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(songs));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
  } else if (url.pathname === '/api/stream') {
    const id = url.searchParams.get('id');
    if (!id) {
      res.statusCode = 400;
      return res.end('Missing id');
    }
    try {
      const ytdl = new Ytdl();
      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const stream = ytdl.download(id, { filter: (f) => f.hasAudio && !f.hasVideo, quality: 'highestaudio' });
      stream.pipe(res);
    } catch (e) {
      res.statusCode = 500;
      res.end(e.message);
    }
  } else {
    res.end('OK');
  }
});

server.listen(4321, async () => {
  console.log('Test server running on http://localhost:4321');
  
  // Test search request
  const searchRes = await fetch('http://localhost:4321/api/search?q=hindia');
  const searchData = await searchRes.json();
  console.log(`Search returned ${searchData.length} songs. First song:`, searchData[0]?.title);

  // Test stream request
  if (searchData[0]?.id) {
    const streamRes = await fetch(`http://localhost:4321/api/stream?id=${searchData[0].id}`);
    console.log('Stream HTTP status:', streamRes.status);
    console.log('Stream Content-Type:', streamRes.headers.get('content-type'));
    const reader = streamRes.body.getReader();
    const { value } = await reader.read();
    console.log(`First audio chunk received: ${value?.length} bytes!`);
  }

  server.close();
  console.log('Test completed successfully!');
  process.exit(0);
});
