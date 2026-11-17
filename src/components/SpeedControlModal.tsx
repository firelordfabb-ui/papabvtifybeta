import React, { useState } from 'react';
import { AudioEngine } from '../services/audioEngine';
import { Gauge, X, RotateCcw, Check, Music2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSpeed: number;
  onSpeedChange: (speed: number, preservePitch: boolean) => void;
}

export const SpeedControlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSpeed,
  onSpeedChange
}) => {
  const [speed, setSpeed] = useState<number>(currentSpeed);
  const [preservePitch, setPreservePitch] = useState<boolean>(true);

  if (!isOpen) return null;

  const presets = [0.5, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];

  const handleSelect = (s: number) => {
    setSpeed(s);
    onSpeedChange(s, preservePitch);
  };

  const handleTogglePitch = (val: boolean) => {
    setPreservePitch(val);
    onSpeedChange(speed, val);
  };

  const handleReset = () => {
    setSpeed(1.0);
    setPreservePitch(true);
    onSpeedChange(1.0, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fadeIn select-none">
      <div className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-7 space-y-6 border border-white/[0.15] shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Kecepatan Putar Audio</h3>
              <p className="text-xs text-slate-400">Speed Up & Slowed Playback Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Speed Big Digital Display */}
        <div className="text-center py-2 space-y-1">
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_24px_rgba(168,85,247,0.35)]">
            {speed.toFixed(2)}x
          </div>
          <span className="text-xs text-slate-400 font-semibold block">
            {speed === 1.0 ? 'Kecepatan Normal (100%)' : speed < 1.0 ? 'Slowed Reverb Mode' : 'Sped Up / Nightcore Mode'}
          </span>
        </div>

        {/* Continuous Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={speed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSpeed(val);
              onSpeedChange(val, preservePitch);
            }}
            className="w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-purple-400"
          />
        </div>

        {/* Preset Buttons Grid */}
        <div className="grid grid-cols-5 gap-2">
          {presets.map((p) => {
            const isActive = Math.abs(speed - p) < 0.01;
            return (
              <button
                key={p}
                onClick={() => handleSelect(p)}
                className={`py-2 rounded-xl font-mono text-xs font-bold transition active:scale-95 ${
                  isActive
                    ? 'bg-white text-black shadow-md font-black'
                    : 'liquid-glass-pill text-slate-300 hover:text-white'
                }`}
              >
                {p}x
              </button>
            );
          })}
        </div>

        {/* Pitch Lock Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Music2 className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-xs font-bold text-white block">Kunci Nada (Pitch Lock)</span>
              <span className="text-[10px] text-slate-400 block">Pertahankan nada vokal asli saat kecepatan berubah</span>
            </div>
          </div>
          <button
            onClick={() => handleTogglePitch(!preservePitch)}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              preservePitch ? 'bg-purple-600' : 'bg-white/15'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
              preservePitch ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Normal (1.0x)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-slate-200 transition active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
