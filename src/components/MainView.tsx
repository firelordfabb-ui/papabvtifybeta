import React, { useState } from 'react';
import { Song, SoundStyle, ActiveNav } from '../types/music';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Radio,
  Sliders,
  Quote,
  Flame,
  Compass,
  LayoutGrid,
  Mic2,
  Disc,
  Music,
  User,
  Sparkles,
  TrendingUp,
  Headphones,
  Check
} from 'lucide-react';

interface Props {
  activeNav: ActiveNav;
  setActiveNav: (nav: ActiveNav) => void;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectSong: (song: Song) => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onToggleLike: (song: Song) => void;
  onOpenCoverflow: () => void;
  onOpenEQ: () => void;
  onOpenFullscreenLyrics: () => void;
  soundStyle: SoundStyle;
  onSoundStyleChange: (style: SoundStyle) => void;
  onTagClick: (tag: string) => void;
}

export const MainView: React.FC<Props> = ({
  activeNav,
  setActiveNav,
  songs,
  currentSong,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onSelectSong,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  onToggleLike,
  onOpenCoverflow,
  onOpenEQ,
  onOpenFullscreenLyrics,
  soundStyle,
  onSoundStyleChange,
  onTagClick
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [songFilter, setSongFilter] = useState<'all' | 'liked'>('all');

  const tags = [
    { label: 'Acoustic', color: 'bg-pink-500' },
    { label: 'Piano jazz', color: 'bg-amber-400' },
    { label: 'Jazz', color: 'bg-violet-400' },
    { label: 'Indie pop', color: 'bg-cyan-400' },
  ];

  const recentlyPlayed = [
    {
      title: 'Blank Space',
      artist: 'Taylor Swift',
      time: '4 min ago',
      img: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=150'
    },
    {
      title: 'Side Effects',
      artist: 'The Chainsmokers',
      time: '20 min ago',
      img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150'
    },
    {
      title: 'No One Like You',
      artist: 'Scorpions',
      time: '2 hr ago',
      img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'
    },
    {
      title: 'Always Love You',
      artist: 'Elton John',
      time: '3 hr ago',
      img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150'
    }
  ];

  const genres = [
    { name: 'Pop Hits', color: 'from-pink-600 to-rose-400', count: '1.2M songs' },
    { name: 'Lo-Fi Chill', color: 'from-indigo-600 to-violet-400', count: '840K songs' },
    { name: 'Hip-Hop & R&B', color: 'from-amber-600 to-yellow-500', count: '950K songs' },
    { name: 'Indie & Alt', color: 'from-teal-600 to-cyan-400', count: '620K songs' },
    { name: 'Rock & Metal', color: 'from-red-600 to-orange-500', count: '780K songs' },
    { name: 'Electronic / EDM', color: 'from-blue-600 to-sky-400', count: '510K songs' },
  ];

  const featuredArtists = [
    { name: 'The Weeknd', listeners: '108.4M listeners', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300' },
    { name: 'Taylor Swift', listeners: '105.1M listeners', img: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300' },
    { name: 'Billie Eilish', listeners: '89.6M listeners', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' },
    { name: 'Post Malone', listeners: '76.2M listeners', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
  ];

  const podcasts = [
    { title: 'The Daily Deep Dive', host: 'Studio Voice', category: 'Tech & Culture', duration: '42 min' },
    { title: 'Chill Conversations', host: 'Acoustic Soul', category: 'Mindfulness', duration: '35 min' },
    { title: 'Late Night Code', host: 'Dev Syndicate', category: 'Programming', duration: '58 min' },
  ];

  const radioStations = [
    { title: 'papabvtify Lo-Fi 24/7', desc: 'Chill beats to relax/study to', live: true },
    { title: 'Global Top 40 FM', desc: 'Live charts from Tokyo to London', live: true },
    { title: 'Cyberpunk Synthwave', desc: 'Futuristic retrowave soundscapes', live: true },
  ];

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayedSongs = songFilter === 'liked' ? songs.filter(s => s.liked) : songs;

  return (
    <div className="flex-1 h-full overflow-hidden flex select-none">
      {/* Center Main Stage */}
      <div className="flex-1 h-full flex flex-col justify-between p-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scroll-smooth">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveNav('home')}
                className="w-7 h-7 rounded-full glass-pill flex items-center justify-center text-white/60 hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveNav('discover')}
                className="w-7 h-7 rounded-full glass-pill flex items-center justify-center text-white/60 hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-white/40">Mode:</span>
              <span className="text-purple-300 font-bold uppercase tracking-wider">{activeNav}</span>
            </div>
          </div>

          {/* ==============================================================
              TAB CONTENT SWITCHER
              ============================================================== */}

          {/* 1. HOME TAB (Image 1 match) */}
          {activeNav === 'home' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold text-purple-300/80 tracking-wide">
                    What's hot
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Trending
                  </h2>
                </div>
                <button
                  onClick={() => setActiveNav('discover')}
                  className="text-xs font-semibold text-white/50 hover:text-white transition"
                >
                  More &gt;
                </button>
              </div>

              {/* Hero Banner Card (Image 1 Exact) */}
              <div className="relative rounded-3xl p-7 glass-card overflow-hidden flex items-center justify-between shadow-2xl border">
                <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none opacity-85">
                  <img
                    src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=700&auto=format&fit=crop&q=80"
                    alt="Artist Graphic"
                    className="w-full h-full object-cover object-center mix-blend-screen transform scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--app-card)] via-transparent to-transparent" />
                </div>

                <div className="space-y-4 max-w-sm z-10">
                  <div className="flex items-center gap-3 text-[11px] text-white/70 font-medium">
                    <span className="text-white/40">Artist</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>👤</span>
                      <span>Montly listener : 98.029</span>
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-white tracking-tight leading-snug">
                    Top all over the world
                  </h3>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => songs[0] && onSelectSong(songs[0])}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#ef4444] text-white text-xs font-extrabold hover:bg-red-600 transition shadow-lg shadow-red-500/30 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </button>
                    <button
                      onClick={() => onOpenCoverflow()}
                      className="px-6 py-2.5 rounded-full glass-pill text-white text-xs font-bold hover:bg-white/15 transition border active:scale-95"
                    >
                      3D Flow
                    </button>
                  </div>
                </div>
              </div>

              {/* Playlist Section (Image 1 Exact Table) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-white tracking-tight">
                    Playlist
                  </h4>
                  <button
                    onClick={() => setActiveNav('song')}
                    className="text-xs text-white/40 hover:text-white transition font-medium"
                  >
                    Show all ({songs.length})
                  </button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 pb-2 border-b border-white/5">
                  <span className="col-span-1">#</span>
                  <span className="col-span-4">TITLE</span>
                  <span className="col-span-3">ARTIST</span>
                  <span className="col-span-2">TIME</span>
                  <span className="col-span-2 text-right">ALBUM</span>
                </div>

                {/* Table Rows */}
                <div className="space-y-1">
                  {songs.map((song, idx) => {
                    const isCurrent = currentSong?.id === song.id;
                    const rowNum = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;

                    return (
                      <div
                        key={song.id}
                        onClick={() => onSelectSong(song)}
                        className={`grid grid-cols-12 items-center px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 ${
                          isCurrent
                            ? 'bg-purple-900/40 border border-purple-500/50 text-white shadow-lg shadow-purple-900/30 scale-[1.01]'
                            : 'hover:bg-white/5 text-white/70 hover:text-white'
                        }`}
                      >
                        {/* Number / Animated Soundwave icon if currently playing */}
                        <div className="col-span-1 flex items-center gap-2 font-mono text-xs">
                          {isCurrent && isPlaying ? (
                            <div className="flex items-end gap-0.5 h-3.5">
                              <span className="w-0.5 bg-cyan-400 h-full animate-bounce" />
                              <span className="w-0.5 bg-purple-400 h-2 animate-pulse" />
                              <span className="w-0.5 bg-cyan-400 h-3 animate-bounce" />
                            </div>
                          ) : (
                            <span className="text-white/40">{rowNum}</span>
                          )}
                        </div>

                        {/* Title */}
                        <div className="col-span-4 flex items-center gap-3 truncate pr-2">
                          <span
                            className={`text-xs font-bold truncate ${
                              isCurrent ? 'text-white' : 'text-white/90'
                            }`}
                          >
                            {song.title}
                          </span>
                        </div>

                        {/* Artist */}
                        <div className="col-span-3 text-xs text-white/50 truncate pr-2">
                          {song.artist}
                        </div>

                        {/* Time */}
                        <div className="col-span-2 font-mono text-xs text-white/40">
                          {formatTime(song.duration)}
                        </div>

                        {/* Album */}
                        <div className="col-span-2 text-xs text-white/40 text-right truncate">
                          {song.album || 'papabvtify'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. DISCOVER TAB */}
          {activeNav === 'discover' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-semibold text-cyan-400 tracking-wide uppercase">
                  Eksplorasi Musik Baru
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Tangga Lagu Teratas & Tren Global
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Global Top 50', desc: 'Lagu paling banyak diputar di seluruh dunia', tag: '#1 Global' },
                  { title: 'Indonesia Viral 50', desc: 'Lagu viral di Jakarta & trending media sosial', tag: 'Trending' },
                  { title: 'Late Night Chill', desc: 'Alunan relaksasi malam hari bebas stres', tag: 'Mood' },
                ].map((card, i) => (
                  <div
                    key={i}
                    onClick={() => songs[i % songs.length] && onSelectSong(songs[i % songs.length])}
                    className="p-5 rounded-3xl glass-card border border-white/10 hover:border-cyan-400/50 cursor-pointer space-y-3 transition duration-300 hover:scale-[1.02]"
                  >
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      {card.tag}
                    </span>
                    <h3 className="text-base font-bold text-white">{card.title}</h3>
                    <p className="text-xs text-white/50">{card.desc}</p>
                    <button className="flex items-center gap-2 text-xs font-bold text-cyan-400 pt-2">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Putar Sekarang</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="text-lg font-black text-white">Rekomendasi Minggu Ini</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {songs.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onSelectSong(s)}
                      className="p-3 rounded-2xl glass-card cursor-pointer group hover:border-purple-400/50 transition"
                    >
                      <img src={s.thumbnail} alt={s.title} className="w-full h-32 rounded-xl object-cover mb-2" />
                      <h4 className="text-xs font-bold text-white truncate">{s.title}</h4>
                      <p className="text-[10px] text-white/50 truncate">{s.artist}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. BROWSE TAB (Genres) */}
          {activeNav === 'browse' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">
                  Koleksi & Kategori
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Jelajahi Berdasarkan Genre
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {genres.map((g, i) => (
                  <div
                    key={i}
                    onClick={() => onTagClick(g.name.split(' ')[0])}
                    className={`h-28 rounded-3xl p-5 bg-gradient-to-br ${g.color} shadow-xl flex flex-col justify-between cursor-pointer hover:scale-105 transition transform`}
                  >
                    <span className="text-base font-black text-white">{g.name}</span>
                    <span className="text-[11px] font-mono text-white/80">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PODCASTS TAB */}
          {activeNav === 'podcasts' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-semibold text-red-400 tracking-wide uppercase">
                  Audio Shows & Talks
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Podcast Pilihan Terbaik
                </h2>
              </div>

              <div className="space-y-3">
                {podcasts.map((pod, i) => (
                  <div
                    key={i}
                    onClick={() => songs[0] && onSelectSong(songs[0])}
                    className="flex items-center justify-between p-4 rounded-2xl glass-card cursor-pointer hover:border-purple-400/40 transition group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold">
                        <Mic2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                          {pod.title}
                        </h4>
                        <p className="text-xs text-white/50">
                          {pod.host} • {pod.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-white/40">{pod.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. RADIO TAB */}
          {activeNav === 'radio' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-semibold text-green-400 tracking-wide uppercase">
                  Siaran Langsung 24/7
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Stasiun Radio papabvtify
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {radioStations.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => songs[i % songs.length] && onSelectSong(songs[i % songs.length])}
                    className="p-5 rounded-3xl glass-card space-y-3 cursor-pointer hover:border-green-400/50 transition hover:scale-105"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-green-300 uppercase">Live Broadcast</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{r.title}</h3>
                    <p className="text-xs text-white/50">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ALBUMS TAB */}
          {activeNav === 'albums' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">
                  Perpustakaan Album
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Album Pilihan
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {songs.map((song, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectSong(song)}
                    className="p-3.5 rounded-3xl glass-card cursor-pointer group hover:border-purple-400/50 transition hover:scale-105"
                  >
                    <img src={song.thumbnail} alt={song.title} className="w-full h-36 rounded-2xl object-cover mb-2.5" />
                    <h4 className="text-xs font-bold text-white truncate">{song.album || song.title}</h4>
                    <p className="text-[10px] text-white/50 truncate">{song.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. SONG TAB (Full List with Filter) */}
          {activeNav === 'song' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">
                    Daftar Semua Lagu
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Koleksi Lagu ({displayedSongs.length})
                  </h2>
                </div>

                <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <button
                    onClick={() => setSongFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      songFilter === 'all' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setSongFilter('liked')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      songFilter === 'liked' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Disukai (❤️)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {displayedSongs.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectSong(s)}
                    className="flex items-center justify-between p-3 rounded-2xl glass-card hover:bg-white/10 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-white/40 w-5">{idx + 1}</span>
                      <img src={s.thumbnail} alt={s.title} className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{s.title}</h4>
                        <p className="text-[10px] text-white/50">{s.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-white/40">{formatTime(s.duration)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike(s);
                        }}
                        className={`p-1.5 rounded-lg transition ${
                          s.liked ? 'text-pink-500' : 'text-white/30 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${s.liked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. ARTISTS TAB */}
          {activeNav === 'artists' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">
                  Profil Musisi Dunia
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Artis Populer
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredArtists.map((art, i) => (
                  <div
                    key={i}
                    onClick={() => onTagClick(art.name)}
                    className="p-5 rounded-3xl glass-card flex flex-col items-center text-center cursor-pointer hover:border-purple-400/50 transition hover:scale-105"
                  >
                    <img src={art.img} alt={art.name} className="w-24 h-24 rounded-full object-cover mb-3 shadow-lg" />
                    <h4 className="text-sm font-bold text-white">{art.name}</h4>
                    <p className="text-[10px] text-white/50 font-mono mt-0.5">{art.listeners}</p>
                    <button className="mt-3 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition">
                      Ikuti
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Glass Dock Player (Matching Image 1) */}
        <div className="mt-4 pt-2">
          <div className="glass-dock rounded-3xl p-4 border space-y-2.5 shadow-2xl">
            {/* Controls Bar */}
            <div className="flex items-center justify-between">
              {/* Left: Like, Shuffle, 3D Coverflow expand button */}
              <div className="flex items-center gap-3 w-1/4">
                <button
                  onClick={() => currentSong && onToggleLike(currentSong)}
                  className={`p-1.5 rounded-lg transition ${
                    currentSong?.liked
                      ? 'text-pink-500 fill-pink-500'
                      : 'text-white/40 hover:text-white'
                  }`}
                  title="Sukai Lagu"
                >
                  <Heart className={`w-4 h-4 ${currentSong?.liked ? 'fill-current' : ''}`} />
                </button>
                <button className="text-white/40 hover:text-white transition" title="Acak">
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenCoverflow}
                  className="p-1.5 rounded-lg text-white/40 hover:text-purple-300 transition"
                  title="Buka Mode 3D Coverflow (Foto 2)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Center: Previous, Play/Pause, Next */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onPrev}
                  className="text-white/70 hover:text-white transition active:scale-95"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={onPlayPause}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shadow-white/30"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current text-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-current text-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={onNext}
                  className="text-white/70 hover:text-white transition active:scale-95"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Right: Realtime Synced Lyrics, Equalizer, Repeat & Volume */}
              <div className="flex items-center justify-end gap-3 w-1/4">
                <button
                  onClick={onOpenFullscreenLyrics}
                  title="Buka Mode Lirik Realtime Split"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:border-purple-400 text-xs font-bold transition"
                >
                  <Quote className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lirik</span>
                </button>

                <button
                  onClick={onOpenEQ}
                  title="Equalizer 10 Pita"
                  className="p-1.5 text-white/40 hover:text-white transition"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                <button className="text-white/40 hover:text-white transition" title="Ulangi">
                  <Repeat className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 pl-1">
                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      onVolumeChange(isMuted ? 0.85 : 0);
                    }}
                    className="text-white/50 hover:text-white"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded-lg cursor-pointer accent-white"
                  />
                </div>
              </div>
            </div>

            {/* Seek Bar Timeline (Duration skip 100% works!) */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] font-mono text-white/40 w-7 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-white/15 rounded-lg cursor-pointer accent-white"
              />
              <span className="text-[10px] font-mono text-white/40 w-7">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column / Panel (Tags, Played, Now Playing Card - Image 1 Exact Match) */}
      <div className="w-72 h-full glass-sidebar border-l p-5 flex flex-col justify-between overflow-y-auto space-y-6 shadow-[-5px_0_30px_rgba(0,0,0,0.3)]">
        {/* Tags Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-white font-bold text-sm">
            <span>Tags</span>
            <button className="text-white/40 hover:text-white">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {tags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => onTagClick(tag.label)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl glass-pill text-xs font-semibold text-white/80 hover:text-white transition"
              >
                <div className={`w-2 h-2 rounded-full ${tag.color}`} />
                <span className="truncate">{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Played Section (Recently Played list with relative times) */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between text-white font-bold text-sm">
            <span>Played</span>
            <button
              onClick={() => setActiveNav('song')}
              className="text-[11px] text-white/40 hover:text-white"
            >
              See all
            </button>
          </div>

          <div className="space-y-2.5">
            {recentlyPlayed.map((item, i) => (
              <div
                key={i}
                onClick={() => onTagClick(item.title)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-9 h-9 rounded-xl object-cover shrink-0"
                  />
                  <div className="truncate">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition">
                      {item.title}
                    </h5>
                    <p className="text-[10px] text-white/40 truncate">
                      {item.artist}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-white/30 shrink-0">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Now Playing Card (Taylor Swift "Lover" Card style from Image 1) */}
        <div
          onClick={onOpenFullscreenLyrics}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent cursor-pointer group hover:border-purple-400/50 transition duration-300"
          title="Klik untuk membuka layar lirik sinkron"
        >
          <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-3">
            <img
              src={currentSong?.thumbnail || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500'}
              alt="Now Playing"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="truncate">
              <h4 className="text-xs font-extrabold text-white truncate">
                {currentSong?.title || 'I Knew You Were'}
              </h4>
              <p className="text-[10px] text-white/50 truncate">
                {currentSong?.artist || 'Taylor Swift'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentSong) onToggleLike(currentSong);
              }}
              className="w-7 h-7 rounded-full glass-pill flex items-center justify-center text-white/70 hover:text-white transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
