import React, { useState } from 'react';
import { Song, SoundStyle } from '../types/music';
import { Visualizer } from './Visualizer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Sliders,
  Sparkles,
  Music2,
  Minimize2
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
  soundStyle: SoundStyle;
  onSoundStyleChange: (style: SoundStyle) => void;
  onOpenEQ: () => void;
  onToggleLyrics: () => void;
  isLyricsOpen: boolean;
  onToggleMini: () => void;
  onToggleLike: (song: Song) => void;
}

export const PlayerControls: React.FC<Props> = ({
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
  soundStyle,
  onSoundStyleChange,
  onOpenEQ,
  onToggleLyrics,
  isLyricsOpen,
  onToggleMini,
  onToggleLike
}) => {
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const soundStyles: { key: SoundStyle; label: string; icon: string }[] = [
    { key: 'normal', label: 'Normal DSP', icon: '🎵' },
    { key: 'slowed_reverb', label: 'Slowed + Reverb', icon: '🌌' },
    { key: 'sped_up', label: 'Sped Up (1.25x)', icon: '⚡' },
    { key: 'nightcore', label: 'Nightcore (1.35x)', icon: '✨' },
    { key: 'lofi', label: 'Lo-Fi Tape', icon: '☕' },
    { key: 'eight_d', label: '8D Spatial Audio', icon: '🎧' },
    { key: 'concert', label: 'Konser Akustik', icon: '🏛️' }
  ];

  const currentStyleObj = soundStyles.find(s => s.key === soundStyle) || soundStyles[0];

  return (
    <div className="relative h-24 papabieo-island px-6 flex items-center justify-between z-30 select-none">
      {/* Left: Song Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[220px]">
        {currentSong ? (
          <>
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-xl group shrink-0 border border-white/10">
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-white truncate hover:text-cyan-400 cursor-pointer transition">
                {currentSong.title}
              </span>
              <span className="text-[11px] text-white/50 truncate font-medium">
                {currentSong.artist}
              </span>
            </div>
            <button
              onClick={() => onToggleLike(currentSong)}
              className={`p-2 rounded-full transition ${
                currentSong.liked
                  ? 'text-pink-500 fill-pink-500 hover:scale-110'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentSong.liked ? 'fill-current' : ''}`} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-white/40">
            <Music2 className="w-8 h-8 text-cyan-400/50" />
            <span className="text-xs">Pilih lagu untuk memutar</span>
          </div>
        )}
      </div>

      {/* Middle: Controls & Progress Bar */}
      <div className="flex flex-col items-center gap-2 max-w-xl w-2/4">
        {/* Buttons & Sound Style Picker */}
        <div className="flex items-center gap-5">
          {/* Sound Style Picker Button */}
          <div className="relative">
            <button
              onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold papabieo-pill hover:border-cyan-400 text-cyan-300 transition"
              title="Pilih Gaya Suara DSP papabieo"
            >
              <span>{currentStyleObj.icon}</span>
              <span className="hidden sm:inline">{currentStyleObj.label}</span>
            </button>

            {/* Dropdown Menu */}
            {isStyleMenuOpen && (
              <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-52 papabieo-glass rounded-2xl p-2 shadow-2xl border border-white/10 space-y-1 z-50 animate-float">
                {soundStyles.map(st => (
                  <button
                    key={st.key}
                    onClick={() => {
                      onSoundStyleChange(st.key);
                      setIsStyleMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                      soundStyle === st.key
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{st.icon}</span>
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="text-white/40 hover:text-white transition">
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            className="text-white/70 hover:text-cyan-400 hover:scale-110 transition active:scale-95"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Primary Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shadow-violet-500/30"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current text-white" />
            ) : (
              <Play className="w-5 h-5 fill-current text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="text-white/70 hover:text-cyan-400 hover:scale-110 transition active:scale-95"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button className="text-white/40 hover:text-white transition">
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Progress Slider */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-cyan-400/80 w-9 text-right font-medium">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/15 rounded-lg cursor-pointer accent-cyan-400"
            />
          </div>
          <span className="text-[11px] font-mono text-white/50 w-9 font-medium">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Audio Visualizer, Equalizer, Lyrics & Volume */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[220px]">
        {/* Real-time spectrum visualizer */}
        <div className="hidden xl:block">
          <Visualizer isPlaying={isPlaying} />
        </div>

        {/* 10-Band EQ button */}
        <button
          onClick={onOpenEQ}
          title="Buka Equalizer 10 Pita"
          className="p-2.5 rounded-xl text-white/60 hover:text-cyan-400 hover:bg-white/10 transition"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Lyrics Toggle button */}
        <button
          onClick={onToggleLyrics}
          title="Tampilkan Lirik Karaoke"
          className={`p-2.5 rounded-xl transition ${
            isLyricsOpen
              ? 'text-cyan-300 bg-cyan-500/20 shadow-md shadow-cyan-500/15'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Mini Player Floater button */}
        <button
          onClick={onToggleMini}
          title="Mode Mini Player"
          className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 pl-2">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              onVolumeChange(isMuted ? 0.8 : 0);
            }}
            className="text-white/60 hover:text-white transition"
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
            className="w-20 h-1.5 bg-white/20 rounded-lg cursor-pointer accent-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};
