import React, { useState } from 'react';
import { SleepTimerState } from '../types/music';
import {
  Moon,
  X,
  Clock,
  VolumeX,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sleepTimer: SleepTimerState;
  onSetTimer: (minutes: number, fadeout: boolean) => void;
  onCancelTimer: () => void;
}

export const SleepTimerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sleepTimer,
  onSetTimer,
  onCancelTimer
}) => {
  const [customMinutes, setCustomMinutes] = useState<string>('25');
  const [fadeout, setFadeout] = useState<boolean>(true);

  if (!isOpen) return null;

  const presets = [5, 10, 15, 30, 45, 60];

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleApplyPreset = (mins: number) => {
    onSetTimer(mins, fadeout);
    onClose();
  };

  const handleApplyCustom = () => {
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      onSetTimer(mins, fadeout);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-2xl animate-fadeIn select-none">
      <div className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-7 space-y-6 border border-white/[0.15] shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Pengatur Waktu Tidur</h3>
              <p className="text-xs text-slate-400">Sleep Timer Otomatis dengan Fade-Out</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Timer Display if Running */}
        {sleepTimer.active ? (
          <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-3">
            <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest block">
              Musik Berhenti Dalam
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
              {formatCountdown(sleepTimer.remainingSeconds)}
            </div>
            <p className="text-[11px] text-slate-400">
              {sleepTimer.fadeout ? 'Fade-out halus 15 detik sebelum berhenti aktif' : 'Musik akan langsung dihentikan'}
            </p>
            <button
              onClick={onCancelTimer}
              className="mt-2 px-5 py-2 rounded-xl bg-red-600/30 border border-red-500/40 text-red-200 text-xs font-bold hover:bg-red-600/50 transition active:scale-95"
            >
              Batalkan Pengatur Waktu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Pilih Durasi Cepat:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleApplyPreset(mins)}
                    className="py-2.5 rounded-xl liquid-glass-pill text-xs font-bold text-white hover:bg-white/[0.15] transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{mins} Menit</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Minutes Input */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <span className="text-xs font-semibold text-slate-300 block">
                Atur Waktu Kustom:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-24 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-center font-mono font-bold text-white focus:outline-none focus:border-indigo-400"
                />
                <span className="text-xs text-slate-400 font-semibold">Menit</span>
                <button
                  onClick={handleApplyCustom}
                  className="flex-1 py-2 rounded-xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-slate-200 transition active:scale-95"
                >
                  Aktifkan Timer
                </button>
              </div>
            </div>

            {/* Fade-Out Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <VolumeX className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Fade-out Halus</span>
                  <span className="text-[10px] text-slate-400 block">Menurunkan volume perlahan 15 detik terakhir</span>
                </div>
              </div>
              <button
                onClick={() => setFadeout(!fadeout)}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${
                  fadeout ? 'bg-indigo-600' : 'bg-white/15'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                  fadeout ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
