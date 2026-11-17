import React, { useState } from 'react';
import { Song } from '../types/music';
import { Heart, Download, Play, Music, Trash2 } from 'lucide-react';

interface Props {
  likedSongs: Song[];
  downloadedSongs: Song[];
  onSelectSong: (song: Song) => void;
  onRemoveLiked: (song: Song) => void;
}

export const LibraryView: React.FC<Props> = ({
  likedSongs,
  downloadedSongs,
  onSelectSong,
  onRemoveLiked
}) => {
  const [tab, setTab] = useState<'liked' | 'downloads'>('liked');

  const songs = tab === 'liked' ? likedSongs : downloadedSongs;

  return (
    <div className="h-full overflow-y-auto px-8 py-6 space-y-6 select-none max-w-5xl mx-auto">
      {/* Header Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setTab('liked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'liked'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-lg shadow-pink-500/10'
              : 'text-white/60 hover:text-white liquid-glass-pill'
          }`}
        >
          <Heart className={`w-4 h-4 ${tab === 'liked' ? 'fill-current' : ''}`} />
          <span>Lagu yang Disukai ({likedSongs.length})</span>
        </button>

        <button
          onClick={() => setTab('downloads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'downloads'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
              : 'text-white/60 hover:text-white liquid-glass-pill'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Tersimpan Offline ({downloadedSongs.length})</span>
        </button>
      </div>

      {/* Song List */}
      {songs.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-white/40 space-y-3">
          <div className="p-4 rounded-3xl liquid-glass">
            <Music className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-xs">
            {tab === 'liked'
              ? 'Belum ada lagu yang kamu sukai. Tekan ikon hati pada lagu untuk menyimpannya!'
              : 'Belum ada lagu yang diunduh ke penyimpanan offline.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {songs.map((song) => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song)}
              className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-card cursor-pointer group hover:border-white/20 transition"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Play className="w-5 h-5 text-white fill-current" />
                  </div>
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-indigo-400 transition">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-white/50 truncate">
                    {song.artist}
                  </p>
                </div>
              </div>

              {tab === 'liked' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLiked(song);
                  }}
                  title="Hapus dari daftar suka"
                  className="p-2 text-white/30 hover:text-pink-400 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
