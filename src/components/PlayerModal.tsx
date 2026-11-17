import React, { useState, useEffect, useRef } from 'react';
import { Song, SoundStyle, ChillAmbientSound, LyricsData, RepeatMode, PlaybackMode, PlaybackContext } from '../types/music';
import { StorageService } from '../services/storage';
import { LyricsService } from '../services/lyrics';
import { AudioEngine } from '../services/audioEngine';
import { DownloadService } from '../services/downloadService';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  FastForward,
  Rewind,
  Sparkles,
  CloudRain,
  Flame,
  Disc,
  Quote,
  Sliders,
  Music,
  Columns,
  Maximize2,
  Gauge,
  ListMusic,
  Moon,
  Activity,
  Download,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  soundStyle: SoundStyle;
  onSoundStyleChange: (style: SoundStyle) => void;
  ambientSound: ChillAmbientSound;
  onAmbientSoundChange: (amb: ChillAmbientSound) => void;
  lyricsData: LyricsData | null;
  lyricsOffset: number;
  setLyricsOffset: React.Dispatch<React.SetStateAction<number>>;
  onToggleLike: (song: Song) => void;
  initialTab?: 'player' | 'lyrics';
  playbackSpeed?: number;
  onOpenSpeedModal?: () => void;
  onOpenQueueModal?: () => void;
  onOpenSleepTimerModal?: () => void;
  onOpenVisualizerModal?: () => void;
  onOpenAudioLab?: () => void;
  onDownloadSong?: (song: Song) => void;
  isDownloaded?: boolean;
  isUnderwaterFx?: boolean;
  onToggleUnderwaterFx?: () => void;
  underwaterCutoff?: number;
  onUnderwaterCutoffChange?: (cutoff: number) => void;
  playbackMode?: PlaybackMode;
  onPlaybackModeChange?: (mode: PlaybackMode) => void;
  activePlaybackContext?: PlaybackContext | null;
}

