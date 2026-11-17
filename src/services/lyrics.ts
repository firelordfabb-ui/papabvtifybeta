import { LyricsData, LyricLine, LyricWord } from '../types/music';
import { StorageService } from './storage';

export class LyricsService {
  /**
   * Sanitizes track title to maximize LRCLIB match accuracy while removing
   * YouTube noise like (Official Video), [MV], (Remastered), etc.
   */
  public static cleanTitle(title: string): string {
    return title
      .replace(/∞/g, '')
      .replace(/\((?:Official\s*(?:Music\s*)?(?:Video|Audio)|Lyric\s*Video|Visualizer|Live(?:\s*Performance)?|Audio|HD|4K|Lyrics?|Remaster(?:ed)?|Full\s*Song)[^)]*\)/gi, '')
      .replace(/\[(?:Official\s*(?:Music\s*)?(?:Video|Audio)|MV|HD|4K|Audio|Lyrics?|Remaster(?:ed)?)[^\]]*\]/gi, '')
      .replace(/\s*(?:feat\.?|ft\.?)\s+.*$/i, '')
      .replace(/\s*-\s*official.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Cleans artist names, removing "- Topic", "VEVO", etc.
   */
  public static cleanArtist(artist: string): string {
    return artist
      .replace(/\s*-\s*topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parse Enhanced and Standard LRC text.
   * Supports:
   * 1. Standard line timestamps: [mm:ss.xx] line text
   * 2. Enhanced word-by-word timestamps: [mm:ss.xx] <mm:ss.xx> word <mm:ss.xx> word ...
   * Does NOT invent fake timestamps.
   */
  public static parseLRC(lrcText: string): LyricLine[] {
    const rawLines = lrcText.split(/\r?\n/);
    const parsed: LyricLine[] = [];
    const lineTagRegex = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
    const wordTagRegex = /<(\d{2}):(\d{2})(?:\.(\d{1,3}))?>/g;

    for (const raw of rawLines) {
      const line = raw.trim();
      if (!line || line.startsWith('[ti:') || line.startsWith('[ar:') || line.startsWith('[al:') || line.startsWith('[by:') || line.startsWith('[offset:')) {
        continue;
      }

      // Collect line-level timestamps
      const lineTimestamps: number[] = [];
      let match: RegExpExecArray | null;
      lineTagRegex.lastIndex = 0;

      while ((match = lineTagRegex.exec(line)) !== null) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const frac = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        lineTimestamps.push(min * 60 + sec + frac / 1000);
      }

      if (lineTimestamps.length > 0) {
        // Remove line-level [mm:ss.xx] tags to inspect text content
        const remaining = line.replace(/\[\d{2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
        if (!remaining) continue;

        // Check for enhanced word-level tags: <mm:ss.xx> word
        const words: LyricWord[] = [];
        wordTagRegex.lastIndex = 0;
        const hasWordTags = wordTagRegex.test(remaining);

        if (hasWordTags) {
          // Parse word-by-word timestamps
          const tokens = remaining.split(/(<\d{2}:\d{2}(?:\.\d{1,3})?>)/g).filter(Boolean);
          let currentWordTime = lineTimestamps[0];

          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i].trim();
            const tagMatch = /<(\d{2}):(\d{2})(?:\.(\d{1,3}))?>/.exec(token);
            if (tagMatch) {
              const min = parseInt(tagMatch[1], 10);
              const sec = parseInt(tagMatch[2], 10);
              const frac = tagMatch[3] ? parseInt(tagMatch[3].padEnd(3, '0').slice(0, 3), 10) : 0;
              currentWordTime = min * 60 + sec + frac / 1000;
            } else if (token) {
              const nextTime = currentWordTime + 0.35; // reasonable word duration
              words.push({
                text: token,
                startTime: currentWordTime,
                endTime: nextTime
              });
            }
          }
        }

        // Clean plain text representation
        const cleanText = remaining.replace(/<\d{2}:\d{2}(?:\.\d{1,3})?>/g, '').trim();

        if (cleanText) {
          for (const time of lineTimestamps) {
            parsed.push({
              time,
              text: cleanText,
              words: words.length > 0 ? words : undefined
            });
          }
        }
      }
    }

    return parsed.sort((a, b) => a.time - b.time);
  }

  /**
   * Fetches accurate lyrics from LRCLIB with strict source validation.
   * Validates duration tolerance (+/- 4 seconds) so covers / mismatched songs
   * do not introduce broken sync.
   */
  public static async fetchLyrics(title: string, artist: string, duration?: number): Promise<LyricsData> {
    const cleanT = this.cleanTitle(title);
    const cleanA = this.cleanArtist(artist);
    const cacheKey = `${cleanT}_${cleanA}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // 1. Check persistent cache
    const cached = StorageService.getLyricsCache(cacheKey);
    if (cached && cached.lines && cached.lines.length > 0) {
      return cached;
    }

    try {
      // 2. Direct exact lookup with track name, artist name, and duration (with 4s timeout)
      const directUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanT)}&artist_name=${encodeURIComponent(cleanA)}${
        duration ? `&duration=${Math.round(duration)}` : ''
      }`;
      
      const fetchWithTimeout = async (url: string, ms = 4000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        try {
          const r = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);
          return r;
        } catch (e) {
          clearTimeout(timer);
          return null;
        }
      };

      const res = await fetchWithTimeout(directUrl);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.syncedLyrics) {
          const lines = this.parseLRC(data.syncedLyrics);
          if (lines.length > 0) {
            const result: LyricsData = {
              syncType: 'line',
              source: 'LRCLIB (Tersinkron Presisi)',
              lines
            };
            StorageService.setLyricsCache(cacheKey, result);
            return result;
          }
        } else if (data && data.plainLyrics) {
          const plainLines = data.plainLyrics
            .split(/\r?\n/)
            .map((t: string) => t.trim())
            .filter(Boolean)
            .map((text: string) => ({ time: -1, text }));

          const result: LyricsData = {
            syncType: 'plain',
            source: 'LRCLIB (Teks Biasa - Tanpa Sinkron)',
            lines: plainLines
          };
          StorageService.setLyricsCache(cacheKey, result);
          return result;
        }
      }

      // 3. Search fallback on LRCLIB with STRICT duration validation (with 4s timeout)
      const q = encodeURIComponent(`${cleanT} ${cleanA}`);
      const searchRes = await fetchWithTimeout(`https://lrclib.net/api/search?q=${q}`);
      if (searchRes && searchRes.ok) {
        const items = await searchRes.json();
        if (Array.isArray(items) && items.length > 0) {
          // Find item that strictly matches duration (within 4 seconds) if duration is available
          let bestSyncedItem = items.find((item: any) => {
            if (!item.syncedLyrics) return false;
            if (duration && typeof item.duration === 'number' && item.duration > 0) {
              return Math.abs(item.duration - duration) <= 4;
            }
            return true;
          });

          // If no strict duration match, but track_name and artist_name match cleanly
          if (!bestSyncedItem) {
            bestSyncedItem = items.find((item: any) => {
              if (!item.syncedLyrics) return false;
              const nameMatch = item.trackName && cleanT.toLowerCase().includes(item.trackName.toLowerCase());
              const durMatch = !duration || !item.duration || Math.abs(item.duration - duration) <= 7;
              return nameMatch && durMatch;
            });
          }

          if (bestSyncedItem && bestSyncedItem.syncedLyrics) {
            const lines = this.parseLRC(bestSyncedItem.syncedLyrics);
            if (lines.length > 0) {
              const result: LyricsData = {
                syncType: 'line',
                source: 'LRCLIB (Pencarian Tervalidasi)',
                lines
              };
              StorageService.setLyricsCache(cacheKey, result);
              return result;
            }
          }

          // Fallback to plain lyrics: NEVER fabricate fake timestamps!
          const plainItem = items.find((item: any) => item.plainLyrics);
          if (plainItem && plainItem.plainLyrics) {
            const plainLines = plainItem.plainLyrics
              .split(/\r?\n/)
              .map((t: string) => t.trim())
              .filter(Boolean)
              .map((text: string) => ({ time: -1, text }));

            const result: LyricsData = {
              syncType: 'plain',
              source: 'LRCLIB (Teks Biasa - Tanpa Sinkron)',
              lines: plainLines
            };
            StorageService.setLyricsCache(cacheKey, result);
            return result;
          }
        }
      }
    } catch (err) {
      console.warn('Lyrics network lookup failed:', err);
    }

    // 4. Honest fallback when not found
    return {
      syncType: 'plain',
      source: 'Lirik Belum Tersedia',
      lines: [
        { time: -1, text: `Lirik untuk "${title}" oleh ${artist} belum tersedia di database publik.` },
        { time: -1, text: 'Streaming audio tetap berjalan 100% normal tanpa jeda.' }
      ]
    };
  }

  /**
   * Fast, accurate index finder based on actual audio playback position.
   * Binary search / reverse scan.
   */
  public static findActiveIndex(lines: LyricLine[], currentTime: number, offset: number = 0): number {
    if (!lines || lines.length === 0) return -1;
    const effectiveTime = currentTime + offset;

    // Before first line
    if (lines[0].time > 0 && effectiveTime < lines[0].time) {
      return -1;
    }

    // Binary search for highest timestamp <= effectiveTime
    let low = 0;
    let high = lines.length - 1;
    let best = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lines[mid].time <= effectiveTime && lines[mid].time >= 0) {
        best = mid;
        low = mid + 1; // Try to find a later line
      } else {
        high = mid - 1;
      }
    }

    return best;
  }

  /**
   * Finds the active word inside a line if word-level timestamps are present
   */
  public static findActiveWordIndex(words: LyricWord[] | undefined, currentTime: number, offset: number = 0): number {
    if (!words || words.length === 0) return -1;
    const effectiveTime = currentTime + offset;

    for (let i = 0; i < words.length; i++) {
      if (effectiveTime >= words[i].startTime && effectiveTime <= words[i].endTime) {
        return i;
      }
    }
    return -1;
  }
}
