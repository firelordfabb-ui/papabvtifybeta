import React, { useState, useEffect } from 'react';
import { Song, Playlist, PlaybackMode, PlaybackContext } from '../types/music';
import { StorageService } from '../services/storage';
import { ArtistService } from '../services/artistService';
import { PlaylistImportModal } from './PlaylistImportModal';
import {
  Heart,
  ListMusic,
  Plus,
  Play,
  Pause,
  Trash2,
  FolderPlus,
  Clock,
  Sparkles,
  Music,
  LayoutGrid,
  List,
  ChevronDown,
  Search,
  UserCheck,
  Download,
  ArrowLeft,
  Shuffle,
  Compass
} from 'lucide-react';

interface Props {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song) => void;
  onToggleLike: (song: Song) => void;
  onOpenPlayerModal?: () => void;
  onOpenArtist?: (artistId: string) => void;
  onPlayPlaylist?: (playlist: Playlist, startIndex?: number, mode?: PlaybackMode) => void;
  playbackMode?: PlaybackMode;
  onPlaybackModeChange?: (mode: PlaybackMode) => void;
  activePlaybackContext?: PlaybackContext | null;
}

export const PustakaView: React.FC<Props> = ({
  songs,
  currentSong,
  isPlaying,
  onSelectSong,
  onToggleLike,
  onOpenPlayerModal,
  onOpenArtist,
  onPlayPlaylist,
  playbackMode = 'follow_playlist',
  onPlaybackModeChange,
  activePlaybackContext
}) => {
  const [filterPill, setFilterPill] = useState<'Semua' | 'Playlist' | 'Lagu' | 'Album' | 'Artis'>('Playlist');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setPlaylists(StorageService.getPlaylists());
  }, []);

  // Filter favorite songs from catalog
  const favoriteSongs = songs.filter(s => s.liked || StorageService.isFavorite(s.id));
  const recentTracks = StorageService.getRecentlyPlayed();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = StorageService.createPlaylist(newTitle.trim(), newDesc.trim());
    setPlaylists(StorageService.getPlaylists());
    setNewTitle('');
    setNewDesc('');
    setIsCreateOpen(false);
    setSelectedPlaylist(created);
  };

  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.deletePlaylist(id);
    setPlaylists(StorageService.getPlaylists());
    if (selectedPlaylist?.id === id) {
      setSelectedPlaylist(null);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getSelectedPlaylistSongs = (): Song[] => {
    if (!selectedPlaylist) return [];
    if (selectedPlaylist.songs && selectedPlaylist.songs.length > 0) {
      return selectedPlaylist.songs;
    }
    const resolved: Song[] = [];
    for (const id of selectedPlaylist.songIds || []) {
      const match = songs.find(s => s.id === id);
      if (match) {
        resolved.push(match);
      } else {
        resolved.push({
          id,
          title: 'Lagu Koleksi',
          artist: 'Artis',
          duration: 210,
          thumbnail: selectedPlaylist.covers?.[0] || 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg'
        });
      }
    }
    return resolved;
  };

  const handlePlayAll = () => {
    const list = getSelectedPlaylistSongs();
    if (list.length === 0) return;
    if (onPlayPlaylist && selectedPlaylist) {
      onPlayPlaylist({ ...selectedPlaylist, songs: list, tracks: list }, 0, playbackMode || 'follow_playlist');
    } else {
      onSelectSong(list[0]);
    }
  };

  const handleSongClick = (song: Song, idx: number = 0) => {
    if (onPlayPlaylist && selectedPlaylist) {
      const list = getSelectedPlaylistSongs();
      onPlayPlaylist({ ...selectedPlaylist, songs: list, tracks: list }, idx, playbackMode || 'follow_playlist');
    } else {
      onSelectSong(song);
    }
  };

  // If a playlist is selected, display its full detail view with playable tracks
  if (selectedPlaylist) {
    const playlistSongs = getSelectedPlaylistSongs();
    const totalDurationSeconds = playlistSongs.reduce((acc, s) => acc + (s.duration || 180), 0);
    const isImported = selectedPlaylist.description?.includes('Diimpor') || false;

    return (
      <div className="flex-1 h-full overflow-y-auto px-4 sm:px-10 py-6 space-y-6 max-w-5xl mx-auto animate-fadeIn select-none pb-44">
        {/* Back navigation button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedPlaylist(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-xs font-bold text-[#142247] dark:text-[#9ab3f5] hover:opacity-90 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Koleksi Pustaka</span>
          </button>

          {isImported && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Playlist Terverifikasi & Siap Putar
            </span>
          )}
        </div>

        {/* Playlist Hero Section */}
        <div className="p-6 sm:p-8 rounded-3xl liquid-glass border border-white/40 dark:border-white/10 shadow-lg flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Artwork Cover */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border-2 border-white/40 dark:border-white/15 shadow-xl">
            {selectedPlaylist.covers && selectedPlaylist.covers.length >= 4 ? (
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                {selectedPlaylist.covers.slice(0, 4).map((c, i) => (
                  <img key={i} src={c} alt="" className="w-full h-full object-cover" />
                ))}
              </div>
            ) : selectedPlaylist.covers && selectedPlaylist.covers.length > 0 ? (
              <img
                src={selectedPlaylist.covers[0]}
                alt={selectedPlaylist.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#151b2e]">
                <ListMusic className="w-16 h-16 text-[#9ab3f5]" />
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 flex flex-col justify-between text-center sm:text-left space-y-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                {isImported ? 'Playlist Impor Eksternal' : 'Playlist Pustaka'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedPlaylist.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                {selectedPlaylist.description || 'Daftar putar lagu pilihan Anda di PAPABVTIFY.'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
                <span>{playlistSongs.length} Lagu</span>
                <span>•</span>
                <span>Sekitar {Math.ceil(totalDurationSeconds / 60)} Menit</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={handlePlayAll}
                  disabled={playlistSongs.length === 0}
                  className="px-6 py-3 rounded-2xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] font-extrabold text-xs hover:opacity-90 transition active:scale-95 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Putar Semua Lagu</span>
                </button>

                <button
                  onClick={(e) => handleDeletePlaylist(selectedPlaylist.id, e)}
                  className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition active:scale-95 cursor-pointer"
                  title="Hapus Playlist Ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Playback Mode Selector Pills */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-bold shrink-0 self-center sm:self-auto">
                <button
                  type="button"
                  onClick={() => onPlaybackModeChange && onPlaybackModeChange('follow_playlist')}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    playbackMode === 'follow_playlist'
                      ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Mode Follow Playlist: Putar urutan asli playlist secara berurutan tanpa lagu luar"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>Follow Playlist</span>
                  {playbackMode === 'follow_playlist' && (
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono">
                      AKTIF
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onPlaybackModeChange && onPlaybackModeChange('normal_shuffle')}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    playbackMode === 'normal_shuffle'
                      ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Mode Normal Shuffle: Mengacak urutan playlist tanpa pengulangan (Fisher-Yates)"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Normal Shuffle</span>
                  {playbackMode === 'normal_shuffle' && (
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono">
                      AKTIF
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onPlaybackModeChange && onPlaybackModeChange('smart_shuffle')}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    playbackMode === 'smart_shuffle'
                      ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Mode Smart Shuffle: Memilih lagu berdasarkan kesesuaian selera, mood, dan genre"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Smart Shuffle</span>
                  {playbackMode === 'smart_shuffle' && (
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono">
                      AKTIF
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 pb-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-black/5 dark:border-white/10">
            <span>Daftar Lagu ({playlistSongs.length})</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Durasi</span>
            </span>
          </div>

          {playlistSongs.length === 0 ? (
            <div className="py-16 text-center space-y-3 liquid-glass rounded-3xl">
              <Music className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Belum Ada Lagu di Playlist Ini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Cari lagu favorit Anda dan tambahkan ke playlist ini untuk diputar kapan saja.
              </p>
            </div>
          ) : (
            playlistSongs.map((song, idx) => {
              const isThisPlaying = currentSong?.id === song.id && isPlaying;
              const isThisCurrent = currentSong?.id === song.id;

              return (
                <div
                  key={`${song.id}_${idx}`}
                  onClick={() => handleSongClick(song, idx)}
                  className={`p-3 rounded-2xl liquid-glass flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] transition shadow-xs ${
                    isThisCurrent ? 'ring-2 ring-indigo-500/50 bg-indigo-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                      {isThisPlaying ? (
                        <div className="flex items-end justify-center gap-0.5 h-3.5">
                          <span className="w-0.5 h-full bg-indigo-500 animate-pulse" />
                          <span className="w-0.5 h-2/3 bg-indigo-500 animate-pulse delay-75" />
                          <span className="w-0.5 h-4/5 bg-indigo-500 animate-pulse delay-150" />
                        </div>
                      ) : (
                        idx + 1
                      )}
                    </span>

                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 border border-black/5 dark:border-white/10 relative group/thumb">
                      <img
                        src={song.thumbnail || 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg'}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${
                        isThisCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(song);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition"
                      title="Sukai Lagu"
                    >
                      <Heart className={`w-4 h-4 ${song.liked || StorageService.isFavorite(song.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-10 text-right">
                      {formatTime(song.duration || 180)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 sm:px-10 py-6 space-y-6 max-w-5xl mx-auto animate-fadeIn select-none pb-44">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase font-bold">
            Koleksi Pribadi
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Pustaka
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-[#142247] dark:text-[#9ab3f5] font-bold text-xs hover:opacity-85 transition shadow-xs active:scale-95 cursor-pointer"
            title="Import playlist dari Spotify atau YouTube"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Import Playlist</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#142247] text-white dark:bg-white dark:text-black font-extrabold text-xs hover:opacity-90 transition shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Playlist</span>
          </button>
        </div>
      </div>

      {/* Filter Category Pills (Matching Reference Image: Semua, Playlist, Lagu, Album, Artis) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['Semua', 'Playlist', 'Lagu', 'Album', 'Artis'] as const).map((pill) => {
          const isActive = filterPill === pill;
          return (
            <button
              key={pill}
              onClick={() => setFilterPill(pill)}
              className={`px-4 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-extrabold shadow-md'
                  : 'liquid-glass-pill text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              {pill}
            </button>
          );
        })}
      </div>

      {/* Sub-bar: Sort by Date, Count, and Grid/List toggle (Matching Reference Image) */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/[0.08] pb-3">
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-black dark:hover:text-white transition">
          <span className="font-semibold">Tanggal ditambahkan</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-400">
            {filterPill === 'Lagu' ? `${favoriteSongs.length} lagu` : `${playlists.length} playlist`}
          </span>

          <div className="flex items-center p-1 rounded-xl liquid-glass-pill">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-lg ${viewMode === 'grid' ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-lg ${viewMode === 'list' ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'text-slate-500'}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ==============================================================
          MAIN CONTENT AREA (ARTISTS, SONGS, OR PLAYLISTS)
          ============================================================== */}
      {filterPill === 'Artis' ? (
        // Followed Artists List
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ArtistService.getAllArtists().filter(a => a.isFollowed).length === 0 ? (
            <div className="col-span-full py-16 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Artis yang Diikuti</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Buka Musisi Pilihan di Beranda lalu tekan "Ikuti Artis" untuk memantau karya mereka di sini.
              </p>
            </div>
          ) : (
            ArtistService.getAllArtists()
              .filter(a => a.isFollowed)
              .map(art => (
                <div
                  key={art.id}
                  onClick={() => onOpenArtist && onOpenArtist(art.id)}
                  className="p-4 rounded-3xl liquid-glass text-center cursor-pointer group active:scale-95 transition-all space-y-3 shadow-sm hover:shadow-md"
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border border-black/5 dark:border-white/20 shadow-md group-hover:scale-105 transition-transform duration-300">
                    <img src={art.avatar} alt={art.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-500">
                      {art.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {art.genre}
                    </p>
                    <span className="inline-block mt-2 text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                      Diikuti
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      ) : filterPill === 'Lagu' ? (
        // Liked Songs List
        <div className="space-y-2">
          {favoriteSongs.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Heart className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Lagu Disukai</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Tekan tombol ikon hati pada lagu manapun untuk menyimpannya ke koleksi pribadi ini.
              </p>
            </div>
          ) : (
            favoriteSongs.map((song, idx) => (
              <div
                key={song.id}
                onClick={() => handleSongClick(song)}
                className="p-3 rounded-2xl liquid-glass flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] transition shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="font-mono text-xs font-bold text-slate-400 w-4 text-center">
                    {idx + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 border border-black/5 dark:border-white/10">
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(song);
                  }}
                  className="p-2 text-red-500 fill-red-500 transition active:scale-75"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        // Playlists Grid (2 columns on mobile, matching Reference Image)
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4' : 'grid-cols-1 gap-2.5'}`}>
          {/* Default Liked Songs Playlist Card */}
          <div
            onClick={() => setFilterPill('Lagu')}
            className="p-3 rounded-3xl liquid-glass cursor-pointer group active:scale-[0.98] transition space-y-2.5 shadow-sm hover:shadow-md"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/20 flex items-center justify-center shadow-md group-hover:scale-[1.02] transition-transform">
              <Heart className="w-12 h-12 text-pink-500 fill-pink-500/40" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Lagu Disukai
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {favoriteSongs.length} lagu
              </p>
            </div>
          </div>

          {/* User Playlists */}
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylist(pl)}
              className="p-3 rounded-3xl liquid-glass cursor-pointer group active:scale-[0.98] transition space-y-2.5 relative shadow-sm hover:shadow-md"
            >
              {/* Mosaic 4-cover or single cover */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-black/5 dark:border-white/12 shadow-sm group-hover:scale-[1.02] transition-transform">
                {pl.covers && pl.covers.length >= 4 ? (
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                    {pl.covers.slice(0, 4).map((c, i) => (
                      <img key={i} src={c} alt="" className="w-full h-full object-cover" />
                    ))}
                  </div>
                ) : pl.covers && pl.covers.length > 0 ? (
                  <img src={pl.covers[0]} alt={pl.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                    <ListMusic className="w-10 h-10 text-slate-400" />
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {pl.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {pl.songCount} lagu
                  </p>
                </div>

                {pl.id !== 'pl_favorites' && (
                  <button
                    onClick={(e) => handleDeletePlaylist(pl.id, e)}
                    className="p-1 text-slate-400 hover:text-red-500 transition"
                    title="Hapus Playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl liquid-glass-modal p-6 space-y-5 border border-white/20 shadow-2xl">
            <h3 className="text-lg font-black text-white">Buat Playlist Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Judul Playlist
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Lagu Pengantar Tidur, Vibes Sore..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Tulis deskripsi singkat..."
                  className="w-full px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30 h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-slate-200 transition disabled:opacity-50"
                >
                  Simpan Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Playlist Importer Modal (Spotify & YouTube) */}
      <PlaylistImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          setPlaylists(StorageService.getPlaylists());
        }}
      />
    </div>
  );
};
