import yts from 'yt-search';
import { Ytdl } from '@distube/ytdl-core';

async function test() {
  const vid = 'AQpEIZ8dNcU';
  console.log(`Testing stream for ${vid}...`);
  const ytdl = new Ytdl();
  const stream = ytdl.download(vid, { filter: (f) => f.hasAudio && !f.hasVideo, quality: 'highestaudio' });

  let chunkCount = 0;
  let totalBytes = 0;
  stream.on('data', (chunk) => {
    chunkCount++;
    totalBytes += chunk.length;
    if (chunkCount === 5) {
      console.log(`SUCCESS! STREAMING AUDIO CHUNKS WORKING 100%! Received ${totalBytes} bytes in ${chunkCount} chunks.`);
      stream.destroy();
      process.exit(0);
    }
  });

  stream.on('error', (err) => {
    console.error('Stream error:', err.message);
    process.exit(1);
  });
}

test();
