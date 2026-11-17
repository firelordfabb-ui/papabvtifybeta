import React, { useState } from 'react';
import { Song, VisualizerMode } from '../types/music';
import { Visualizer } from './Visualizer';
import {
  X,
  Maximize2,
  Sliders,
  Sparkles,
  Waves,
  Disc,
  Activity,
  Flame,
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const FullscreenVisualizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  song,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev
}) => {
  const [mode, setMode] = useState<VisualizerMode>('spectrum');
  const [sensitivity, setSensitivity] = useState<number>(1.2);

  if (!isOpen || !song) return null;

  const modes: Array<{ id: VisualizerMode; label: string; icon: any }> = [
    { id: 'spectrum', label: 'Spectrum Bars', icon: Activity },
    { id: 'circular', label: 'Circular', icon: Disc },
    { id: 'waveform', label: 'Waveform', icon: Waves },
    { id: 'particles', label: 'Particles', icon: Sparkles },
    { id: 'ambient_glow', label: 'Ambient Glow', icon: Flame },
    { id: 'minimal_wave', label: 'Minimal', icon: Radio },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#08090d]/95 backdrop-blur-3xl flex flex-col justify-between p-6 sm:p-10 select-none animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-white">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Visualizer Sinematik PAPABVTIFY
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Analisis Spektrum Audio 60 FPS • {modes.find(m => m.id === mode)?.label}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white transition active:scale-90"
          title="Tutup Visualizer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Visualizer Canvas & Artwork Backdrop */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-6">
        {/* Soft Blurred Ambient Backdrop - Optimized for Intel HD Graphics */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
          <img
            src={song.thumbnail}
            alt=""
            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full object-cover blur-2xl opacity-25"
          />
        </div>

        {/* Center Canvas */}
        <div className="w-full max-w-4xl h-72 sm:h-96 flex items-center justify-center">
          <Visualizer
            isPlaying={isPlaying}
            mode={mode}
            sensitivity={sensitivity}
            width={860}
            height={380}
            className="w-full h-full"
            accentColor="#a855f7"
          />
        </div>

        {/* Now Playing Title Capsule */}
        <div className="mt-4 text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {song.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold">
            {song.artist}
          </p>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 z-20 pt-4 border-t border-white/[0.08]">
        {/* Mode Selector Carousel */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.06] border border-white/10 overflow-x-auto max-w-full">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-black shadow-lg shadow-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sensitivity Slider & Playback Buttons */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Sensitivitas:</span>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-white/20 rounded-lg cursor-pointer accent-indigo-400"
            />
            <span className="text-[11px] font-mono font-bold text-white min-w-7">
              {sensitivity.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              className="p-2 text-slate-300 hover:text-white transition active:scale-75"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={onPlayPause}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center active:scale-90 shadow-xl"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-black" />
              ) : (
                <Play className="w-5 h-5 fill-current text-black ml-0.5" />
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
      </div>
    </div>
  );
};