export const PlayerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  song,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  soundStyle,
  onSoundStyleChange,
  ambientSound,
  onAmbientSoundChange,
  lyricsData,
  lyricsOffset,
  setLyricsOffset,
  onToggleLike,
  initialTab = 'player',
  playbackSpeed = 1.0,
  onOpenSpeedModal,
  onOpenQueueModal,
  onOpenSleepTimerModal,
  onOpenVisualizerModal,
  onOpenAudioLab,
  onDownloadSong,
  isDownloaded = false,
  isUnderwaterFx = false,
  onToggleUnderwaterFx,
  underwaterCutoff = 480,
  onUnderwaterCutoffChange,
  playbackMode = 'follow_playlist',
  onPlaybackModeChange,
  activePlaybackContext
}) => {
  // Retain last known valid song so modal never unmounts or flashes during track switching
  const lastValidSongRef = useRef<Song | null>(song);
  useEffect(() => {
    if (song) {
      lastValidSongRef.current = song;
    }
  }, [song]);

  const activeSong = song || lastValidSongRef.current;

  // Tabs: 'player' | 'lyrics' | 'split'
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'split'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'split';
    }
    return initialTab;
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [userIsScrolling, setUserIsScrolling] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<any>(null);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setActiveTab('split');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab]);

  // Reset image state when song changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [activeSong?.id]);

  const [isDownloadedState, setIsDownloadedState] = useState<boolean>(isDownloaded);
  const [isDownloadingState, setIsDownloadingState] = useState<boolean>(false);

  useEffect(() => {
    if (!activeSong) return;
    setIsDownloadedState(DownloadService.isDownloadedSync(activeSong.id));
    setIsDownloadingState(DownloadService.isDownloading(activeSong.id));

    const unsub = DownloadService.subscribe(activeSong.id, (prog) => {
      setIsDownloadedState(prog.status === 'completed');
      setIsDownloadingState(prog.status === 'preparing' || prog.status === 'downloading');
    });
    return unsub;
  }, [activeSong?.id]);

  // Stable playback position tracker for lyrics sync (100ms interval, GPU-safe, zero frame drop)
  const [preciseTime, setPreciseTime] = useState<number>(currentTime);

  useEffect(() => {
    if (!isOpen) return;
    if (!isPlaying) {
      setPreciseTime(currentTime);
      return;
    }
    const interval = setInterval(() => {
      const cur = AudioEngine.getInstance().getCurrentTime();
      if (typeof cur === 'number' && !isNaN(cur)) {
        setPreciseTime(cur);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  // Active lyric line calculation with high precision
  const effectiveTime = isPlaying ? preciseTime : currentTime;
  const safeOffset = typeof lyricsOffset === 'number' && !isNaN(lyricsOffset) ? lyricsOffset : 0;
  const activeIndex = lyricsData?.lines
    ? LyricsService.findActiveIndex(lyricsData.lines, effectiveTime, safeOffset)
    : -1;

  // Container-isolated smooth autoscroll - triggers ONLY when activeIndex actually changes to a new line
  const lastScrolledIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (!isOpen || userIsScrolling || activeIndex === -1) return;
    if (lastScrolledIndexRef.current === activeIndex) return; // Prevent repeated scroll spam!
    lastScrolledIndexRef.current = activeIndex;

    const container = containerRef.current;
    const activeEl = activeLineRef.current;
    if (container && activeEl) {
      const targetTop = activeEl.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
    }
  }, [activeIndex, userIsScrolling, isOpen]);

  // Early return ONLY after all React Hooks have been declared (Rules of Hooks guarantee)
  if (!isOpen || !activeSong) return null;

  const handleUserScroll = () => {
    setUserIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrolling(false);
    }, 3500);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAdjustOffset = (delta: number) => {
    if (!activeSong) return;
    setLyricsOffset(prev => {
      const current = typeof prev === 'number' && !isNaN(prev) ? prev : 0;
      const updated = Math.round((current + delta) * 10) / 10;
      StorageService.setSongOffset(activeSong.id, updated);
      return updated;
    });
  };

  const soundStyles: { key: SoundStyle; label: string }[] = [
    { key: 'normal', label: 'Original' },
    { key: 'slowed_reverb', label: 'Slowed + Reverb' },
    { key: 'lofi', label: 'Lo-Fi Chill' },
    { key: 'nightcore', label: 'Nightcore' },
    { key: 'eight_d', label: '8D Spatial' },
  ];

  const thumbUrl = imageError
    ? `https://i.ytimg.com/vi/${activeSong.id}/hqdefault.jpg`
    : activeSong.thumbnail || `https://i.ytimg.com/vi/${activeSong.id}/hqdefault.jpg`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#142247]/40 dark:bg-black/60 animate-fadeIn select-none">
      <div className="relative w-full max-w-6xl mx-auto h-[96vh] rounded-t-[36px] bg-[#F8FAFF] dark:bg-[#12172a] flex flex-col overflow-hidden shadow-2xl border-t border-[#A8C5FF] dark:border-[#283556] animate-slideUp">
        
        {/* ==============================================================
            DYNAMIC AMBIENT GLOW BACKDROP (Soft Fantasy Pastel)
            ============================================================== */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#e1ebfa]/50 via-transparent to-transparent pointer-events-none -z-10" />

        {/* ==============================================================
            TOP DISMISS BAR & VIEW SWITCHER
            ============================================================== */}
        <div className="pt-3.5 pb-2.5 px-6 sm:px-10 flex flex-col items-center border-b border-[#dce7f7] dark:border-[#222c45] shrink-0 z-20">
          <button
            onClick={onClose}
            className="w-12 h-1.5 rounded-full bg-[#d2e2f8] dark:bg-[#283556] hover:bg-[#a8c5ff] transition mb-2.5 cursor-pointer"
            title="Tutup Pemutar"
          />

          <div className="flex items-center justify-between w-full">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-[#142247] dark:text-[#9ab3f5] hover:opacity-85 transition flex items-center gap-1.5 text-xs font-bold active:scale-95 shadow-xs"
            >
              <ChevronDown className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            {/* Segmented View Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-xs font-bold shadow-xs">
              <button
                onClick={() => setActiveTab('player')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl transition-all ${
                  activeTab === 'player'
                    ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                    : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'
                }`}
              >
                Pemutar
              </button>
              <button
                onClick={() => setActiveTab('lyrics')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'lyrics'
                    ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                    : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>Lirik</span>
              </button>
              <button
                onClick={() => setActiveTab('split')}
                className={`hidden md:flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl transition-all ${
                  activeTab === 'split'
                    ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                    : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'
                }`}
                title="Buka Musik di Kiri & Full Lirik di Kanan"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
            </div>

            {/* Top Right Quick Controls: Download & Favorite */}
            <div className="flex items-center gap-1.5">
              {onDownloadSong && (
                <button
                  onClick={() => onDownloadSong(activeSong)}
                  disabled={isDownloadingState}
                  className={`p-2.5 rounded-full bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] transition active:scale-90 shadow-xs cursor-pointer ${
                    isDownloadedState
                      ? 'text-emerald-500'
                      : isDownloadingState
                      ? 'text-[#315BCE] dark:text-[#42DDAA]'
                      : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'
                  }`}
                  title={
                    isDownloadedState
                      ? 'Tersimpan Offline'
                      : isDownloadingState
                      ? 'Sedang Mengunduh...'
                      : 'Unduh Lagu Ini'
                  }
                >
                  {isDownloadingState ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isDownloadedState ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              )}

              <button
                onClick={() => onToggleLike(activeSong)}
                className={`p-2.5 rounded-full bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] transition active:scale-90 shadow-xs ${
                  activeSong.liked ? 'text-red-500 fill-red-500' : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-red-500'
                }`}
                title="Sukai Lagu"
              >
                <Heart className={`w-4 h-4 ${activeSong.liked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ==============================================================
            MAIN CONTAINER: SPLIT (LEFT + RIGHT) OR SINGLE VIEW
            ============================================================== */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* ============================================================
              LEFT PANE: FOTO ALBUM, JUDUL, NEXT, PAUSE, DURASI
              ============================================================ */}
          {(activeTab === 'player' || activeTab === 'split') && (
            <div className={`flex-1 overflow-y-auto px-6 sm:px-10 py-5 flex flex-col justify-between space-y-4 animate-fadeIn pb-8 ${
              activeTab === 'split' ? 'lg:w-[48%] lg:border-r lg:border-[#dce7f7] dark:lg:border-[#222c45]' : 'max-w-xl mx-auto w-full'
            }`}>
              
              {/* Active Context Banner */}
              {activePlaybackContext && (
                <div className="flex items-center justify-center gap-1.5 -mb-1">
                  <span className="text-[11px] px-3 py-1 rounded-full font-mono font-semibold bg-[#edf3fd] dark:bg-[#1a233b] text-[#2c4b9b] dark:text-[#9ab3f5] border border-[#d2e2f8] dark:border-[#283556] truncate max-w-sm shadow-xs flex items-center gap-1.5">
                    <span>{playbackMode === 'follow_playlist' ? '📜 Follow Playlist:' : playbackMode === 'smart_shuffle' ? '✨ Smart Shuffle:' : '🔀 Normal Shuffle:'}</span>
                    <strong className="font-bold">{activePlaybackContext.title}</strong>
                  </span>
                </div>
              )}

              {/* High-Res Album Artwork with Elegant Fantasy Placeholder */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 mx-auto rounded-3xl overflow-hidden shadow-xl border border-[#dce7f7] dark:border-[#283556] shrink-0 group bg-gradient-to-tr from-[#dce7f7] to-[#e8f1fd] dark:from-[#1b233a] dark:to-[#253254]">
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#dce7f7] to-[#e8f1fd] dark:from-[#1b233a] dark:to-[#253254] flex flex-col items-center justify-center p-4 text-center">
                    <Disc className="w-12 h-12 text-[#9ab3f5] animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[11px] font-semibold text-[#5d729c] dark:text-[#8fa1c4] mt-2">Memuat Artwork...</span>
                  </div>
                )}

                {imageError ? (
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#e8f1fe] via-[#edf3fd] to-[#f4f7fe] dark:from-[#151c30] dark:via-[#19223a] dark:to-[#1e2a48] flex flex-col items-center justify-center p-6 text-center">
                    <Disc className="w-14 h-14 text-[#9ab3f5] animate-spin mb-2" style={{ animationDuration: '10s' }} />
                    <span className="text-sm font-extrabold text-[#142247] dark:text-white truncate max-w-[200px]">{activeSong.title}</span>
                    <span className="text-xs text-[#5d729c] dark:text-[#8fa1c4] truncate max-w-[200px]">{activeSong.artist}</span>
                  </div>
                ) : (
                  <img
                    src={thumbUrl}
                    alt={activeSong.title}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageError(true);
                      setImageLoaded(true);
                    }}
                    className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                      imageLoaded ? 'opacity-100 scale-100' : 'opacity-90'
                    }`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Title & Artist Narrative */}
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-[#142247] dark:text-white tracking-tight truncate px-2">
                  {activeSong.title}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#5d729c] dark:text-[#8fa1c4] truncate">
                  {activeSong.artist} • <span className="text-[#8fa1c4]">{activeSong.album || 'Single'}</span>
                </p>
                {activeSong.recommendationReason && (
                  <div className="flex items-center justify-center pt-0.5">
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                      💡 {activeSong.recommendationReason}
                    </span>
                  </div>
                )}
              </div>

              {/* Timeline Scrub Slider with Real Time */}
              <div className="space-y-1 max-w-md mx-auto w-full">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#dce7f7] dark:bg-[#202942] rounded-lg cursor-pointer accent-[#2e498c] dark:accent-[#9ab3f5]"
                />
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#5d729c] dark:text-[#8fa1c4] px-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls Bar: Shuffle, Prev, Play/Pause, Next, Repeat */}
              <div className="flex items-center justify-between max-w-xs mx-auto w-full pt-0.5">
                <button
                  onClick={onToggleShuffle}
                  className={`p-2 transition active:scale-75 ${isShuffle ? 'text-[#142247] dark:text-[#9ab3f5]' : 'text-[#7d93be] hover:text-[#142247] dark:hover:text-white'}`}
                  title="Acak Lagu"
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button
                  onClick={onPrev}
                  className="p-2.5 text-[#55698f] hover:text-[#142247] dark:text-slate-300 dark:hover:text-white transition active:scale-75"
                  title="Lagu Sebelumnya"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={onPlayPause}
                  className="w-14 h-14 rounded-full bg-[#142247] text-white dark:bg-white dark:text-[#142247] flex items-center justify-center hover:scale-105 active:scale-90 transition-all duration-200 shadow-xl cursor-pointer"
                  title={isPlaying ? 'Jeda' : 'Putar'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={onNext}
                  className="p-2.5 text-[#55698f] hover:text-[#142247] dark:text-slate-300 dark:hover:text-white transition active:scale-75"
                  title="Lagu Berikutnya"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={onToggleRepeat}
                  className={`p-2 transition relative active:scale-75 ${repeatMode !== 'off' ? 'text-[#142247] dark:text-[#9ab3f5]' : 'text-[#7d93be] hover:text-[#142247] dark:hover:text-white'}`}
                  title="Ulangi"
                >
                  <Repeat className="w-5 h-5" />
                  {repeatMode === 'one' && (
                    <span className="absolute top-1 right-1 text-[9px] font-black font-mono">1</span>
                  )}
                </button>
              </div>

              {/* Playback Mode Selector: Follow Playlist / Smart Shuffle / Normal Shuffle */}
              {onPlaybackModeChange && (
                <div className="flex items-center justify-center max-w-sm mx-auto w-full pt-1 pb-0.5">
                  <div className="flex items-center p-1 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-xs font-bold shadow-xs">
                    <button
                      onClick={() => onPlaybackModeChange('follow_playlist')}
                      className={`px-3 py-1 rounded-xl transition-all ${
                        playbackMode === 'follow_playlist'
                          ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                          : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'
                      }`}
                      title="Follow Playlist: Urutan asli playlist tanpa lagu luar"
                    >
                      📜 Follow Playlist
                    </button>
                    <button
                      onClick={() => onPlaybackModeChange('smart_shuffle')}
                      className={`px-3 py-1 rounded-xl transition-all ${
                        playbackMode === 'smart_shuffle'
                          ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                          : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'
                      }`}
                      title="Smart Shuffle: Acak cerdas berbasis selera & kemiripan musik"
                    >
                      ✨ Smart Shuffle
                    </button>
                    <button
                      onClick={() => onPlaybackModeChange('normal_shuffle')}
                      className={`px-3 py-1 rounded-xl transition-all ${
                        playbackMode === 'normal_shuffle'
                          ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] shadow-sm font-extrabold'
                          : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'
                      }`}
                      title="Normal Shuffle: Acak murni tanpa pengulangan"
                    >
                      🔀 Normal
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Utility Tools Dock: Audio Lab, Speed, Queue, Sleep Timer, Visualizer */}
              <div className="flex items-center justify-center gap-2 pt-1 border-t border-white/[0.06] max-w-md mx-auto w-full">
                {onOpenAudioLab && (
                  <button
                    onClick={onOpenAudioLab}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95"
                    title="Buka Audio Lab (10-Band EQ & Bass)"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Audio Lab</span>
                  </button>
                )}

                {onOpenSpeedModal && (
                  <button
                    onClick={onOpenSpeedModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-mono font-bold text-purple-300 hover:text-white transition active:scale-95"
                    title="Kecepatan Putar (Speed Control)"
                  >
                    <Gauge className="w-3.5 h-3.5 text-purple-400" />
                    <span>{playbackSpeed.toFixed(1)}x</span>
                  </button>
                )}

                {onOpenQueueModal && (
                  <button
                    onClick={onOpenQueueModal}
                    className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition active:scale-95"
                    title="Antrean Putar"
                  >
                    <ListMusic className="w-4 h-4 text-sky-400" />
                  </button>
                )}

                {onOpenVisualizerModal && (
                  <button
                    onClick={onOpenVisualizerModal}
                    className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition active:scale-95"
                    title="Visualizer Sinematik"
                  >
                    <Activity className="w-4 h-4 text-pink-400" />
                  </button>
                )}

                {onOpenSleepTimerModal && (
                  <button
                    onClick={onOpenSleepTimerModal}
                    className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition active:scale-95"
                    title="Pengatur Waktu Tidur"
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                  </button>
                )}
              </div>

              {/* DSP Sound Styles Selector */}
              <div className="space-y-1 pt-1.5 border-t border-white/[0.06] max-w-md mx-auto w-full">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  Gaya Akustik DSP
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {soundStyles.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => onSoundStyleChange(s.key)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition active:scale-95 ${
                        soundStyle === s.key
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-extrabold shadow-md'
                          : 'liquid-glass-pill text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Underwater Muffled DSP Modifier (Stackable with Slowed + Reverb) */}
                {onToggleUnderwaterFx && (
                  <div className="mt-2.5 p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🌊</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-cyan-600 dark:text-cyan-300">Efek Underwater (Mendem)</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-200 font-bold">
                              DSP FILTER
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Bisa dikombinasikan dengan Slowed + Reverb atau gaya apa pun
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onToggleUnderwaterFx}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold transition active:scale-95 shadow-sm ${
                          isUnderwaterFx
                            ? 'bg-cyan-600 text-white dark:bg-cyan-400 dark:text-slate-950 shadow-cyan-500/30 animate-pulse'
                            : 'liquid-glass-pill text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300'
                        }`}
                      >
                        {isUnderwaterFx ? 'AKTIF' : 'NONAKTIF'}
                      </button>
                    </div>

                    {isUnderwaterFx && onUnderwaterCutoffChange && (
                      <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 shrink-0">
                          Frekuensi: {underwaterCutoff} Hz
                        </span>
                        <input
                          type="range"
                          min={200}
                          max={900}
                          step={20}
                          value={underwaterCutoff}
                          onChange={(e) => onUnderwaterCutoffChange(parseInt(e.target.value))}
                          className="flex-1 h-1 bg-cyan-950/40 rounded-lg cursor-pointer accent-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                          {underwaterCutoff <= 350 ? 'Palung Dalam' : underwaterCutoff >= 650 ? 'Dangkal' : 'Mendem Standar'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chill Ambient Mode */}
              <div className="space-y-1 pt-1 border-t border-black/5 dark:border-white/[0.06] max-w-md mx-auto w-full">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  Suara Latar Chill Ambient
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { key: 'none' as ChillAmbientSound, label: 'Mati', icon: Sparkles },
                    { key: 'rain' as ChillAmbientSound, label: 'Hujan', icon: CloudRain },
                    { key: 'fireplace' as ChillAmbientSound, label: 'Api', icon: Flame },
                    { key: 'vinyl' as ChillAmbientSound, label: 'Vinyl', icon: Disc },
                  ].map((a) => {
                    const Icon = a.icon;
                    const isActive = ambientSound === a.key;
                    return (
                      <button
                        key={a.key}
                        onClick={() => onAmbientSoundChange(a.key)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-extrabold shadow-md'
                            : 'liquid-glass-pill text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Switch to Lyrics Button on Mobile */}
              {activeTab === 'player' && (
                <button
                  onClick={() => setActiveTab('lyrics')}
                  className="lg:hidden w-full py-2.5 rounded-2xl liquid-glass-pill font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 mt-2 text-slate-900 dark:text-white"
                >
                  <Quote className="w-4 h-4 text-indigo-500" />
                  <span>Lihat Lirik Realtime</span>
                </button>
              )}
            </div>
          )}

          {/* ============================================================
              RIGHT PANE: FULL REALTIME SYNCHRONIZED LYRICS
              ============================================================ */}
          {(activeTab === 'lyrics' || activeTab === 'split') && (
            <div className={`flex-1 flex flex-col p-5 sm:p-8 overflow-hidden animate-fadeIn ${
              activeTab === 'split' ? 'lg:w-[52%]' : 'w-full max-w-2xl mx-auto'
            }`}>
              
              {/* Mobile Lyrics Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/[0.08] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 border border-black/5 dark:border-white/10 shadow-sm">
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{activeSong.title}</span>
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {lyricsData?.source || 'Menyelaraskan lirik realtime...'}
                    </p>
                  </div>
                </div>

                {/* Offset Calibration (-500ms to +500ms) */}
                {lyricsData?.syncType === 'line' && (
                  <div className="flex flex-wrap items-center gap-1 liquid-glass-pill px-2.5 py-1 rounded-xl shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 mr-0.5">Offset:</span>
                    <button
                      onClick={() => handleAdjustOffset(-0.1)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white active:scale-75"
                      title="-100ms"
                    >
                      -100ms
                    </button>
                    <button
                      onClick={() => handleAdjustOffset(-0.5)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white active:scale-75"
                      title="-500ms"
                    >
                      -500ms
                    </button>
                    <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-300 px-1 text-center">
                      {safeOffset >= 0 ? `+${Math.round(safeOffset * 1000)}ms` : `${Math.round(safeOffset * 1000)}ms`}
                    </span>
                    <button
                      onClick={() => handleAdjustOffset(0.1)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white active:scale-75"
                      title="+100ms"
                    >
                      +100ms
                    </button>
                    <button
                      onClick={() => handleAdjustOffset(0.5)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white active:scale-75"
                      title="+500ms"
                    >
                      +500ms
                    </button>
                    {safeOffset !== 0 && (
                      <button
                        onClick={() => {
                          setLyricsOffset(0);
                          if (activeSong) StorageService.setSongOffset(activeSong.id, 0);
                        }}
                        className="text-[9px] font-mono text-slate-400 hover:text-rose-500 underline ml-1"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Synchronized Lyrics Container with Native Auto-scroll */}
              <div
                ref={containerRef}
                onWheel={handleUserScroll}
                onTouchMove={handleUserScroll}
                className="relative flex-1 overflow-y-auto py-16 px-4 space-y-7 text-center scroll-smooth pr-2 select-text"
              >
                {!lyricsData ? (
                  // Loading Shimmer Skeleton with Title (Fantasy Styled)
                  <div className="py-12 space-y-5 max-w-sm mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-xs font-mono text-[#142247] dark:text-[#9ab3f5]">
                      <span className="w-2 h-2 rounded-full bg-[#344b7d] dark:bg-[#9ab3f5] animate-ping" />
                      <span>Mengambil lirik untuk "{activeSong.title}"...</span>
                    </div>
                    <div className="space-y-4 pt-3">
                      <div className="h-6 bg-[#e1ebfa] dark:bg-[#1e2742] rounded-xl w-3/4 mx-auto animate-pulse" />
                      <div className="h-8 bg-[#d2e2f8] dark:bg-[#253254] rounded-xl w-5/6 mx-auto animate-pulse" />
                      <div className="h-6 bg-[#e1ebfa] dark:bg-[#1e2742] rounded-xl w-2/3 mx-auto animate-pulse" />
                      <div className="h-6 bg-[#e1ebfa] dark:bg-[#1e2742] rounded-xl w-4/5 mx-auto animate-pulse" />
                    </div>
                  </div>
                ) : lyricsData.lines.length === 0 ? (
                  // Fallback when no lyrics indexed
                  <div className="py-16 space-y-3 max-w-md mx-auto text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] flex items-center justify-center mx-auto text-[#5d729c] dark:text-[#9ab3f5]">
                      <Quote className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-[#142247] dark:text-white">Lirik Belum Tersedia</h4>
                    <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] leading-relaxed">
                      Lirik untuk lagu <span className="font-bold text-[#142247] dark:text-white">{activeSong.title}</span> belum terindeks di database publik.
                    </p>
                    <button
                      onClick={() => setActiveTab('player')}
                      className="mt-3 px-5 py-2 rounded-xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] text-xs font-extrabold hover:opacity-90 transition active:scale-95 shadow-md cursor-pointer"
                    >
                      Buka Tampilan Pemutar
                    </button>
                  </div>
                ) : lyricsData.syncType === 'plain' ? (
                  // Plain Lyrics
                  <div className="space-y-4 max-w-lg mx-auto py-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-xs font-mono mb-4 text-[#142247] dark:text-[#9ab3f5]">
                      <span>Teks Lirik Lengkap</span>
                    </div>
                    {lyricsData.lines.map((line, idx) => {
                      if (!line || !line.text) return null;
                      return (
                        <p key={idx} className="text-base sm:text-lg text-[#142247] dark:text-[#f0f4fc] leading-relaxed font-semibold">
                          {line.text}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  // Realtime Synced Lyrics
                  lyricsData.lines.map((line, idx) => {
                    if (!line || !line.text) return null;
                    const isActive = idx === activeIndex;
                    const isPast = idx < activeIndex;

                    return (
                      <div
                        key={idx}
                        ref={isActive ? activeLineRef : null}
                        onClick={() => onSeek(line.time)}
                        className={`cursor-pointer transition-all duration-300 py-2.5 px-4 rounded-2xl ${
                          isActive
                            ? 'text-2xl sm:text-3xl font-black text-[#142247] dark:text-white scale-[1.04] tracking-tight drop-shadow-sm'
                            : isPast
                            ? 'text-base sm:text-lg font-bold text-[#5d729c] dark:text-[#9ab3f5]/70 hover:text-[#142247] dark:hover:text-white'
                            : 'text-base sm:text-lg font-semibold text-[#8fa1c4] dark:text-[#5d729c]/60 hover:text-[#142247] dark:hover:text-white/80'
                        }`}
                      >
                        {line.words && isActive ? (
                          <span className="flex flex-wrap justify-center gap-1.5">
                            {line.words.map((w, wIdx) => {
                              const isWordActive = !!(w && typeof w.startTime === 'number' && typeof w.endTime === 'number' && effectiveTime >= w.startTime && effectiveTime <= w.endTime);
                              const isWordPast = !!(w && typeof w.endTime === 'number' && effectiveTime > w.endTime);
                              return (
                                <span
                                  key={wIdx}
                                  className={`transition-all duration-150 ${
                                    isWordActive
                                      ? 'text-[#233876] dark:text-white font-black underline decoration-[#9ab3f5] decoration-2 scale-105'
                                      : isWordPast
                                      ? 'text-[#142247] dark:text-white font-extrabold'
                                      : 'text-[#6878A6] dark:text-white/60'
                                  }`}
                                >
                                  {w.text}
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          <span>{line.text}</span>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Floating Return-to-Active-Lyric Button when user scrolls manually */}
                {userIsScrolling && activeIndex >= 0 && (
                  <button
                    onClick={() => {
                      setUserIsScrolling(false);
                      const container = containerRef.current;
                      const activeEl = activeLineRef.current;
                      if (container && activeEl) {
                        const targetTop = activeEl.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
                        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
                      }
                    }}
                    className="sticky bottom-4 left-1/2 -translate-x-1/2 z-20 mx-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/40 backdrop-blur-md transition active:scale-95 cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Lompat ke Baris Aktif</span>
                  </button>
                )}
              </div>

              {/* Bottom Mini Player Controls when in Mobile Lyrics Tab */}
              {activeTab === 'lyrics' && (
                <div className="lg:hidden pt-3 border-t border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
                  <div className="flex-1 space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => onSeek(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-lg cursor-pointer accent-indigo-400"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={onPrev}
                      className="p-2 text-slate-300 hover:text-white transition active:scale-75"
                    >
                      <SkipBack className="w-5 h-5 fill-current" />
                    </button>
                    <button
                      onClick={onPlayPause}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center active:scale-90 shadow-md"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current text-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-current text-black ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={onNext}
                      className="p-2 text-slate-300 hover:text-white transition active:scale-75"
                    >
                      <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
