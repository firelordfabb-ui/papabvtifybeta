import React, { useMemo, useState } from 'react';
import { Song, Artist } from '../types/music';
import { StorageService } from '../services/storage';
import { ArtistService } from '../services/artistService';
import { RecommendationEngine } from '../services/recommendationEngine';
import { FantasyLandscape } from './FantasyLandscape';
import {
  Play,
  Flame,
  Sparkles,
  Heart,
  Headphones,
  Music,
  Users,
  Moon,
  Smile,
  Zap,
  GraduationCap,
  ChevronRight,
  Disc3
} from 'lucide-react';

interface Props {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song) => void;
  onToggleLike: (song: Song) => void;
  onFilterGenre: (genre: string) => void;
  onOpenPlayerModal?: () => void;
  onOpenArtist?: (artistId: string) => void;
  onOpenListeningRoom?: () => void;
}

export const BerandaView: React.FC<Props> = ({
  songs,
  currentSong,
  isPlaying,
  onSelectSong,
  onToggleLike,
  onFilterGenre,
  onOpenPlayerModal,
  onOpenArtist,
  onOpenListeningRoom
}) => {
  const [activeMood, setActiveMood] = useState('Semua');
  const [artistCategory, setArtistCategory] = useState<'all' | 'indo' | 'intl'>('all');
  const [recomTab, setRecomTab] = useState<'mix' | 'discover' | 'similar'>('mix');

  const recommendedTracks = useMemo(() => {
    if (recomTab === 'discover') return RecommendationEngine.getDiscoverWeekly();
    if (recomTab === 'similar') return RecommendationEngine.getSimilarToYourTaste(currentSong);
    return RecommendationEngine.getPersonalizedMix();
  }, [recomTab, currentSong?.id, isPlaying]);

  // Dynamic user streak and weekly listening stats
  const streakDays = useMemo(() => StorageService.calculateListeningStreak(), [isPlaying]);
  const weeklyHours = useMemo(() => StorageService.getWeeklyListeningHours(), [isPlaying]);

  const handleSongClick = (song: Song) => {
    if (currentSong?.id === song.id && onOpenPlayerModal) {
      onOpenPlayerModal();
    } else {
      onSelectSong(song);
    }
  };

  const displayedArtists = useMemo(() => {
    if (artistCategory === 'indo') return ArtistService.getIndonesianArtists();
    if (artistCategory === 'intl') return ArtistService.getInternationalArtists();
    return ArtistService.getAllArtists();
  }, [artistCategory]);

  // Dynamic Greeting based on real local time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  }, []);

  // Quick Access 6 songs for the 2x3 grid (Matching Reference Image)
  const quickAccessSongs = useMemo(() => {
    const stored = StorageService.getRecentlyPlayed();
    const combined = [...stored, ...songs];
    const unique: Song[] = [];
    const seen = new Set<string>();
    for (const s of combined) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        unique.push(s);
      }
      if (unique.length === 6) break;
    }
    return unique;
  }, [songs]);

  // Real Recently Played from Storage
  const recentTracks = useMemo(() => {
    const stored = StorageService.getRecentlyPlayed();
    return stored.length > 0 ? stored.slice(0, 8) : songs.slice(0, 6);
  }, [songs]);

  const moodPills = [
    { label: 'Bersantai', icon: null },
    { label: 'Tidur', icon: Moon },
    { label: 'Senang', icon: Smile },
    { label: 'Sedih', icon: Heart },
    { label: 'Mengisi energi', icon: Zap },
    { label: 'Fokus & Belajar', icon: GraduationCap },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 sm:px-10 py-3 space-y-3.5 max-w-7xl mx-auto animate-fadeIn select-none pb-28 relative">
      {/* ==============================================================
          HERO SECTION WITH FANTASY CITADEL BACKDROP
          ============================================================== */}
      <div className="relative rounded-2xl overflow-hidden pt-1 pb-1">
        {/* Floating Fantasy Landscape in Top-Right Background */}
        <div className="absolute top-0 right-2 w-80 sm:w-[420px] h-36 pointer-events-none opacity-90 z-0 overflow-hidden [mask-image:linear-gradient(to_left,black_60%,transparent_100%)]">
          <FantasyLandscape className="w-full h-full" />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 space-y-2">
          {/* Top Status & Sparks */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#5d729c]">
              <div className="w-4 h-1.5 rounded-full bg-[#9ab3f5]/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#9ab3f5]/80" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#9ab3f5]" />
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/85 dark:bg-[#151b2e]/85 border border-[#dce7f7] dark:border-[#222c45] shadow-sm text-xs font-semibold text-[#142247] dark:text-[#f0f4fc]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Streaming Aktif · Bebas Iklan ✦</span>
            </div>
          </div>

          {/* Large Headline with Celestial Star Emblem */}
          <div className="flex items-start gap-3.5 pt-0.5">
            <div className="relative w-7 h-7 shrink-0 mt-0.5">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <path
                  d="M50 4 C50 35 35 50 4 50 C35 50 50 65 50 96 C50 65 65 50 96 50 C65 50 50 35 50 4 Z"
                  fill="#142247"
                  className="dark:fill-[#9ab3f5]"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white tracking-tight leading-none">
                {greeting}
              </h1>
              <p className="text-xs font-semibold text-[#5d729c] dark:text-[#8fa1c4] mt-1">
                Nikmati musik favoritmu, kapan saja ♪
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          QUICK ACCESS 2x3 CAPSULE TILES (Matching Reference Image)
          ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 relative z-10">
        {quickAccessSongs.map((song) => {
          const isCurrent = currentSong?.id === song.id;
          return (
            <div
              key={song.id}
              onClick={() => handleSongClick(song)}
              className={`p-2 rounded-full fantasy-song-capsule flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] transition-all overflow-hidden ${
                isCurrent ? 'ring-2 ring-[#142247]/30 dark:ring-[#9ab3f5]/50 shadow-md' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
                {/* Album Thumbnail */}
                <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-[#dce7f7] dark:border-[#222c45] shadow-sm">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isCurrent && isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 bg-white h-full animate-bounce" />
                        <span className="w-0.5 bg-white h-2 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Song Meta */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[#142247] dark:text-[#f0f4fc] truncate leading-tight">
                    {song.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] font-medium text-[#5d729c] dark:text-[#8fa1c4] truncate mt-0.5">
                    {song.artist}
                  </p>
                </div>
              </div>

              {/* Circular Play Button matching Reference */}
              <div className="w-8 h-8 rounded-full bg-[#edf3fd] dark:bg-[#1f2842] text-[#142247] dark:text-[#9ab3f5] group-hover:bg-[#142247] group-hover:text-white dark:group-hover:bg-[#9ab3f5] dark:group-hover:text-[#142247] flex items-center justify-center transition-all shrink-0 mr-1 shadow-sm">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ==============================================================
          PERSONAL LISTENING INSIGHTS (Matching Reference Image)
          ============================================================== */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#e1ebfa]/90 via-[#ebf1fc]/90 to-[#edf4fe]/90 dark:from-[#161d30] dark:via-[#192238] dark:to-[#1b253e] border border-[#d2e2f8] dark:border-[#222c45] flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        {/* Soft Background Sparkle */}
        <div className="absolute right-20 top-2 text-[#9ab3f5] text-xs opacity-60">✦</div>

        <div className="flex items-center gap-4 min-w-0">
          {/* Vinyl Record with Glowing Ring */}
          <div className="relative w-12 h-12 rounded-full bg-[#121624] border-2 border-[#2b395e] flex items-center justify-center shadow-md shrink-0">
            <Disc3 className="w-6 h-6 text-[#9ab3f5] animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute w-3.5 h-3.5 rounded-full bg-[#edf4fe] border border-[#142247]" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e1e8fc] dark:bg-[#202942] text-[#344b7d] dark:text-[#9ab3f5] border border-[#cad7f8] dark:border-[#2d395a]">
                {streakDays === 0 ? '0 hari' : `${streakDays} hari berturut-turut`}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                streakDays > 0
                  ? 'bg-[#ffeeda] text-[#d96500] border-[#ffd5a8]'
                  : 'bg-[#edf3fd] dark:bg-[#1a233b] text-[#55698f] dark:text-[#9ab3f5] border-[#d2e2f8] dark:border-[#283556]'
              }`}>
                {streakDays > 0 ? '🔥 Menyala' : '✦ Siap Mendengarkan'}
              </span>
            </div>
            <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] font-medium leading-tight">
              {streakDays > 0
                ? 'Putar lagu hari ini untuk mempertahankan pencapaian mendengarkan Anda.'
                : 'Putar lagu favoritmu hari ini untuk memulai streak musik pribadimu.'}
            </p>
          </div>
        </div>

        {/* Right Weekly Total Metric */}
        <div className="hidden sm:block text-right shrink-0 pl-4 border-l border-[#d2e2f8] dark:border-[#232c45]">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6b81a8] dark:text-[#8fa1c4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9ab3f5]" />
            <span>Total Minggu Ini</span>
          </div>
          <span className="text-base font-black text-[#142247] dark:text-white">
            {weeklyHours.toFixed(1)} Jam <span className="text-[#9ab3f5]">✦</span>
          </span>
        </div>
      </div>

      {/* ==============================================================
          MOOD FILTER SECTION (Matching Reference Image)
          ============================================================== */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            setActiveMood('Semua');
            onFilterGenre('');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
            activeMood === 'Semua'
              ? 'fantasy-pill-active'
              : 'fantasy-pill'
          }`}
        >
          <span>★</span>
          <span>Semua</span>
        </button>

        {moodPills.map((m) => {
          const isActive = activeMood === m.label;
          const Icon = m.icon;
          return (
            <button
              key={m.label}
              onClick={() => {
                setActiveMood(m.label);
                onFilterGenre(m.label);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'fantasy-pill-active'
                  : 'fantasy-pill'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{m.label}</span>
            </button>
          );
        })}

        {/* Right Decorative Sparkle Line */}
        <div className="hidden lg:flex items-center gap-2 pl-4 flex-1">
          <div className="h-[1px] flex-1 bg-[#dce7f7] dark:bg-[#202942]" />
          <span className="text-[#9ab3f5] text-xs">✦</span>
        </div>
      </div>

      {/* ==============================================================
          SMART MUSIC RECOMMENDATION ENGINE (Intelligence Mix)
          ============================================================== */}
      <div className="space-y-3.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-black text-[#142247] dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#315BCE] dark:text-[#42DDAA]" />
              <span>Rekomendasi Cerdas</span>
            </h3>
            <p className="text-xs text-[#5d729c] dark:text-[#94A6D2]">
              Algoritma selera musik yang disesuaikan dengan lagu favorit & artis pilihanmu
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#edf3fd] dark:bg-[#101A35] p-1 rounded-2xl border border-[#d2e2f8] dark:border-[#1E2D56] self-start sm:self-auto">
            <button
              onClick={() => setRecomTab('mix')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                recomTab === 'mix'
                  ? 'bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] shadow-sm'
                  : 'text-[#5d729c] dark:text-[#94A6D2] hover:text-[#142247] dark:hover:text-white'
              }`}
            >
              Mix Pribadi
            </button>
            <button
              onClick={() => setRecomTab('discover')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                recomTab === 'discover'
                  ? 'bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] shadow-sm'
                  : 'text-[#5d729c] dark:text-[#94A6D2] hover:text-[#142247] dark:hover:text-white'
              }`}
            >
              Discover Weekly
            </button>
            <button
              onClick={() => setRecomTab('similar')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                recomTab === 'similar'
                  ? 'bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] shadow-sm'
                  : 'text-[#5d729c] dark:text-[#94A6D2] hover:text-[#142247] dark:hover:text-white'
              }`}
            >
              Mirip Seleramu
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {recommendedTracks.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => handleSongClick(song)}
                className="w-40 sm:w-44 shrink-0 space-y-2 cursor-pointer group active:scale-95 transition-all"
              >
                <div className={`relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#101A35] border border-[#dce7f7] dark:border-[#1E2D56] shadow-sm group-hover:shadow-md ${
                  isCurrent ? 'ring-2 ring-[#315BCE] dark:ring-[#42DDAA]' : ''
                }`}>
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="px-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-[#142247] dark:text-white truncate">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-[#5d729c] dark:text-[#94A6D2] truncate mt-0.5 font-medium">
                    {song.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==============================================================
          LANJUTKAN (RECENT TRACKS DISCOVERY)
          ============================================================== */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-[#142247] dark:text-white tracking-tight">
              Lanjutkan
            </h3>
            <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
              Lagu yang baru saja Anda nikmati di PAPABVTIFY
            </p>
          </div>
          <span className="text-xs font-semibold text-[#5d729c] dark:text-[#8fa1c4]">
            {recentTracks.length} Lagu
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {recentTracks.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => handleSongClick(song)}
                className="w-40 sm:w-44 shrink-0 space-y-2 cursor-pointer group active:scale-95 transition-all"
              >
                <div className={`relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-[#dce7f7] dark:border-[#222c45] shadow-sm group-hover:shadow-md ${
                  isCurrent ? 'ring-2 ring-[#142247]/40 dark:ring-[#9ab3f5]' : ''
                }`}>
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#142247] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="px-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-[#142247] dark:text-white truncate">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] truncate mt-0.5 font-medium">
                    {song.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==============================================================
          ARTIST DISCOVERY (MUSISI PILIHAN)
          ============================================================== */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-[#142247] dark:text-white tracking-tight">
              Musisi Pilihan
            </h3>
            <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
              Jelajahi karya musisi resmi dari katalog terverifikasi
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#edf3fd] dark:bg-[#1a2238] p-1 rounded-xl">
            <button
              onClick={() => setArtistCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                artistCategory === 'all'
                  ? 'bg-white dark:bg-[#142247] text-[#142247] dark:text-white shadow-sm'
                  : 'text-[#5d729c] hover:text-[#142247]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setArtistCategory('indo')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                artistCategory === 'indo'
                  ? 'bg-white dark:bg-[#142247] text-[#142247] dark:text-white shadow-sm'
                  : 'text-[#5d729c] hover:text-[#142247]'
              }`}
            >
              Indonesia
            </button>
            <button
              onClick={() => setArtistCategory('intl')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                artistCategory === 'intl'
                  ? 'bg-white dark:bg-[#142247] text-[#142247] dark:text-white shadow-sm'
                  : 'text-[#5d729c] hover:text-[#142247]'
              }`}
            >
              Mancanegara
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
          {displayedArtists.slice(0, 6).map((artist) => (
            <div
              key={artist.id}
              onClick={() => onOpenArtist && onOpenArtist(artist.id)}
              className="p-3 rounded-2xl fantasy-card text-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-2.5 border-2 border-[#dce7f7] dark:border-[#222c45] shadow-sm group-hover:border-[#9ab3f5] transition">
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h4 className="text-xs font-bold text-[#142247] dark:text-white truncate">
                {artist.name}
              </h4>
              <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4] font-medium truncate mt-0.5">
                {artist.genre}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
