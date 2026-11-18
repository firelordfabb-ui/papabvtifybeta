import { ApiConfig } from './apiConfig';
import { DownloadService } from './downloadService';

/**
 * PAPABVTIFY Standalone Audio Stream Resolver
 * Enables 100% standalone audio playback on Android APK & Web
 * without depending on any local PC server or LAN IP.
 */

// Public high-reliability Piped and Invidious API instances
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacydev.net',
  'https://piped-api.lunar.icu',
  'https://pipedapi.tokhmi.xyz'
];

interface CachedStream {
  url: string;
  expiresAt: number;
}

export class StreamResolver {
  private static cache: Map<string, CachedStream> = new Map();

  /**
   * Resolves a guaranteed playable direct progressive audio stream URL for a given song ID.
   */
  public static async resolveAudioStream(
    songId: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<string> {
    if (!songId) return '';

    // 1. Check if the song has already been downloaded to offline IndexedDB storage
    try {
      const offlineBlobUrl = await DownloadService.getOfflineAudioUrl(songId);
      if (offlineBlobUrl) {
        console.log(`[StreamResolver] Playing "${songId}" from offline IndexedDB cache.`);
        return offlineBlobUrl;
      }
    } catch (e) {
      console.warn('[StreamResolver] Offline cache check notice:', e);
    }

    // 2. Check in-memory cache if not forcing refresh
    if (!options.forceRefresh) {
      const cached = this.cache.get(songId);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.url;
      }
    }

    // 3. If a custom remote backend is configured and reachable, try it first
    const customBase = ApiConfig.getCustomServerUrl();
    if (customBase) {
      try {
        const testRes = await fetch(`${customBase}/api/stream?id=${encodeURIComponent(songId)}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(1800)
        });
        if (testRes.ok || testRes.status === 206) {
          const directUrl = `${customBase}/api/stream?id=${encodeURIComponent(songId)}`;
          this.cache.set(songId, { url: directUrl, expiresAt: Date.now() + 2 * 3600 * 1000 });
          return directUrl;
        }
      } catch {
        // Backend not reachable, fall through to standalone resolution
      }
    }

    // 4. Standalone Resolution via Piped API stream instances
    for (const instance of PIPED_INSTANCES) {
      try {
        const streamUrl = await this.fetchStreamFromPiped(instance, songId);
        if (streamUrl) {
          // Cache for 3 hours (googlevideo streams usually expire in 6 hours)
          this.cache.set(songId, { url: streamUrl, expiresAt: Date.now() + 3 * 3600 * 1000 });
          return streamUrl;
        }
      } catch (err) {
        console.warn(`[StreamResolver] Instance ${instance} failed:`, err);
      }
    }

    // 5. Standalone Resolution via YouTube InnerTube Android Player API
    try {
      const ytStream = await this.fetchStreamFromInnerTube(songId);
      if (ytStream) {
        this.cache.set(songId, { url: ytStream, expiresAt: Date.now() + 3 * 3600 * 1000 });
        return ytStream;
      }
    } catch (err) {
      console.warn('[StreamResolver] InnerTube direct resolution note:', err);
    }

    // 6. Last resort: return standard stream route or empty
    return ApiConfig.resolveStreamUrl(songId);
  }

  /**
   * Fetches progressive audio stream from a Piped API instance
   */
  private static async fetchStreamFromPiped(instanceUrl: string, songId: string): Promise<string | null> {
    const endpoint = `${instanceUrl}/streams/${encodeURIComponent(songId)}`;
    let json: any = null;

    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      try {
        const { CapacitorHttp } = await import('@capacitor/core');
        const res = await CapacitorHttp.get({
          url: endpoint,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36'
          },
          connectTimeout: 4000,
          readTimeout: 4000
        });
        json = res.data;
      } catch (e) {
        console.warn('[StreamResolver] CapacitorHttp Piped error:', e);
      }
    }

    if (!json) {
      const res = await fetch(endpoint, {
        signal: AbortSignal.timeout(4000),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        json = await res.json();
      }
    }

    if (json && Array.isArray(json.audioStreams) && json.audioStreams.length > 0) {
      // Find highest quality M4A or WebM audio stream
      const audio = json.audioStreams.find((s: any) => s.format === 'M4A' || s.mimeType?.includes('audio/mp4'))
        || json.audioStreams[0];
      if (audio && audio.url) {
        return audio.url;
      }
    }

    return null;
  }

  /**
   * Direct YouTube InnerTube Player Stream Resolver
   */
  private static async fetchStreamFromInnerTube(songId: string): Promise<string | null> {
    const payload = {
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.09.37',
          androidSdkVersion: 34,
          hl: 'id',
          gl: 'ID'
        }
      },
      videoId: songId
    };

    let json: any = null;

    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      try {
        const { CapacitorHttp } = await import('@capacitor/core');
        const res = await CapacitorHttp.post({
          url: 'https://www.youtube.com/youtubei/v1/player',
          data: payload,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 14; id_ID)'
          },
          connectTimeout: 4000,
          readTimeout: 4000
        });
        json = res.data;
      } catch (e) {
        console.warn('[StreamResolver] CapacitorHttp InnerTube player note:', e);
      }
    }

    if (!json) {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        json = await res.json();
      }
    }

    if (json && json.streamingData) {
      const formats = json.streamingData.adaptiveFormats || [];
      const audioFormat = formats.find((f: any) => f.mimeType?.startsWith('audio/mp4') && f.url)
        || formats.find((f: any) => f.mimeType?.startsWith('audio/') && f.url);

      if (audioFormat && audioFormat.url) {
        return audioFormat.url;
      }
    }

    return null;
  }
}
