import React, { useState } from 'react';
import { EQ_FREQUENCIES, EQ_PRESETS, AudioEngine } from '../services/audioEngine';
import { EQPreset } from '../types/music';
import { Sliders, X, RotateCcw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EqualizerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentPreset, setCurrentPreset] = useState<string>('Flat (Datar)');
  const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: EQPreset) => {
    setCurrentPreset(preset.name);
    setGains([...preset.gains]);
    AudioEngine.getInstance().setEQPreset(preset);
  };

  const handleGainChange = (index: number, val: number) => {
    const updated = [...gains];
    updated[index] = val;
    setGains(updated);
    setCurrentPreset('Kustom');
    AudioEngine.getInstance().setEQBand(index, val);
  };

  const resetFlat = () => {
    handlePresetSelect(EQ_PRESETS[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-2xl liquid-glass rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl border border-white/10 animate-float">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Equalizer 10 Pita (Pro DSP)</h2>
              <p className="text-xs text-white/50">Sesuaikan frekuensi suara untuk speaker atau headphone favoritmu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60 font-medium">
            <span>Pilihan Preset:</span>
            <button
              onClick={resetFlat}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Datar</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EQ_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => handlePresetSelect(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentPreset === p.name
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'liquid-glass-pill text-white/70 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 10 Band Vertical Sliders */}
        <div className="grid grid-cols-10 gap-2 pt-4 pb-2 items-center text-center">
          {EQ_FREQUENCIES.map((freq, i) => (
            <div key={freq} className="flex flex-col items-center gap-3">
              <span className="text-[11px] font-mono text-white/70">
                {gains[i] > 0 ? `+${gains[i]}` : gains[i]}dB
              </span>

              {/* Vertical Slider Track */}
              <div className="relative h-44 w-7 flex items-center justify-center">
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={gains[i]}
                  onChange={(e) => handleGainChange(i, parseInt(e.target.value, 10))}
                  className="w-40 -rotate-90 origin-center cursor-pointer"
                />
              </div>

              {/* Frequency Label */}
              <span className="text-[10px] font-medium text-white/40">
                {freq >= 1000 ? `${freq / 1000}k` : freq}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 shadow-lg shadow-indigo-500/25 transition"
          >
            Selesai & Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
