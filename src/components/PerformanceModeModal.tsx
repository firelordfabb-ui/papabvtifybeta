import React from 'react';
import { PerformanceMode } from '../types/music';
import {
  Zap,
  X,
  BatteryCharging,
  Cpu,
  Sparkles,
  Check,
  ShieldCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentMode: PerformanceMode;
  onModeSelect: (mode: PerformanceMode) => void;
}

export const PerformanceModeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentMode,
  onModeSelect
}) => {
  if (!isOpen) return null;

  const modes: Array<{ id: PerformanceMode; title: string; subtitle: string; desc: string; icon: any }> = [
    {
      id: 'high',
      title: 'High Quality (Kualitas Tertinggi)',
      subtitle: '60 FPS Visualizer & Full Blur',
      desc: 'Efek Liquid Glass 36px, partikel dinamis, transisi halus, dan animasi spektrum penuh.',
      icon: Sparkles
    },
    {
      id: 'balanced',
      title: 'Balanced (Seimbang - Rekomendasi)',
      subtitle: 'Performa Optimal & Efisien',
      desc: 'Keseimbangan sempurna antara estetika Liquid Glass dan kehalusan frame rate.',
      icon: Cpu
    },
    {
      id: 'saver',
      title: 'Battery Saver (Hemat Daya)',
      subtitle: 'Ringan untuk Spek Rendah',
      desc: 'Mereduksi backdrop blur, membatasi visualizer ke mode minimal, hemat baterai.',
      icon: BatteryCharging
    },
    {
      id: 'auto',
      title: 'Auto Adaptive (Otomatis)',
      subtitle: 'Menyesuaikan Beban Perangkat',
      desc: 'Sistem otomatis memantau performa perangkat dan menyesuaikan kualitas secara adaptif.',
      icon: Zap
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-2xl animate-fadeIn select-none">
      <div className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-7 space-y-6 border border-white/[0.15] shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Mode Performa Adaptif</h3>
              <p className="text-xs text-slate-400">Optimalisasi FPS & Konsumsi Daya</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = currentMode === m.id;

            return (
              <div
                key={m.id}
                onClick={() => {
                  onModeSelect(m.id);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-white/[0.12] border-emerald-400/50 shadow-lg shadow-emerald-500/10'
                    : 'liquid-glass border-white/[0.06] hover:border-white/15'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/[0.06] text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {m.title}
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                      {m.subtitle}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 mt-1 shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Kualitas audio tidak pernah dikurangi pada mode hemat daya apapun.</span>
        </div>
      </div>
    </div>
  );
};
