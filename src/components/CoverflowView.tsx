import React, { useState } from 'react';
import { Song, SoundStyle, ChillAmbientSound, LyricsData } from '../types/music';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Quote,
  ListMusic,
  Volume2,
  VolumeX,
  X,
  Sliders,
  Sparkles,
  CloudRain,
  Flame,
  Disc,
  Maximize2
} from 'lucide-react';

interface Props {
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
  soundStyle: SoundStyle;
  onSoundStyleChange: (style: SoundStyle) => void;
  ambientSound: ChillAmbientSound;
  onAmbientSoundChange: (amb: ChillAmbientSound) => void;
  onOpenEQ: () => void;
  onOpenFullscreenLyrics: () => void;
  onClose: () => void;
  lyricsData: LyricsData | null;
}

export const CoverflowView: React.FC<Props> = ({
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
  soundStyle,
  onSoundStyleChange,
  ambientSound,
  onAmbientSoundChange,
  onOpenEQ,
  onOpenFullscreenLyrics,
  onClose,
  lyricsData
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isAmbientMenuOpen, setIsAmbientMenuOpen] = useState(false);

  const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  // 5 items for the coverflow fan
  const getCoverflowItems = () => {
    const total = songs.length;
    if (total === 0) return [];
    
    // Pick 5 items around safeIndex: -2, -1, 0, +1, +2
    const offsets = [-2, -1, 0, 1, 2];
    return offsets.map(offset => {
      const idx = (safeIndex + offset + total) % total;
      return {
        song: songs[idx],
        offset
      };
    });
  };

  const coverflowItems = getCoverflowItems();

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Active lyric line for subtle karaoke preview
  const activeLine = lyricsData?.lines?.slice().reverse().find(l => currentTime >= l.time);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 select-none overflow-hidden bg-gradient-to-b from-[#1b1006]/95 via-[#140d05]/95 to-[#0a0602]/98 backdrop-blur-3xl animate-fadeIn">
      {/* Dynamic warm ambient background glow matching Image 2 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-600/25 via-amber-700/15 to-transparent rounded-full blur-[140px]" />
      </div>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-20 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              Now Playing
            </span>
            <h2 className="text-sm font-extrabold text-white">papabvtify Coverflow 3D</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenFullscreenLyrics}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-400/30 transition shadow-lg"
            title="Buka Layar Penuh Lirik Sinkron"
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Lirik Sinkron Split</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
            title="Tutup Mode Coverflow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center: 3D Coverflow Carousel (Smooth 60fps Physics - Matching Reference Image 2) */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-auto z-10">
        <div className="relative w-full max-w-4xl h-80 flex items-center justify-center coverflow-stage">
          {coverflowItems.map(({ song, offset }) => {
            const isCenter = offset === 0;
            const isLeft = offset < 0;
            const isRight = offset > 0;
            const absOffset = Math.abs(offset);

            // 3D physics positioning
            let transform = '';
            let zIndex = 30 - absOffset * 10;
            let opacity = isCenter ? 1 : absOffset === 1 ? 0.65 : 0.35;
            let scale = isCenter ? 1.05 : absOffset === 1 ? 0.85 : 0.70;

            if (isCenter) {
              transform = 'translateX(0px) translateZ(60px) rotateY(0deg) scale(1.05)';
            } else if (isLeft) {
              const xPos = offset === -1 ? -210 : -360;
              transform = `translateX(${xPos}px) translateZ(-50px) rotateY(32deg) scale(${scale})`;
            } else if (isRight) {
              const xPos = offset === 1 ? 210 : 360;
              transform = `translateX(${xPos}px) translateZ(-50px) rotateY(-32deg) scale(${scale})`;
            }

            return (
              <div
                key={`${song.id}-${offset}`}
                onClick={() => onSelectSong(song)}
                className="absolute cursor-pointer origin-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-110"
                style={{
                  transform,
                  zIndex,
                  opacity
                }}
              >
                <div
                  className={`relative rounded-3xl overflow-hidden shadow-2xl border ${
                    isCenter
                      ? 'border-amber-400/60 shadow-[0_20px_50px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/30'
                      : 'border-white/10'
                  } w-60 h-72 md:w-64 md:h-80 bg-neutral-900 group`}
                >
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Reflection & Glass gradient overlay matching Image 2 */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                    <h3 className="text-sm font-extrabold text-white truncate drop-shadow">
                      {song.title}
                    </h3>
                    <p className="text-xs text-amber-300/85 truncate font-medium">
                      {song.artist}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Active Lyric Line Preview */}
        <div
          onClick={onOpenFullscreenLyrics}
          className="mt-6 h-9 text-center px-4 max-w-xl cursor-pointer group"
          title="Klik untuk membuka layar lirik penuh"
        >
          <p className="text-sm font-semibold text-amber-200/95 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover:text-amber-100 transition-all duration-300">
            {activeLine ? `“ ${activeLine.text} ”` : `Memutar ${currentSong?.title || ''}`}
          </p>
        </div>
      </div>

      {/* Bottom Floating Glass Capsule Player (Exact Match with Image 2) */}
      <div className="w-full max-w-3xl mx-auto z-30">
        <div className="relative rounded-full px-6 py-3.5 bg-gradient-to-r from-[#2a1a0d]/90 via-[#362211]/85 to-[#24150a]/90 backdrop-blur-2xl border border-amber-400/25 shadow-2xl shadow-amber-950/80 flex items-center justify-between gap-4">
          {/* Left Controls: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onPrev}
              className="p-2 text-white/70 hover:text-amber-400 transition active:scale-95"
              title="Lagu Sebelumnya"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shadow-white/30"
              title={isPlaying ? "Jeda" : "Putar"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current text-black" />
              ) : (
                <Play className="w-4 h-4 fill-current text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-2 text-white/70 hover:text-amber-400 transition active:scale-95"
              title="Lagu Berikutnya"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* Middle: Mini Glowing Album Art Capsule with Micro Progress */}
          <div className="flex-1 max-w-xs relative bg-black/40 border border-white/10 rounded-2xl p-2 flex items-center gap-3 overflow-hidden shadow-inner">
            {currentSong && (
              <>
                <img
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  className="w-9 h-9 rounded-xl object-cover shrink-0 shadow"
                />
                <div className="flex-1 truncate">
                  <h4 className="text-[11px] font-bold text-white truncate">
                    {currentSong.title}
                  </h4>
                  <p className="text-[10px] text-white/50 truncate">
                    {currentSong.artist}
                  </p>
                </div>
              </>
            )}

            {/* Micro Progress Line at bottom of capsule */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Right Controls: DSP, Ambient Mode, Lyrics, Queue, Volume */}
          <div className="flex items-center gap-2 shrink-0">
            {/* DSP Sound Style Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsStyleMenuOpen(!isStyleMenuOpen);
                  setIsAmbientMenuOpen(false);
                }}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition"
                title="Pilih Gaya Suara DSP"
              >
                DSP
              </button>
              {isStyleMenuOpen && (
                <div className="absolute bottom-11 right-0 w-44 bg-[#231508] border border-amber-400/30 rounded-2xl p-2 shadow-2xl space-y-1 z-50 text-xs">
                  {[
                    { key: 'normal', label: 'Original' },
                    { key: 'slowed_reverb', label: 'Slowed + Reverb' },
                    { key: 'lofi', label: 'Lo-Fi Chill' },
                    { key: 'nightcore', label: 'Nightcore' },
                    { key: 'eight_d', label: '8D Spatial' },
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => {
                        onSoundStyleChange(s.key as SoundStyle);
                        setIsStyleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl font-medium transition ${
                        soundStyle === s.key
                          ? 'bg-amber-500 text-black font-bold'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chill Ambient Mode Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAmbientMenuOpen(!isAmbientMenuOpen);
                  setIsStyleMenuOpen(false);
                }}
                className={`p-2 rounded-xl transition ${
                  ambientSound !== 'none'
                    ? 'text-cyan-400 bg-cyan-500/20'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Mode Ambient Santai (Hujan, Api, Vinyl)"
              >
                <CloudRain className="w-4 h-4" />
              </button>
              {isAmbientMenuOpen && (
                <div className="absolute bottom-11 right-0 w-44 bg-[#1b140c] border border-amber-400/30 rounded-2xl p-2 shadow-2xl space-y-1 z-50 text-xs">
                  {[
                    { key: 'none', label: 'Ambient Mati' },
                    { key: 'rain', label: '🌧️ Hujan (Rain)' },
                    { key: 'fireplace', label: '🔥 Api Unggun' },
                    { key: 'vinyl', label: '☕ Vinyl Vintage' },
                  ].map(a => (
                    <button
                      key={a.key}
                      onClick={() => {
                        onAmbientSoundChange(a.key as ChillAmbientSound);
                        setIsAmbientMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl font-medium transition ${
                        ambientSound === a.key
                          ? 'bg-amber-500 text-black font-bold'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* EQ Button */}
            <button
              onClick={onOpenEQ}
              title="Buka Equalizer"
              className="p-2 text-white/60 hover:text-amber-400 transition"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Lyrics Split Screen Button [ " ] as seen in Image 2 */}
            <button
              onClick={onOpenFullscreenLyrics}
              title="Buka Lirik Split Real-Time"
              className="p-2 text-white/60 hover:text-amber-400 transition"
            >
              <Quote className="w-4 h-4" />
            </button>

            {/* Playlist Queue Icon */}
            <button
              onClick={onClose}
              title="Kembali ke Daftar Lagu"
              className="p-2 text-white/60 hover:text-white transition"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Volume Toggle */}
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                onVolumeChange(isMuted ? 0.85 : 0);
              }}
              title="Atur Suara"
              className="p-2 text-white/60 hover:text-white transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Global Seek Bar for Coverflow */}
        <div className="flex items-center gap-3 pt-2.5 px-4">
          <span className="text-[10px] font-mono text-amber-400/80 w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-white/15 rounded-lg cursor-pointer accent-amber-400"
          />
          <span className="text-[10px] font-mono text-white/50 w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
