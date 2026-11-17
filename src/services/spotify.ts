import { Song } from '../types/music';
import { PlaylistImportService } from './playlistImportService';

export interface SpotifyImportProgress {
  status: 'idle' | 'fetching' | 'matching' | 'done' | 'error';
  total: number;
  current: number;
  message: string;
}

export class SpotifyImporter {
  /**
   * Authentic Spotify playlist importer powered by PAPABVTIFY Precision Extractor.
   * Zero dummy tracks, zero fake fallback data.
   */
  public static async importPlaylist(
    url: string,
    onProgress: (p: SpotifyImportProgress) => void
  ): Promise<Song[]> {
    try {
      onProgress({
        status: 'fetching',
        total: 0,
        current: 0,
        message: 'Mengambil metadata resmi playlist Spotify...'
      });

      const result = await PlaylistImportService.importFromUrl(url, (msg) => {
        onProgress({
          status: 'matching',
          total: 0,
          current: 0,
          message: msg
        });
      });

      // Filter matched songs
      const songs: Song[] = [];
      for (const t of result.tracks) {
        if (t.matchedSong) {
          songs.push(t.matchedSong);
        }
      }

      onProgress({
        status: 'done',
        total: result.trackCount,
        current: songs.length,
        message: `Berhasil mencocokkan ${songs.length} dari ${result.trackCount} lagu (${result.accuracyPercentage}% akurat)`
      });

      return songs;
    } catch (err: any) {
      onProgress({
        status: 'error',
        total: 0,
        current: 0,
        message: err.message || 'Gagal mengimpor playlist Spotify'
      });
      return [];
    }
  }
}
