import React, { useState, useEffect } from 'react';
import { Song, SoundStyle, RepeatMode, PlaybackMode, PlaybackContext } from '../types/music';
import { DownloadService } from '../services/downloadService';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Quote,
  Maximize2,
  Radio,
  Sliders,
  Music,
  Download,
  ListMusic,
  Activity,
  Gauge,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface Props {
  currentSong: Song | null;
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
  onToggleLike: (song: Song) => void;
  onOpenPlayerModal: () => void;
  onOpenLyrics: () => void;
  onOpenAudioLab?: () => void;
  onOpenSpeedModal?: () => void;
  playbackSpeed?: number;
  onOpenQueue?: () => void;
  onOpenVisualizer?: () => void;
  onDownloadSong?: (song: Song) => void;
  isDownloaded?: boolean;
  isUnderwaterFx?: boolean;
  onToggleUnderwaterFx?: () => void;
  playbackMode?: PlaybackMode;
  onPlaybackModeChange?: (mode: PlaybackMode) => void;
  activePlaybackContext?: PlaybackContext | null;
}

export const BottomPlayer: React.FC<Props> = ({
  currentSong,
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
  onToggleLike,
  onOpenPlayerModal,
  onOpenLyrics,
  onOpenAudioLab,
  onOpenSpeedModal,
  playbackSpeed = 1.0,
  onOpenQueue,
  onOpenVisualizer,
  onDownloadSong,
  isDownloaded = false,
  isUnderwaterFx = false,
  onToggleUnderwaterFx,
  playbackMode = 'follow_playlist',
  onPlaybackModeChange,
  activePlaybackContext
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isDownloadedState, setIsDownloadedState] = useState<boolean>(isDownloaded);
  const [isDownloadingState, setIsDownloadingState] = useState<boolean>(false);

  useEffect(() => {
    if (!currentSong) return;
    setIsDownloadedState(DownloadService.isDownloadedSync(currentSong.id));
    setIsDownloadingState(DownloadService.isDownloading(currentSong.id));

    const unsub = DownloadService.subscribe(currentSong.id, (prog) => {
      setIsDownloadedState(prog.status === 'completed');
      setIsDownloadingState(prog.status === 'preparing' || prog.status === 'downloading');
    });
    return unsub;
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const soundStyles: { key: SoundStyle; label: string }[] = [
    { key: 'normal', label: 'Original' },
    { key: 'slowed_reverb', label: 'Slowed + Reverb' },
    { key: 'lofi', label: 'Lo-Fi Chill' },
    { key: 'nightcore', label: 'Nightcore' },
    { key: 'eight_d', label: '8D Spatial' },
  ];

  const thumbUrl = imgError
    ? `https://i.ytimg.com/vi/${currentSong.id}/hqdefault.jpg`
    : currentSong.thumbnail;

  return (
    <>
      {/* ==============================================================
          MOBILE VIEW: FLOATING LIQUID GLASS MINI PLAYER (Matching Reference)
          ============================================================== */}
      <div className="md:hidden fixed bottom-[74px] inset-x-3.5 z-40 select-none animate-fadeIn flex justify-center pointer-events-none">
        <div
          onClick={onOpenPlayerModal}
          className="pointer-events-auto liquid-mini-player rounded-full p-2 pr-3 flex items-center justify-between gap-2.5 shadow-2xl cursor-pointer group active:scale-[0.98] transition-all max-w-sm w-full"
        >
          {/* Left: Thumbnail & Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-900 border border-black/5 dark:border-white/15 shadow-sm">
              {!imgError ? (
                <img
                  src={thumbUrl}
                  alt={currentSong.title}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-900">
                  <Music className="w-4 h-4 text-slate-500" />
                </div>
              )}
              {currentSong.isRadio && (
                <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {activePlaybackContext && (
                <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 block truncate">
                  {playbackMode === 'follow_playlist' ? '📜 ' : playbackMode === 'smart_shuffle' ? '✨ ' : '🔀 '}
                  {activePlaybackContext.title}
                </span>
              )}
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-snug">
                {currentSong.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {currentSong.artist}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Buttons (Matching Reference: Heart, Play/Pause, Next) */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onToggleUnderwaterFx && (
              <button
                onClick={onToggleUnderwaterFx}
                className={`p-1.5 rounded-full transition active:scale-75 ${
                  isUnderwaterFx ? 'text-cyan-500 bg-cyan-500/15 font-bold scale-110' : 'text-slate-400 hover:text-cyan-500'
                }`}
                title={isUnderwaterFx ? 'Efek Underwater (Mendem) Aktif' : 'Efek Underwater (Mendem)'}
              >
                <span className="text-xs">🌊</span>
              </button>
            )}

            <button
              onClick={() => onToggleLike(currentSong)}
              className={`p-1.5 rounded-full transition active:scale-75 ${
                currentSong.liked ? 'text-red-500 fill-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-500'
              }`}
              title="Sukai Lagu"
            >
              <Heart className={`w-4 h-4 ${currentSong.liked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onPlayPause}
              className="w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center active:scale-90 transition-all shadow-md mx-0.5"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current text-white dark:text-black" />
              ) : (
                <Play className="w-4 h-4 fill-current text-white dark:text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition active:scale-75"
              title="Lagu Berikutnya"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==============================================================
          DESKTOP VIEW: PERMANENT FANTASY PLAYER DOCK (Matching Reference)
          ============================================================== */}
      <div className="hidden md:block fixed bottom-0 inset-x-0 z-40 select-none">
        <div className="fantasy-player-dock px-6 py-2.5 flex items-center justify-between gap-6">
          {/* Left: Track Info & Artwork */}
          <div
            onClick={onOpenPlayerModal}
            className="flex items-center gap-3.5 min-w-0 w-1/4 cursor-pointer group"
            title="Klik untuk membuka pemutar penuh"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-[#dce7f7] dark:border-[#222c45] shadow-sm">
              {!imgError ? (
                <img
                  src={thumbUrl}
                  alt={currentSong.title}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <Music className="w-4 h-4 text-slate-400" />
                </div>
              )}
              {currentSong.isRadio && (
                <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {activePlaybackContext && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 truncate max-w-[180px]">
                    {playbackMode === 'follow_playlist' ? '📜 Follow: ' : playbackMode === 'smart_shuffle' ? '✨ Smart: ' : '🔀 Shuffled: '}
                    {activePlaybackContext.title}
                  </span>
                </div>
              )}
              <h4 className="text-xs sm:text-sm font-bold text-[#142247] dark:text-[#f0f4fc] truncate group-hover:text-[#2c4b9b] transition">
                {currentSong.title}
              </h4>
              <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] font-medium truncate mt-0.5">
                {currentSong.artist}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(currentSong);
              }}
              className={`p-2 rounded-full transition shrink-0 active:scale-75 ${
                currentSong.liked
                  ? 'text-red-500 fill-red-500'
                  : 'text-[#6f84ac] hover:text-[#142247] dark:hover:text-white'
              }`}
              title="Sukai Lagu"
            >
              <Heart className={`w-4 h-4 ${currentSong.liked ? 'fill-current' : ''}`} />
            </button>

            {onDownloadSong && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadSong(currentSong);
                }}
                disabled={isDownloadingState}
                className={`p-2 rounded-full transition shrink-0 active:scale-75 cursor-pointer ${
                  isDownloadedState
                    ? 'text-emerald-500'
                    : isDownloadingState
                    ? 'text-[#315BCE] dark:text-[#42DDAA] animate-spin'
                    : 'text-[#6f84ac] hover:text-[#142247] dark:hover:text-white'
                }`}
                title={
                  isDownloadedState
                    ? 'Tersimpan Offline (Klik untuk unduh ulang)'
                    : isDownloadingState
                    ? 'Sedang Mengunduh...'
                    : 'Unduh Musik Offline'
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
          </div>

          {/* Center: Controls & Timeline matching Reference */}
          <div className="flex-1 max-w-xl space-y-1.5 flex flex-col items-center">
            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {onPlaybackModeChange && (
                <div className="hidden lg:flex items-center bg-[#edf3fd] dark:bg-[#1a233b] p-0.5 rounded-full border border-[#d3e2f7] dark:border-[#283556] text-[10px] font-semibold mr-1">
                  <button
                    onClick={() => onPlaybackModeChange('follow_playlist')}
                    className={`px-2.5 py-0.5 rounded-full transition ${
                      playbackMode === 'follow_playlist'
                        ? 'bg-[#142247] text-white dark:bg-white dark:text-[#142247] shadow-sm'
                        : 'text-[#62779f] hover:text-[#142247] dark:hover:text-white'
                    }`}
                    title="Follow Playlist: Urutan asli playlist tanpa rekomendasi luar"
                  >
                    📜 Follow
                  </button>
                  <button
                    onClick={() => onPlaybackModeChange('smart_shuffle')}
                    className={`px-2.5 py-0.5 rounded-full transition ${
                      playbackMode === 'smart_shuffle'
                        ? 'bg-[#142247] text-white dark:bg-white dark:text-[#142247] shadow-sm'
                        : 'text-[#62779f] hover:text-[#142247] dark:hover:text-white'
                    }`}
                    title="Smart Shuffle: Acak cerdas berbasis selera & kemiripan musik"
                  >
                    ✨ Smart
                  </button>
                  <button
                    onClick={() => onPlaybackModeChange('normal_shuffle')}
                    className={`px-2.5 py-0.5 rounded-full transition ${
                      playbackMode === 'normal_shuffle'
                        ? 'bg-[#142247] text-white dark:bg-white dark:text-[#142247] shadow-sm'
                        : 'text-[#62779f] hover:text-[#142247] dark:hover:text-white'
                    }`}
                    title="Normal Shuffle: Acak murni tanpa pengulangan"
                  >
                    🔀 Normal
                  </button>
                </div>
              )}

              <button
                onClick={onToggleShuffle}
                className={`p-1.5 rounded-lg transition active:scale-90 ${
                  isShuffle ? 'text-[#142247] dark:text-[#9ab3f5]' : 'text-[#7d93be] hover:text-[#142247] dark:hover:text-white'
                }`}
                title="Acak Lagu"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={onPrev}
                className="p-1.5 text-[#55698f] hover:text-[#142247] dark:text-slate-300 dark:hover:text-white transition active:scale-90"
                title="Lagu Sebelumnya"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* Play/Pause Button: Solid Midnight Navy Circle */}
              <button
                onClick={onPlayPause}
                className="w-10 h-10 rounded-full bg-[#142247] text-white dark:bg-white dark:text-[#142247] flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-md mx-1"
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-1.5 text-[#55698f] hover:text-[#142247] dark:text-slate-300 dark:hover:text-white transition active:scale-90"
                title="Lagu Berikutnya"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-1.5 rounded-lg transition relative active:scale-90 ${
                  repeatMode !== 'off' ? 'text-[#142247] dark:text-[#9ab3f5]' : 'text-[#7d93be] hover:text-[#142247] dark:hover:text-white'
                }`}
                title="Ulangi"
              >
                <Repeat className="w-4 h-4" />
                {repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-black font-mono">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Timeline Scrubber Bar */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[11px] font-mono font-medium text-[#5d729c] dark:text-[#8fa1c4] w-9 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-[#dce7f7] dark:bg-[#202942] rounded-lg cursor-pointer accent-[#2e498c] dark:accent-[#9ab3f5]"
              />
              <span className="text-[11px] font-mono font-medium text-[#5d729c] dark:text-[#8fa1c4] w-9">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Audio Lab, Queue, Speed, Lyrics, Volume, Expand */}
          <div className="flex items-center justify-end gap-2.5 w-1/4">
            {/* Underwater Sound Effect Toggle Pill */}
            {onToggleUnderwaterFx && (
              <button
                onClick={onToggleUnderwaterFx}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition active:scale-95 shadow-sm ${
                  isUnderwaterFx
                    ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950 border-transparent shadow-cyan-500/25 animate-pulse'
                    : 'bg-[#edf3fd] dark:bg-[#1a233b] border-[#d3e2f7] dark:border-[#283556] text-[#4f648d] dark:text-[#8ea2c8] hover:text-cyan-600 dark:hover:text-cyan-300'
                }`}
                title={
                  isUnderwaterFx
                    ? 'Efek Underwater (Mendem) Aktif - Klik untuk mematikan'
                    : 'Aktifkan Efek Underwater (Mendem) - Bisa dikombinasikan dengan Slowed + Reverb'
                }
              >
                <span>🌊</span>
                <span className="hidden xl:inline">Mendem</span>
              </button>
            )}

            {/* Speed Button */}
            {onOpenSpeedModal && (
              <button
                onClick={onOpenSpeedModal}
                className="px-2.5 py-1 rounded-full bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d3e2f7] dark:border-[#283556] text-[11px] font-mono font-bold text-[#142247] dark:text-[#9ab3f5] hover:opacity-80 transition active:scale-95"
                title="Kecepatan Putar"
              >
                {playbackSpeed.toFixed(1)}x
              </button>
            )}

            {/* Queue Button */}
            {onOpenQueue && (
              <button
                onClick={onOpenQueue}
                className="p-2 rounded-full text-[#62779f] hover:text-[#142247] dark:hover:text-white hover:bg-[#edf3fd] dark:hover:bg-[#1a233b] transition active:scale-90"
                title="Antrean Putar"
              >
                <ListMusic className="w-4 h-4" />
              </button>
            )}

            {/* Realtime Synced Lyrics Button */}
            <button
              onClick={onOpenLyrics}
              className="p-2 rounded-full text-[#62779f] hover:text-[#142247] dark:hover:text-white hover:bg-[#edf3fd] dark:hover:bg-[#1a233b] transition active:scale-90"
              title="Lirik Sinkronisasi Realtime"
            >
              <Quote className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 pl-1">
              <button
                onClick={() => {
                  if (isMuted) {
                    onVolumeChange(0.8);
                    setIsMuted(false);
                  } else {
                    onVolumeChange(0);
                    setIsMuted(true);
                  }
                }}
                className="p-1 text-[#62779f] hover:text-[#142247] dark:hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  onVolumeChange(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 sm:w-20 h-1 bg-[#dce7f7] dark:bg-[#202942] rounded-lg cursor-pointer accent-[#2e498c] dark:accent-[#9ab3f5]"
              />
            </div>

            {/* Fullscreen Player Modal Expand */}
            <button
              onClick={onOpenPlayerModal}
              className="p-2 rounded-full text-[#62779f] hover:text-[#142247] dark:hover:text-white hover:bg-[#edf3fd] dark:hover:bg-[#1a233b] transition active:scale-90"
              title="Buka Layar Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
