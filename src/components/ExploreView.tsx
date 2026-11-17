import React, { useState } from 'react';
import { Song } from '../types/music';
import { Search, Play, Heart, Flame, Sparkles, TrendingUp, Music2, Loader2 } from 'lucide-react';

interface Props {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onSearch: (q: string) => void;
  isSearching: boolean;
  onToggleLike: (song: Song) => void;
}

export const ExploreView: React.FC<Props> = ({
  songs,
  onSelectSong,
  currentSong,
  isPlaying,
  onSearch,
  isSearching,
  onToggleLike
}) => {
  const [query, setQuery] = useState('');

  const quickGenres = [
    'Trending Indonesia',
    'Sal Priadi',
    'Hindia',
    'Juicy Luicy',
    'Billie Eilish',
    'Lo-Fi Study Beats',
    'Pop Global Hits',
    'Acoustic Chill'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleQuickTag = (tag: string) => {
    setQuery(tag);
    onSearch(tag);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6 space-y-6 select-none">
      {/* Top Search & Filter Bar */}
      <div className="space-y-3">
        <form onSubmit={handleSubmit} className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari jutaan lagu, artis, atau judul di YouTube Music secara realtime..."
            className="w-full pl-11 pr-28 py-3.5 rounded-2xl papabieo-glass text-white placeholder-white/30 text-xs focus:outline-none focus:border-cyan-500/50 shadow-2xl transition"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-violet-500/20 flex items-center gap-1.5"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <span>Cari Lagu</span>
            )}
          </button>
        </form>

        {/* Quick Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickGenres.map((tag) => (
            <button
              key={tag}
              onClick={() => handleQuickTag(tag)}
              className="px-3.5 py-1.5 rounded-xl text-[11px] font-semibold papabieo-pill text-white/70 hover:text-cyan-300 hover:border-cyan-500/40 whitespace-nowrap transition"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 papabieo-card border border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-950/40 via-indigo-950/20 to-cyan-950/30">
        <div className="space-y-3 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>papabieo Pure Audio Stream</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-snug font-['Space_Grotesk']">
            Musik Jernih Tanpa Iklan, Tanpa Kompromi
          </h2>
          <p className="text-xs text-white/60 leading-relaxed">
            Streaming audio real-time langsung dari server CDN YouTube Music dengan latensi rendah, visualizer frekuensi dinamis, dan efek audio spasial 8D.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => songs[0] && onSelectSong(songs[0])}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition shadow-xl shadow-white/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Putar Sekarang</span>
            </button>
            <span className="text-xs text-white/40">
              100% Bebas Iklan & Buffer Cepat
            </span>
          </div>
        </div>

        {/* Decorative Vinyl Art */}
        <div className="hidden lg:flex relative w-44 h-44 rounded-3xl overflow-hidden shadow-2xl rotate-3 border border-white/20">
          <img
            src={songs[0]?.thumbnail || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500'}
            alt="Hero Thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </div>

      {/* Songs Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="text-base font-extrabold text-white tracking-wide">
              {query ? `Hasil Pencarian: "${query}"` : 'Lagu Populer & Rekomendasi'}
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {songs.length} Lagu Tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {songs.map((song) => {
            const isCurrent = currentSong?.id === song.id;

            return (
              <div
                key={song.id}
                onClick={() => onSelectSong(song)}
                className={`group flex items-center justify-between p-3.5 rounded-2xl papabieo-card cursor-pointer transition ${
                  isCurrent
                    ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-3.5 truncate">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>
                  <div className="truncate">
                    <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-white/50 truncate">
                      {song.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2 shrink-0">
                  <span className="text-[10px] font-mono text-white/40">
                    {formatDuration(song.duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(song);
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      song.liked
                        ? 'text-pink-500 fill-pink-500'
                        : 'text-white/30 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${song.liked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
