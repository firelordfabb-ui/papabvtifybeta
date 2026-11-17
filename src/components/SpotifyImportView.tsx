import React, { useState } from 'react';
import { SpotifyImporter, SpotifyImportProgress } from '../services/spotify';
import { Song } from '../types/music';
import { Radio, ArrowRight, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react';

interface Props {
  onAddSongsToLibrary: (songs: Song[]) => void;
  onPlaySong: (song: Song) => void;
}

export const SpotifyImportView: React.FC<Props> = ({ onAddSongsToLibrary, onPlaySong }) => {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState<SpotifyImportProgress>({
    status: 'idle',
    total: 0,
    current: 0,
    message: ''
  });
  const [importedSongs, setImportedSongs] = useState<Song[]>([]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const songs = await SpotifyImporter.importPlaylist(url, setProgress);
    if (songs.length > 0) {
      setImportedSongs(songs);
      onAddSongsToLibrary(songs);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6 space-y-6 select-none max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="liquid-glass rounded-3xl p-8 border border-white/10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Radio className="w-3.5 h-3.5" />
          <span>Spotify & Apple Music Fast Importer</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Pindahkan Playlist Spotify-mu ke Auralis Tanpa Batasan
        </h2>
        <p className="text-xs text-white/60 max-w-xl leading-relaxed">
          Tempel link playlist Spotify publik di bawah ini. Aplikasi akan secara cerdas membedah seluruh daftar lagu dan mencocokkannya ke audio beresolusi tinggi di YouTube Music tanpa memerlukan akun developer ataupun browser tersembunyi.
        </p>

        {/* Input Form */}
        <form onSubmit={handleImport} className="flex gap-3 pt-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M..."
            className="flex-1 px-4 py-3 rounded-2xl liquid-glass border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={progress.status === 'fetching' || progress.status === 'matching'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            {progress.status === 'fetching' || progress.status === 'matching' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Mulai Impor</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Live Progress Bar */}
        {progress.status !== 'idle' && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-white/70">{progress.message}</span>
              {progress.total > 0 && (
                <span className="text-emerald-400 font-mono">
                  {progress.current} / {progress.total}
                </span>
              )}
            </div>
            {progress.total > 0 && (
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Imported Songs List Preview */}
      {importedSongs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Lagu yang Berhasil Diimpor ({importedSongs.length})</h3>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersimpan di Pustaka
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {importedSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => onPlaySong(song)}
                className="flex items-center justify-between p-3 rounded-2xl liquid-glass-card cursor-pointer hover:border-emerald-500/40 group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-white truncate">{song.title}</h4>
                    <p className="text-[11px] text-white/50 truncate">{song.artist}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
