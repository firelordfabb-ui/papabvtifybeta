/**
 * PAPABVTIFY Authenticated Playlist Extractor
 * Strictly extracts authentic tracks from Spotify and YouTube public playlists.
 * ZERO random tracks, ZERO dummy fallbacks, ZERO silent substitutions.
 */

function detectProvider(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim().toLowerCase();
  if (clean.includes('spotify.com/playlist') || clean.includes('spotify:playlist:')) {
    return 'spotify';
  }
  if (clean.includes('youtube.com/playlist') || clean.includes('music.youtube.com/playlist') || (clean.includes('youtube.com') && clean.includes('list='))) {
    return 'youtube';
  }
  return null;
}

/**
 * Extracts authentic tracks from a public Spotify playlist embed
 */
async function fetchSpotifyPlaylist(url) {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error('Format tautan Spotify tidak valid. Gunakan format https://open.spotify.com/playlist/...');
  }
  const playlistId = match[1];

  // Fetch Spotify Embed page which contains complete hydrated playlist JSON
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
  const res = await fetch(embedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengakses Spotify (HTTP ${res.status}). Pastikan playlist bersifat Publik.`);
  }

  const html = await res.text();
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!nextDataMatch) {
    throw new Error('Tidak dapat membaca data playlist Spotify. Playlist mungkin bersifat privat atau sudah dihapus.');
  }

  let nextData;
  try {
    nextData = JSON.parse(nextDataMatch[1]);
  } catch (e) {
    throw new Error('Format data Spotify tidak dapat diuraikan.');
  }

  const entity = nextData?.props?.pageProps?.state?.data?.entity;
  if (!entity) {
    throw new Error('Playlist Spotify tidak ditemukan atau disetel ke Privat.');
  }

  const title = entity.name || 'Spotify Playlist';
  const description = entity.subtitle || 'Koleksi playlist diimpor dari Spotify';
  
  // Resolve best cover thumbnail
  let thumbnail = 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg';
  if (entity.visualIdentity?.image && entity.visualIdentity.image.length > 0) {
    thumbnail = entity.visualIdentity.image[0].url;
  }

  const rawTracks = Array.isArray(entity.trackList) ? entity.trackList : [];
  if (rawTracks.length === 0) {
    throw new Error('Playlist Spotify ini kosong (tidak ada track di dalamnya).');
  }

  const tracks = rawTracks.map((t, idx) => {
    const durSec = t.duration ? Math.round(t.duration / 1000) : 0;
    return {
      index: idx + 1,
      sourceId: t.uri || `spot_${idx}`,
      title: t.title || 'Unknown Title',
      artist: t.subtitle || 'Unknown Artist',
      duration: durSec,
      thumbnail: thumbnail,
      previewUrl: t.audioPreview?.url || null
    };
  });

  return {
    source: 'spotify',
    id: playlistId,
    title,
    description,
    thumbnail,
    totalTracks: tracks.length,
    tracks
  };
}

/**
 * Extracts authentic tracks from a public YouTube playlist
 */
async function fetchYouTubePlaylist(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error('Format tautan YouTube tidak valid. Pastikan link memiliki parameter ?list=...');
  }
  const listId = match[1];

  const pageUrl = `https://www.youtube.com/playlist?list=${listId}`;
  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!res.ok) {
    throw new Error(`Gagal mengakses YouTube (HTTP ${res.status}). Pastikan playlist bersifat Publik.`);
  }

  const html = await res.text();
  const matchData = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) || html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/);
  if (!matchData) {
    throw new Error('Tidak dapat membaca data halaman YouTube playlist.');
  }

  let data;
  try {
    data = JSON.parse(matchData[1]);
  } catch (e) {
    throw new Error('Format data YouTube tidak valid.');
  }

  // Check error alerts
  if (data.alerts && Array.isArray(data.alerts)) {
    for (const a of data.alerts) {
      const text = a?.alertRenderer?.text?.runs?.map(r => r.text).join('') || '';
      if (text.toLowerCase().includes('not exist') || text.toLowerCase().includes('private')) {
        throw new Error(`YouTube: ${text}`);
      }
    }
  }

  let title = data.microformat?.microformatDataRenderer?.title || data.metadata?.playlistMetadataRenderer?.title || 'YouTube Playlist';
  let description = data.microformat?.microformatDataRenderer?.description || 'Koleksi playlist diimpor dari YouTube';
  let thumbnail = 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg';

  const tracks = [];

  // Helper to parse duration string like "3:45" or "1:02:15" to seconds
  function parseDurationString(str) {
    if (!str || typeof str !== 'string') return 0;
    const parts = str.trim().split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  // Helper 1: Modern lockupViewModel extraction
  function findLockups(obj, list = []) {
    if (!obj || typeof obj !== 'object') return list;
    if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
      list.push(obj.lockupViewModel);
      return list;
    }
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'object') {
        findLockups(obj[k], list);
      }
    }
    return list;
  }

  // Helper 2: Classic playlistVideoRenderer extraction
  function findClassicRenderers(obj, list = []) {
    if (!obj || typeof obj !== 'object') return list;
    if (obj.playlistVideoRenderer && obj.playlistVideoRenderer.videoId) {
      list.push(obj.playlistVideoRenderer);
      return list;
    }
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'object') {
        findClassicRenderers(obj[k], list);
      }
    }
    return list;
  }

  const modernLockups = findLockups(data.contents);
  if (modernLockups.length > 0) {
    modernLockups.forEach((l, idx) => {
      const id = l.contentId;
      const t = l.metadata?.lockupMetadataViewModel?.title?.content || 'Unknown Title';
      
      // Extract author from contentMetadataViewModel
      let artist = 'Unknown Artist';
      const rows = l.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
      if (rows && rows[0]?.metadataParts && rows[0].metadataParts[0]?.text?.content) {
        artist = rows[0].metadataParts[0].text.content;
      }

      // Extract duration badge
      let durSec = 0;
      const overlays = l.contentImage?.thumbnailViewModel?.overlays;
      if (overlays && overlays[0]?.thumbnailBottomOverlayViewModel?.badges) {
        const badgeText = overlays[0].thumbnailBottomOverlayViewModel.badges[0]?.thumbnailBadgeViewModel?.text;
        durSec = parseDurationString(badgeText);
      }

      // Thumbnail
      const sources = l.contentImage?.thumbnailViewModel?.image?.sources;
      const thumb = sources && sources.length > 0 ? sources[sources.length - 1].url : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      if (idx === 0) thumbnail = thumb;

      tracks.push({
        index: idx + 1,
        sourceId: id,
        title: t,
        artist,
        duration: durSec,
        thumbnail: thumb
      });
    });
  } else {
    // Try classic renderer
    const classicList = findClassicRenderers(data.contents);
    classicList.forEach((v, idx) => {
      const id = v.videoId;
      const t = v.title?.runs?.map(r => r.text).join('') || v.title?.simpleText || 'Unknown Title';
      const artist = v.shortBylineText?.runs?.map(r => r.text).join('') || 'Unknown Artist';
      const durSec = parseInt(v.lengthSeconds || '0', 10);
      const thumbs = v.thumbnail?.thumbnails || [];
      const thumb = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      if (idx === 0) thumbnail = thumb;

      tracks.push({
        index: idx + 1,
        sourceId: id,
        title: t,
        artist,
        duration: durSec,
        thumbnail: thumb
      });
    });
  }

  if (tracks.length === 0) {
    throw new Error('Tidak ada track yang ditemukan di dalam YouTube playlist ini.');
  }

  return {
    source: 'youtube',
    id: listId,
    title,
    description,
    thumbnail,
    totalTracks: tracks.length,
    tracks
  };
}

module.exports = {
  detectProvider,
  fetchSpotifyPlaylist,
  fetchYouTubePlaylist
};
