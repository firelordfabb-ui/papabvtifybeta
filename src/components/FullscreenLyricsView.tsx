import React, { useEffect, useRef, useState } from 'react';
import { Song, SoundStyle, ChillAmbientSound, LyricsData } from '../types/music';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Sparkles,
  CloudRain,
  Flame,
  Disc,
  Radio,
  Sliders
} from 'lucide-react';

interface Props {
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
  soundStyle: SoundStyle;
  onSoundStyleChange: (style: SoundStyle) => void;
  ambientSound: ChillAmbientSound;
  onAmbientSoundChange: (amb: ChillAmbientSound) => void;
  ambientVolume: number;
  onAmbientVolumeChange: (vol: number) => void;
  lyricsData: LyricsData | null;
  lyricsOffset: number;
  setLyricsOffset: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  onToggleLike: (song: Song) => void;
}

export const FullscreenLyricsView: React.FC<Props> = ({
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
  soundStyle,
  onSoundStyleChange,
  ambientSound,
  onAmbientSoundChange,
  ambientVolume,
  onAmbientVolumeChange,
  lyricsData,
  lyricsOffset,
  setLyricsOffset,
  onClose,
  onToggleLike
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const adjustedTime = currentTime + lyricsOffset;

  // Find active line index
  let activeIndex = -1;
  if (lyricsData?.lines && lyricsData.lines.length > 0) {
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (adjustedTime >= lyricsData.lines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth autoscroll to center active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

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
    { key: 'concert', label: 'Concert Hall' }
  ];

  const ambientPresets: { key: ChillAmbientSound; label: string; icon: any }[] = [
    { key: 'rain', label: 'Hujan (Rain)', icon: CloudRain },
    { key: 'fireplace', label: 'Api Unggun (Fire)', icon: Flame },
    { key: 'vinyl', label: 'Vinyl Hiss', icon: Disc }
  ];

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden select-none bg-[#090514] text-white animate-fadeIn">
      {/* Dynamic blurred ambient album glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <img
          src={song?.thumbnail}
          alt="Ambient Backdrop"
          className="w-full h-full object-cover filter blur-[120px] scale-125 transform-gpu"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/85" />
      </div>

      {/* Left Column: Track Info, Media Controls & Chill Modes (44% width) */}
      <div className="relative w-full lg:w-[44%] h-full flex flex-col justify-between p-8 sm:p-12 z-20 border-r border-white/10 backdrop-blur-2xl bg-black/30">
        {/* Top Bar: Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="group flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-pill text-xs font-bold text-white/80 hover:text-white transition shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-purple-300">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>papabvtify Karaoke Studio</span>
          </div>
        </div>

        {/* Center: Large Floating Album Cover & Song Details */}
        <div className="my-auto space-y-6 max-w-md mx-auto w-full">
          <div className="relative group mx-auto">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/15">
              <img
                src={song?.thumbnail}
                alt={song?.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Glowing aura under album cover */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-35 filter blur-2xl -z-10 pointer-events-none transition-all duration-700"
              style={{
                background: isPlaying
                  ? 'radial-gradient(circle, rgba(168,85,247,0.7) 0%, rgba(59,130,246,0) 70%)'
                  : 'transparent'
              }}
            />
          </div>

          <div className="flex items-start justify-between gap-4 pt-2">
            <div className="truncate">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate drop-shadow">
                {song?.title}
              </h1>
              <p className="text-sm sm:text-base text-purple-300/80 font-medium truncate mt-0.5">
                {song?.artist} • {song?.album || 'papabvtify Master'}
              </p>
            </div>

            <button
              onClick={() => song && onToggleLike(song)}
              className={`p-2.5 rounded-full glass-pill transition shrink-0 ${
                song?.liked ? 'text-pink-500 fill-pink-500' : 'text-white/60 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${song?.liked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Duration Seek Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-white/50 w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-white/20 rounded-lg cursor-pointer accent-purple-400"
              />
              <span className="text-xs font-mono text-white/50 w-8">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Media Playback Controls */}
          <div className="flex items-center justify-between pt-2">
            <button className="text-white/40 hover:text-white transition">
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onPrev}
              className="p-3 text-white/70 hover:text-white transition active:scale-95"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-[0_0_25px_rgba(255,255,255,0.4)]"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current text-black" />
              ) : (
                <Play className="w-6 h-6 fill-current text-black ml-1" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-3 text-white/70 hover:text-white transition active:scale-95"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            <button className="text-white/40 hover:text-white transition">
              <Repeat className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Section: DSP Sound Styles & Chill Ambient Selector */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          {/* DSP Sound Style Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-white/50 uppercase tracking-wider">
              <span>Gaya Suara DSP</span>
              <span className="text-purple-400 font-mono">{soundStyle.replace('_', ' ')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {soundStyles.map(s => (
                <button
                  key={s.key}
                  onClick={() => onSoundStyleChange(s.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    soundStyle === s.key
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                      : 'bg-white/5 hover:bg-white/15 text-white/70'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chill Ambient Mode Buttons & Volume Slider */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px] font-bold text-white/50 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mode Chill Ambient</span>
              </div>
              {ambientSound !== 'none' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-300 font-mono">Vol {(ambientVolume * 100).toFixed(0)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={ambientVolume}
                    onChange={(e) => onAmbientVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded accent-cyan-400"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ambientPresets.map(a => {
                const Icon = a.icon;
                const isActive = ambientSound === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => onAmbientSoundChange(isActive ? 'none' : a.key)}
                    className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 hover:bg-white/10 text-white/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{a.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Full-Height Synchronized Karaoke Lyrics (56% width) */}
      <div className="flex-1 h-full flex flex-col p-8 sm:p-14 relative z-20">
        {/* Top Bar for Lyrics info & Calibration */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Lirik Real-Time</h2>
              <p className="text-[11px] text-white/40">
                {lyricsData?.source || 'LRCLIB High-Accuracy Sync'}
              </p>
            </div>
          </div>

          {/* Sync Calibration Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLyricsOffset(prev => prev - 0.2)}
              title="Lirik lebih lambat (-0.2s)"
              className="p-1.5 rounded-xl glass-pill text-xs text-white/70 hover:text-white flex items-center gap-1"
            >
              <Rewind className="w-3.5 h-3.5" />
              <span>-0.2s</span>
            </button>
            <span className="text-xs font-mono text-purple-300 min-w-10 text-center">
              {lyricsOffset >= 0 ? `+${lyricsOffset.toFixed(1)}s` : `${lyricsOffset.toFixed(1)}s`}
            </span>
            <button
              onClick={() => setLyricsOffset(prev => prev + 0.2)}
              title="Lirik lebih cepat (+0.2s)"
              className="p-1.5 rounded-xl glass-pill text-xs text-white/70 hover:text-white flex items-center gap-1"
            >
              <span>+0.2s</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Synchronized Lyrics Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto py-24 space-y-10 scroll-smooth pr-6 select-none"
        >
          {!lyricsData || lyricsData.lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-sm font-medium">Sedang menyinkronkan lirik lagu secara realtime...</p>
            </div>
          ) : (
            lyricsData.lines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={`${line.time}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(line.time)}
                  className={`cursor-pointer transition-all duration-500 ease-out py-1 group ${
                    isActive
                      ? 'text-3xl sm:text-4xl font-extrabold text-white scale-[1.02] origin-left drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]'
                      : isPast
                      ? 'text-xl sm:text-2xl font-bold text-white/40 hover:text-white/80'
                      : 'text-xl sm:text-2xl font-bold text-white/20 hover:text-white/60'
                  }`}
                >
                  {/* If active and words exist, render smooth karaoke swipe */}
                  {isActive && line.words && line.words.length > 0 ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {line.words.map((w, wIdx) => {
                        const wordDuration = Math.max(0.15, w.endTime - w.startTime);
                        const wordProgress = Math.min(
                          100,
                          Math.max(0, ((adjustedTime - w.startTime) / wordDuration) * 100)
                        );

                        return (
                          <span
                            key={wIdx}
                            className="karaoke-word transition-all"
                            style={{
                              ['--progress' as any]: `${wordProgress}%`
                            }}
                          >
                            {w.text}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span>{line.text}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
