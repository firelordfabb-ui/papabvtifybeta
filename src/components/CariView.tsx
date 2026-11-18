import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Song } from '../types/music';
import { StorageService } from '../services/storage';
import { ArtistService } from '../services/artistService';
import {
  Search,
  History,
  X,
  Play,
  Heart,
  Trash2,
  Sparkles,
  HardDrive,
  Users,
  Disc3,
  ListMusic,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface Props {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  isSearching: boolean;
  onToggleLike: (song: Song) => void;
  onOpenPlayerModal?: () => void;
  onOpenArtist?: (artistId: string) => void;
}

export const CariView: React.FC<Props> = ({
  songs,
  currentSong,
  isPlaying,
  onSelectSong,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  isSearching,
  onToggleLike,
  onOpenPlayerModal,
  onOpenArtist
}) => {
  const [history, setHistory] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<'youtube' | 'perangkat'>('youtube');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const debounceTimerRef = useRef<any>(null);

  const handleSongClick = (song: Song) => {
    if (currentSong?.id === song.id && onOpenPlayerModal) {
      onOpenPlayerModal();
    } else {
      onSelectSong(song);
    }
  };

  useEffect(() => {
    setHistory(StorageService.getSearchHistory());
  }, []);

  // Debounced auto-search when query changes (280ms)
  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (val.trim()) {
        onSearchSubmit();
      }
    }, 280);
  };

  const recentSearchedTracks = useMemo(() => {
    return StorageService.getRecentlyPlayed().slice(0, 8);
  }, [currentSong]);

  // Filter matching artists from catalog
  const matchingArtists = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return ArtistService.getAllArtists().filter(
      a => a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleChipClick = (q: string) => {
    setSearchQuery(q);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onSearchSubmit();
    }, 100);
  };

  const handleRemoveChip = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.removeSearchQuery(q);
    setHistory(StorageService.getSearchHistory());
  };

  const handleClearHistory = () => {
    StorageService.clearSearchHistory();
    setHistory([]);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 h-full overflow-y-auto overflow-x-hidden px-3.5 sm:px-10 py-5 space-y-6 max-w-5xl mx-auto animate-fadeIn select-none pb-48">
      {/* Header */}
      <div className="space-y-0.5">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase font-bold">
          Eksplorasi Audio Realtime
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Cari Musik & Artis
        </h1>
      </div>

      {/* Large Minimalist Liquid Glass Search Input */}
      <form onSubmit={onSearchSubmit} className="relative">
        <div className="flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-5 py-3 rounded-2xl liquid-glass focus-within:ring-2 focus-within:ring-indigo-400/30 transition-all shadow-sm focus-within:shadow-md">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Ketik judul lagu, musisi, atau album..."
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="px-3.5 sm:px-5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-extrabold text-xs hover:opacity-90 transition active:scale-95 shadow-md shrink-0"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Filter Tabs & Source Switcher with Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
        {/* Category Filters: Semua, Lagu, Artis, Album */}
        {searchQuery && (
          <div className="flex items-center gap-1 liquid-glass-pill p-1 rounded-xl shrink-0">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'songs', label: `Lagu (${songs.length})` },
              { key: 'artists', label: `Artis (${matchingArtists.length})` },
              { key: 'albums', label: 'Album' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTabFilter(tab.key as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTabFilter === tab.key
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Source Switcher: YouTube Music | Perangkat */}
        <div className="flex items-center p-1 rounded-xl liquid-glass-pill shrink-0">
          <button
            onClick={() => setSourceFilter('youtube')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              sourceFilter === 'youtube'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-red-500 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>YouTube Music</span>
          </button>

          <button
            onClick={() => setSourceFilter('perangkat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              sourceFilter === 'perangkat'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Perangkat</span>
          </button>
        </div>
      </div>

      {/* Recent Searches / Riwayat Pencarian Chips */}
      {history.length > 0 && !searchQuery && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Pencarian Terakhir</span>
            </span>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 text-slate-500 hover:text-red-400 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {history.map((q) => (
              <div
                key={q}
                onClick={() => handleChipClick(q)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300 hover:text-white cursor-pointer active:scale-95 transition"
              >
                <span>{q}</span>
                <button
                  onClick={(e) => handleRemoveChip(q, e)}
                  className="text-slate-500 hover:text-white ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MATCHING ARTISTS SECTION (When query matches real artists) */}
      {searchQuery && (activeTabFilter === 'all' || activeTabFilter === 'artists') && matchingArtists.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Artis Ditemukan ({matchingArtists.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {matchingArtists.map(art => (
              <div
                key={art.id}
                onClick={() => onOpenArtist && onOpenArtist(art.id)}
                className="flex items-center gap-3 p-3 rounded-2xl liquid-glass cursor-pointer group active:scale-95 transition shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-black/5 dark:border-white/20 shrink-0">
                  <img src={art.avatar} alt={art.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-500">
                    {art.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {art.genre}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terakhir Diputar Horizontal Cards (When query is empty) */}
      {!searchQuery && recentSearchedTracks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Terakhir Diputar
          </h3>

          <div className="flex gap-3 sm:gap-3.5 overflow-x-auto pb-2 scrollbar-none px-0.5">
            {recentSearchedTracks.map((song) => (
              <div
                key={song.id}
                onClick={() => handleSongClick(song)}
                className="w-32 sm:w-36 shrink-0 space-y-2 cursor-pointer group active:scale-95 transition-all"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/12 shadow-md">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="12" fill="%231e293b"/><circle cx="40" cy="40" r="22" fill="%233b82f6" opacity="0.35"/><polygon points="36,30 52,40 36,50" fill="%23ffffff"/></svg>';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="px-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {song.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {song.artist}
                  </p>
                </div>
              </div>
            ))}
            <div className="w-3 shrink-0" />
          </div>
        </div>
      )}

      {/* Main Search Results / Trending Songs List */}
      {(activeTabFilter === 'all' || activeTabFilter === 'songs') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {searchQuery ? (
                <>
                  <ListMusic className="w-4 h-4 text-indigo-400" />
                  <span>Daftar Lagu ({songs.length})</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Paling Sering Diputar</span>
                </>
              )}
            </h2>
            {isSearching && (
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>Pencarian Cepat Aktif...</span>
              </div>
            )}
          </div>

          {/* SKELETON LOADING STATE */}
          {isSearching && songs.length === 0 && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="p-3 rounded-2xl liquid-glass flex items-center gap-3.5 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/15 rounded w-3/5" />
                    <div className="h-3 bg-white/10 rounded w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {songs.length === 0 && !isSearching && (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Lagu Tidak Ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Coba gunakan kata kunci artis atau judul yang lebih spesifik.
              </p>
            </div>
          )}

          {/* Songs Numbered Ranking List */}
          <div className="space-y-2">
            {songs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => handleSongClick(song)}
                  className={`p-2.5 sm:p-3 rounded-2xl liquid-glass flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] transition-all ${
                    isCurrent ? 'border-white/40 bg-white/[0.08]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold text-slate-500 w-5 text-center">
                      {idx + 1}
                    </span>

                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/10 shadow-sm">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="12" fill="%231e293b"/><circle cx="40" cy="40" r="22" fill="%233b82f6" opacity="0.35"/><polygon points="36,30 52,40 36,50" fill="%23ffffff"/></svg>';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {song.artist} • <span className="text-slate-400">{song.album || 'Single'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline font-mono text-xs text-slate-400">
                      {formatTime(song.duration)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(song);
                      }}
                      className={`p-2 transition active:scale-75 ${
                        song.liked ? 'text-red-500 fill-red-500' : 'text-slate-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${song.liked ? 'fill-current' : ''}`} />
                    </button>

                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.08] group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black text-slate-700 dark:text-white flex items-center justify-center transition">
                      {isCurrent && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-current h-full animate-bounce" />
                          <span className="w-0.5 bg-current h-2 animate-pulse" />
                        </div>
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
