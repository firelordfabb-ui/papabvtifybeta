import React from 'react';
import { UnderwaterConfig, UnderwaterPreset } from '../types/music';
import { UNDERWATER_PRESETS, UnderwaterAudio } from '../services/underwaterService';
import {
  Waves,
  X,
  Volume2,
  Sliders,
  Sparkles,
  Eye,
  Sun,
  ShieldAlert,
  Check,
  Compass,
  Cpu
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: UnderwaterConfig;
  onChangeConfig: (newConfig: UnderwaterConfig) => void;
  isUnderwaterFx?: boolean;
  onToggleUnderwaterFx?: () => void;
  underwaterCutoff?: number;
  onUnderwaterCutoffChange?: (cutoff: number) => void;
}

export const UnderwaterControlsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  isUnderwaterFx = false,
  onToggleUnderwaterFx,
  underwaterCutoff = 480,
  onUnderwaterCutoffChange
}) => {
  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    const updated: UnderwaterConfig = {
      ...config,
      enabled: !config.enabled
    };
    onChangeConfig(updated);
    if (updated.enabled) {
      UnderwaterAudio.start(updated.preset, updated.ambientVolume);
    } else {
      UnderwaterAudio.stop();
    }
  };

  const handleSelectPreset = (preset: UnderwaterPreset) => {
    const updated = { ...config, preset };
    onChangeConfig(updated);
    if (config.enabled) {
      UnderwaterAudio.setPreset(preset);
    }
  };

  const handleVolumeChange = (vol: number) => {
    const updated = { ...config, ambientVolume: vol };
    onChangeConfig(updated);
    if (config.enabled) {
      UnderwaterAudio.setVolume(vol);
    }
  };

  const handleIntensityChange = (intensity: number) => {
    onChangeConfig({ ...config, visualIntensity: intensity });
  };

  const handleToggleBubbles = () => {
    onChangeConfig({ ...config, showBubbles: !config.showBubbles });
    if (!config.showBubbles && config.enabled) {
      UnderwaterAudio.playBubblePop();
    }
  };

  const handleToggleLightRays = () => {
    onChangeConfig({ ...config, showLightRays: !config.showLightRays });
  };

  const handleToggleReduceMotion = () => {
    onChangeConfig({ ...config, reduceMotion: !config.reduceMotion });
  };

  const handleToggleLowPerf = () => {
    onChangeConfig({ ...config, lowPerformanceMode: !config.lowPerformanceMode });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030914]/70 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white/95 dark:bg-[#0c162d] rounded-3xl p-6 sm:p-7 flex flex-col border border-[#A8C5FF] dark:border-[#1E3A6E] shadow-2xl text-[#142247] dark:text-white animate-scaleUp overflow-hidden">
        
        {/* Soft Ambient Aqua Glow Top Corner */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-[#00b4d8]/20 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dce7f7] dark:border-[#192b52] shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#e6f4fc] dark:bg-[#102447] text-[#0077b6] dark:text-[#48cae4] border border-[#bde0fe] dark:border-[#1E3A6E] flex items-center justify-center shadow-sm">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-[#142247] dark:text-white">
                  Underwater Mode
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#00b4d8]/15 text-[#0077b6] dark:text-[#48cae4] border border-[#00b4d8]/30">
                  ATMOSFIR LAUT
                </span>
              </div>
              <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] font-medium mt-0.5">
                Pengalaman mendengarkan musik di kedalaman samudra yang tenang & magis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#edf3fd] dark:hover:bg-[#192b52] text-[#6b81a8] hover:text-[#142247] dark:hover:text-white transition"
            title="Tutup Pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1 text-xs font-medium">
          
          {/* PRIMARY: Underwater Audio DSP (Muffled / Mendem Effect on Music) */}
          {onToggleUnderwaterFx && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 dark:bg-cyan-950/40 border-2 border-cyan-500/30 flex flex-col gap-3 shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500 text-white dark:bg-cyan-400 dark:text-slate-950 flex items-center justify-center font-bold text-lg shadow-sm">
                    🌊
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-cyan-700 dark:text-cyan-300">
                        Efek Audio Musik: Terendam / Mendem (DSP)
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-200">
                        VIRAL FX
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Bikin lagu bersuara mendem seperti terendam air. <strong>Dapat digabung dengan Slowed + Reverb!</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={onToggleUnderwaterFx}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isUnderwaterFx ? 'bg-cyan-600 dark:bg-cyan-400' : 'bg-[#c5d6ee] dark:bg-[#1b2b4d]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isUnderwaterFx ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isUnderwaterFx && onUnderwaterCutoffChange && (
                <div className="pt-2 border-t border-cyan-500/25 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono font-bold text-cyan-800 dark:text-cyan-200 shrink-0">
                    Frekuensi Potong: {underwaterCutoff} Hz
                  </span>
                  <input
                    type="range"
                    min={200}
                    max={900}
                    step={20}
                    value={underwaterCutoff}
                    onChange={(e) => onUnderwaterCutoffChange(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-cyan-900/40 rounded-lg cursor-pointer accent-cyan-500"
                  />
                  <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 shrink-0">
                    {underwaterCutoff <= 350 ? 'Palung Dalam' : underwaterCutoff >= 650 ? 'Dangkal' : 'Mendem Standar'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Secondary: Underwater Visual Background Mode Switch */}
          <div className="p-4 rounded-2xl bg-[#f0f7fe] dark:bg-[#111f3d] border border-[#cbe3fb] dark:border-[#1E3A6E] flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-extrabold text-[#142247] dark:text-white block">
                Status Underwater Mode
              </span>
              <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] mt-0.5">
                Aktifkan visual bawah laut dan suara ombak kedalaman samudra secara bersamaan.
              </p>
            </div>

            <button
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.enabled ? 'bg-[#0077b6] dark:bg-[#00b4d8]' : 'bg-[#c5d6ee] dark:bg-[#1b2b4d]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 5 Underwater Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#5d729c] dark:text-[#8fa1c4] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#0077b6] dark:text-[#48cae4]" />
              Pilih Karakter Kedalaman Laut (Presets)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {UNDERWATER_PRESETS.map((p) => {
                const isSelected = config.preset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-white dark:bg-[#14274d] border-[#0077b6] dark:border-[#48cae4] shadow-md ring-2 ring-[#0077b6]/20'
                        : 'bg-white/80 dark:bg-[#0f1d38] border-[#dce7f7] dark:border-[#1E3A6E] hover:border-[#90e0ef]'
                    }`}
                  >
                    {/* Visual Color Dot */}
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 shadow-sm border border-white/50"
                      style={{ background: p.colors.surface }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-[#142247] dark:text-white text-xs truncate">
                          {p.name}
                        </h4>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#0077b6] dark:text-[#48cae4] shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4] line-clamp-2 mt-0.5 leading-snug">
                        {p.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audio & Visual Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Ambient Sound Volume */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#101e3b] border border-[#dce7f7] dark:border-[#1E3A6E] space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#142247] dark:text-white">
                  <Volume2 className="w-3.5 h-3.5 text-[#0077b6] dark:text-[#48cae4]" />
                  Volume Suara Laut
                </span>
                <span className="font-mono text-[11px] font-bold text-[#0077b6] dark:text-[#48cae4]">
                  {Math.round(config.ambientVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.ambientVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-[#0077b6] dark:accent-[#48cae4] cursor-pointer"
              />
              <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4]">
                Audio prosedural tanpa putus, tidak membebani memori.
              </p>
            </div>

            {/* Visual Intensity */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#101e3b] border border-[#dce7f7] dark:border-[#1E3A6E] space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#142247] dark:text-white">
                  <Eye className="w-3.5 h-3.5 text-[#0077b6] dark:text-[#48cae4]" />
                  Intensitas Visual
                </span>
                <span className="font-mono text-[11px] font-bold text-[#0077b6] dark:text-[#48cae4]">
                  {Math.round(config.visualIntensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={config.visualIntensity}
                onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                className="w-full accent-[#0077b6] dark:accent-[#48cae4] cursor-pointer"
              />
              <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4]">
                Kontrol kepekatan gradasi dan partikel cahaya air.
              </p>
            </div>
          </div>

          {/* Toggle Switches (Bubbles, Caustics, Performance) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#101e3b] border border-[#dce7f7] dark:border-[#1E3A6E] space-y-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#5d729c] dark:text-[#8fa1c4] block">
              Efek Visual & Kinerja
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Gelembung Udara */}
              <button
                type="button"
                onClick={handleToggleBubbles}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                  config.showBubbles
                    ? 'border-[#0077b6] bg-[#0077b6]/5 text-[#142247] dark:text-white'
                    : 'border-[#dce7f7] dark:border-[#192b52] text-[#5d729c] dark:text-[#8fa1c4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0077b6] dark:text-[#48cae4]" />
                  <span className="text-xs font-bold">Gelembung Udara</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${config.showBubbles ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {config.showBubbles ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Sinar Matahari / Caustics */}
              <button
                type="button"
                onClick={handleToggleLightRays}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                  config.showLightRays
                    ? 'border-[#0077b6] bg-[#0077b6]/5 text-[#142247] dark:text-white'
                    : 'border-[#dce7f7] dark:border-[#192b52] text-[#5d729c] dark:text-[#8fa1c4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#0077b6] dark:text-[#48cae4]" />
                  <span className="text-xs font-bold">Sinar Caustics</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${config.showLightRays ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {config.showLightRays ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Kurangi Gerakan */}
              <button
                type="button"
                onClick={handleToggleReduceMotion}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                  config.reduceMotion
                    ? 'border-[#0077b6] bg-[#0077b6]/5 text-[#142247] dark:text-white'
                    : 'border-[#dce7f7] dark:border-[#192b52] text-[#5d729c] dark:text-[#8fa1c4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#0077b6] dark:text-[#48cae4]" />
                  <span className="text-xs font-bold">Kurangi Gerakan</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${config.reduceMotion ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {config.reduceMotion ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Low Performance Mode (Intel HD 4400 friendly) */}
              <button
                type="button"
                onClick={handleToggleLowPerf}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                  config.lowPerformanceMode
                    ? 'border-[#0077b6] bg-[#0077b6]/5 text-[#142247] dark:text-white'
                    : 'border-[#dce7f7] dark:border-[#192b52] text-[#5d729c] dark:text-[#8fa1c4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0077b6] dark:text-[#48cae4]" />
                  <span className="text-xs font-bold">Mode Hemat GPU</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${config.lowPerformanceMode ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {config.lowPerformanceMode ? 'AKTIF' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#dce7f7] dark:border-[#192b52] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4]">
            Efek otomatis jeda saat aplikasi di latar belakang.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#0077b6] hover:bg-[#023e8a] dark:bg-[#00b4d8] dark:hover:bg-[#48cae4] text-white dark:text-[#021329] font-black text-xs transition active:scale-95 shadow-md cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
