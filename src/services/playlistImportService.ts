import { Song } from '../types/music';
import { InnerTubeService } from './innertube';
import { StorageService } from './storage';

export type TrackMatchStatus = 'Matched' | 'Needs Verification' | 'Not Found';

export interface ImportedTrack {
  index: number;
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail: string;
  status: TrackMatchStatus;
  matchScore: number;
  matchedSong?: Song;
  candidateOptions?: Song[];
  previewUrl?: string | null;
}

export interface ImportedPlaylistResult {
  source: 'spotify' | 'youtube';
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  trackCount: number;
  matchedCount: number;
  needsVerificationCount: number;
  notFoundCount: number;
  accuracyPercentage: number;
  tracks: ImportedTrack[];
}

interface BackendSourceResponse {
  source: 'spotify' | 'youtube';
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalTracks: number;
  tracks: {
    index: number;
    sourceId: string;
    title: string;
    artist: string;
    duration: number;
    thumbnail: string;
    previewUrl?: string | null;
  }[];
  error?: string;
}

export class PlaylistImportService {
  /**
   * Identifies URL provider: 'spotify' | 'youtube' | null
   */
  public static detectProvider(url: string): 'spotify' | 'youtube' | null {
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
   * Imports playlist from URL, resolves authentic tracks from source,
   * and matches them accurately without dummy fallbacks or random substitutions.
   */
  public static async importFromUrl(
    url: string,
    onProgress?: (msg: string) => void
  ): Promise<ImportedPlaylistResult> {
    const provider = this.detectProvider(url);
    if (!provider) {
      throw new Error('URL tidak dikenali. Masukkan tautan playlist publik dari Spotify atau YouTube.');
    }

    if (onProgress) onProgress('Menghubungi sumber playlist...');

    // 1. Fetch authentic playlist metadata and tracks from backend extractor
    const endpoint = `/api/playlist/source?url=${encodeURIComponent(url.trim())}`;
    const res = await fetch(endpoint);
    if (!res.ok) {
      let errJson: any = null;
      try {
        errJson = await res.json();
      } catch (_) {}
      throw new Error(errJson?.error || `Gagal mengambil playlist dari sumber (HTTP ${res.status}). Pastikan playlist bersifat Publik.`);
    }

    const sourceData: BackendSourceResponse = await res.json();
    if (!sourceData.tracks || sourceData.tracks.length === 0) {
      throw new Error('Playlist sumber kosong atau tidak memiliki track yang dapat diimpor.');
    }

    const total = sourceData.tracks.length;
    if (onProgress) onProgress(`Memeriksa ${total} lagu dari ${sourceData.source === 'spotify' ? 'Spotify' : 'YouTube'}...`);

    const resolvedTracks: ImportedTrack[] = [];

    // 2. Resolve Tracks
    if (sourceData.source === 'youtube') {
      // YouTube playlist tracks are ALREADY authentic YouTube audio streams
      for (let i = 0; i < sourceData.tracks.length; i++) {
        const item = sourceData.tracks[i];
        const song: Song = {
          id: item.sourceId,
          title: item.title,
          artist: item.artist,
          album: sourceData.title,
          duration: item.duration || 210,
          thumbnail: item.thumbnail,
          streamUrl: `/api/stream?id=${item.sourceId}`,
          liked: StorageService.isFavorite(item.sourceId)
        };

        resolvedTracks.push({
          index: item.index || (i + 1),
          id: item.sourceId,
          title: item.title,
          artist: item.artist,
          album: sourceData.title,
          duration: item.duration,
          thumbnail: item.thumbnail,
          status: 'Matched',
          matchScore: 100,
          matchedSong: song
        });
      }
    } else {
      // Spotify playlist tracks: match accurately against YouTube playback catalog
      for (let i = 0; i < sourceData.tracks.length; i++) {
        const item = sourceData.tracks[i];
        if (onProgress) {
          onProgress(`Mencocokkan (${i + 1}/${total}): ${item.title} — ${item.artist}...`);
        }

        try {
          // Search query combining title and artist
          const searchQuery = `${item.title} ${item.artist}`;
          const candidates = await InnerTubeService.search(searchQuery);

          if (candidates && candidates.length > 0) {
            // Score all candidates
            const scoredCandidates = candidates.slice(0, 5).map(c => ({
              candidate: c,
              score: this.calculateMatchScore(item, c)
            }));

            // Sort candidates by match score descending
            scoredCandidates.sort((a, b) => b.score - a.score);
            const best = scoredCandidates[0];

            let status: TrackMatchStatus = 'Not Found';
            if (best.score >= 60) {
              status = 'Matched';
            } else if (best.score >= 40) {
              status = 'Needs Verification';
            } else {
              status = 'Not Found';
            }

            resolvedTracks.push({
              index: item.index || (i + 1),
              id: status !== 'Not Found' ? best.candidate.id : `spot_${i}`,
              title: item.title,
              artist: item.artist,
              album: sourceData.title,
              duration: item.duration || (status !== 'Not Found' ? best.candidate.duration : 210),
              thumbnail: item.thumbnail || (best.candidate ? best.candidate.thumbnail : sourceData.thumbnail),
              status,
              matchScore: best.score,
              matchedSong: status !== 'Not Found' ? best.candidate : undefined,
              candidateOptions: scoredCandidates.map(sc => sc.candidate),
              previewUrl: item.previewUrl
            });
          } else {
            // Strictly NO random song replacement
            resolvedTracks.push({
              index: item.index || (i + 1),
              id: `spot_${i}`,
              title: item.title,
              artist: item.artist,
              album: sourceData.title,
              duration: item.duration || 210,
              thumbnail: item.thumbnail || sourceData.thumbnail,
              status: 'Not Found',
              matchScore: 0,
              previewUrl: item.previewUrl
            });
          }
        } catch (matchErr) {
          console.warn(`Matching error for ${item.title}:`, matchErr);
          // Preserve track in exact position with Not Found status
          resolvedTracks.push({
            index: item.index || (i + 1),
            id: `spot_${i}`,
            title: item.title,
            artist: item.artist,
            album: sourceData.title,
            duration: item.duration || 210,
            thumbnail: item.thumbnail || sourceData.thumbnail,
            status: 'Not Found',
            matchScore: 0,
            previewUrl: item.previewUrl
          });
        }
      }
    }

    // 3. Calculate statistics
    const matchedCount = resolvedTracks.filter(t => t.status === 'Matched').length;
    const needsVerificationCount = resolvedTracks.filter(t => t.status === 'Needs Verification').length;
    const notFoundCount = resolvedTracks.filter(t => t.status === 'Not Found').length;
    const accuracyPercentage = total > 0 ? Math.round(((matchedCount + (needsVerificationCount * 0.7)) / total) * 100) : 0;

    return {
      source: sourceData.source,
      id: sourceData.id,
      title: sourceData.title,
      description: sourceData.description,
      thumbnail: sourceData.thumbnail,
      trackCount: resolvedTracks.length,
      matchedCount,
      needsVerificationCount,
      notFoundCount,
      accuracyPercentage,
      tracks: resolvedTracks
    };
  }

  /**
   * Allows manual reassignment or verification of a specific track slot
   */
  public static manuallyMatchTrack(
    currentResult: ImportedPlaylistResult,
    trackIndex: number,
    selectedSong: Song
  ): ImportedPlaylistResult {
    const updatedTracks = currentResult.tracks.map(t => {
      if (t.index === trackIndex) {
        return {
          ...t,
          id: selectedSong.id,
          matchedSong: selectedSong,
          status: 'Matched' as TrackMatchStatus,
          matchScore: 100,
          thumbnail: selectedSong.thumbnail || t.thumbnail,
          duration: selectedSong.duration || t.duration
        };
      }
      return t;
    });

    const matchedCount = updatedTracks.filter(t => t.status === 'Matched').length;
    const needsVerificationCount = updatedTracks.filter(t => t.status === 'Needs Verification').length;
    const notFoundCount = updatedTracks.filter(t => t.status === 'Not Found').length;
    const accuracyPercentage = updatedTracks.length > 0 ? Math.round(((matchedCount + (needsVerificationCount * 0.7)) / updatedTracks.length) * 100) : 0;

    return {
      ...currentResult,
      matchedCount,
      needsVerificationCount,
      notFoundCount,
      accuracyPercentage,
      tracks: updatedTracks
    };
  }

  /**
   * Saves the imported playlist directly into local storage preserving exact sequence
   */
  public static saveImportedPlaylist(
    result: ImportedPlaylistResult,
    mode: 'all' | 'matched_only' = 'all'
  ): void {
    const validTracks = mode === 'matched_only'
      ? result.tracks.filter(t => t.status === 'Matched' || (t.status === 'Needs Verification' && t.matchedSong))
      : result.tracks;

    const allSongs: Song[] = validTracks.map(t => {
      if (t.matchedSong) {
        return t.matchedSong;
      }
      // Unmatched track placeholder preserved at exact position
      return {
        id: t.id.startsWith('spot_') ? t.id : `spot_${t.index}`,
        title: t.title,
        artist: t.artist,
        album: result.title,
        duration: t.duration || 210,
        thumbnail: t.thumbnail || result.thumbnail,
        streamUrl: undefined // flagged as unplayable until resolved
      };
    });

    const songIds = allSongs.map(s => s.id);
    const thumbnails = allSongs.slice(0, 4).map(s => s.thumbnail);

    const description = `Diimpor dari ${result.source === 'spotify' ? 'Spotify' : 'YouTube'} • ${allSongs.length} lagu (Akurasi ${result.accuracyPercentage}%)`;

    StorageService.createPlaylist(
      result.title,
      description,
      songIds,
      thumbnails.length > 0 ? thumbnails : [result.thumbnail],
      allSongs
    );
  }

  /**
   * Precision multi-factor matcher:
   * 1. Title Similarity (Max 45)
   * 2. Artist Similarity (Max 35) with strict rejection if artist is completely different
   * 3. Duration Closeness (Max 20) with heavy penalty for 1-hour loops or extended mixes
   */
  public static calculateMatchScore(
    source: { title: string; artist: string; duration?: number },
    candidate: Song
  ): number {
    const sTitle = this.cleanTitle(source.title);
    const cTitle = this.cleanTitle(candidate.title);
    const sArtist = this.cleanArtist(source.artist);
    const cArtist = this.cleanArtist(candidate.artist);

    // 1. Title Score (max 45)
    let titleScore = 0;
    if (sTitle === cTitle) {
      titleScore = 45;
    } else if (cTitle.includes(sTitle) || sTitle.includes(cTitle)) {
      titleScore = 35;
    } else {
      const sWords = sTitle.split(' ').filter(w => w.length > 2);
      const cWords = new Set(cTitle.split(' '));
      const matched = sWords.filter(w => cWords.has(w));
      if (sWords.length > 0) {
        titleScore = Math.round((matched.length / sWords.length) * 30);
      }
    }

    // 2. Artist Score (max 35) - STRICT
    let artistScore = 0;
    let hasArtistMatch = false;
    const sArtists = this.extractArtistList(source.artist);

    if (sArtist === cArtist) {
      artistScore = 35;
      hasArtistMatch = true;
    } else {
      for (const a of sArtists) {
        if (cArtist.includes(a) || cTitle.includes(a)) {
          artistScore = Math.max(artistScore, 28);
          hasArtistMatch = true;
          break;
        }
      }
    }

    // Hard rejection if candidate artist does not match source artist in any way
    if (!hasArtistMatch) {
      return 20;
    }

    // 3. Duration Score (max 20)
    let durationScore = 10;
    if (source.duration && source.duration > 0 && candidate.duration && candidate.duration > 0) {
      const diff = Math.abs(source.duration - candidate.duration);
      if (diff <= 5) durationScore = 20;
      else if (diff <= 15) durationScore = 15;
      else if (diff <= 30) durationScore = 10;
      else if (diff <= 60) durationScore = 5;
      else if (diff > 90) durationScore = -20; // Heavy penalty for extended or wrong tracks
    }

    return Math.max(0, Math.min(100, titleScore + artistScore + durationScore));
  }

  private static cleanTitle(s: string): string {
    if (!s) return '';
    return s
      .toLowerCase()
      .replace(/\s*\(official\s*(music\s*)?video\)/gi, '')
      .replace(/\s*\[official\s*(music\s*)?video\]/gi, '')
      .replace(/\s*\(official\s*audio\)/gi, '')
      .replace(/\s*\[official\s*audio\]/gi, '')
      .replace(/\s*\(lyric\s*video\)/gi, '')
      .replace(/\s*\(lyrics?\)/gi, '')
      .replace(/\s*\[lyrics?\]/gi, '')
      .replace(/\s*\(remastered(\s*\d+)?\)/gi, '')
      .replace(/\s*-\s*official\s*video/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static cleanArtist(s: string): string {
    if (!s) return '';
    return s
      .toLowerCase()
      .replace(/\s*-\s*topic/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static extractArtistList(artistStr: string): string[] {
    if (!artistStr) return [];
    return artistStr
      .toLowerCase()
      .split(/[,&/]|(\s+(?:feat|ft|with|x)\.?\s+)/i)
      .map(a => this.cleanArtist(a))
      .filter(a => a && a.length > 1);
  }
}
