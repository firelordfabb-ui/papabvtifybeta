import React, { useState, useEffect } from 'react';
import { EQ_FREQUENCIES, EQ_PRESETS, UNDERWATER_DSP_PRESETS, AudioEngine } from '../services/audioEngine';
import { StorageService } from '../services/storage';
import { AudioLabConfig, EQPreset, UnderwaterDSPParams, UnderwaterPresetName, EffectCombination } from '../types/music';
import {
  Sliders,
  Sparkles,
  Volume2,
  Waves,
  ShieldCheck,
  RotateCcw,
  Plus,
  Trash2,
  Radio,
  Check,
  Disc3,
  Layers,
  Activity
} from 'lucide-react';

export const AudioLabView: React.FC = () => {
  const [config, setConfig] = useState<AudioLabConfig>(() => {
    const base = StorageService.getAudioLabConfig();
    const storedFx = StorageService.getUnderwaterFx();
    return {
      ...base,
      underwaterFxEnabled: base.underwaterFxEnabled ?? storedFx.enabled,
      underwaterCutoff: base.underwaterCutoff ?? storedFx.cutoff
    };
  });
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [activeTabSection, setActiveTabSection] = useState<'eq' | 'bass' | 'spatial' | 'underwater' | 'preamp'>('eq');

  const audioEngine = AudioEngine.getInstance();
  const [underwaterParams, setUnderwaterParamsState] = useState<UnderwaterDSPParams>(() => audioEngine.getUnderwaterParams());
  const [activeCombo, setActiveCombo] = useState<EffectCombination>(() => audioEngine.getActiveEffectCombination());
  const [selectedPreset, setSelectedPreset] = useState<UnderwaterPresetName>('deep_underwater');

  // Apply stored config on initial mount
  useEffect(() => {
    audioEngine.initContext();
    config.eqGains.forEach((gain, idx) => audioEngine.setEQBand(idx, gain));
    audioEngine.setBassBooster(config.bassBoostEnabled, config.bassBoostIntensity);
    audioEngine.setSpatialAudio(config.spatialAudioEnabled, config.spatialAudioIntensity);
    audioEngine.setPreamp(config.preampGain);
    audioEngine.setSoftClipping(config.softClipping);
    audioEngine.setVolumeNormalization(config.volumeNormalization);
    audioEngine.setUnderwaterEffect(!!config.underwaterFxEnabled, config.underwaterCutoff || 480);
  }, []);

  // Update storage whenever config changes
  const updateConfig = (newConfig: AudioLabConfig) => {
    setConfig(newConfig);
    StorageService.saveAudioLabConfig(newConfig);
  };

  // Equalizer handlers
  const handleBandChange = (index: number, val: number) => {
    const updatedGains = [...config.eqGains];
    updatedGains[index] = val;
    audioEngine.setEQBand(index, val);

    updateConfig({
      ...config,
      eqGains: updatedGains,
      activePreset: 'Kustom'
    });
  };

  const handleSelectPreset = (preset: EQPreset) => {
    audioEngine.setEQPreset(preset);
    updateConfig({
      ...config,
      eqGains: [...preset.gains],
      activePreset: preset.name
    });
  };

  const handleResetEQ = () => {
    audioEngine.resetEQ();
    updateConfig({
      ...config,
      eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      activePreset: 'Flat'
    });
  };

  const handleSaveCustomPreset = () => {
    if (!customPresetName.trim()) return;
    const newPreset: EQPreset = {
      name: customPresetName.trim(),
      gains: [...config.eqGains],
      isCustom: true
    };
    const updatedCustom = [...config.customPresets.filter(p => p.name !== newPreset.name), newPreset];
    updateConfig({
      ...config,
      activePreset: newPreset.name,
      customPresets: updatedCustom
    });
    setCustomPresetName('');
    setIsSavingCustom(false);
  };

  const handleDeleteCustomPreset = (name: string) => {
    const updatedCustom = config.customPresets.filter(p => p.name !== name);
    updateConfig({
      ...config,
      activePreset: config.activePreset === name ? 'Flat' : config.activePreset,
      customPresets: updatedCustom
    });
  };

  // Bass Booster handlers
  const handleToggleBassBoost = (enabled: boolean) => {
    audioEngine.setBassBooster(enabled, config.bassBoostIntensity);
    updateConfig({ ...config, bassBoostEnabled: enabled });
  };

  const handleBassIntensityChange = (val: number) => {
    audioEngine.setBassBooster(config.bassBoostEnabled, val);
    updateConfig({ ...config, bassBoostIntensity: val });
  };

  // Spatial Audio handlers
  const handleToggleSpatial = (enabled: boolean) => {
    audioEngine.setSpatialAudio(enabled, config.spatialAudioIntensity);
    updateConfig({ ...config, spatialAudioEnabled: enabled });
  };

  const handleSpatialIntensityChange = (val: number) => {
    audioEngine.setSpatialAudio(config.spatialAudioEnabled, val);
    updateConfig({ ...config, spatialAudioIntensity: val });
  };

  // Preamp & Soft Clipping handlers
  const handlePreampChange = (val: number) => {
    audioEngine.setPreamp(val);
    updateConfig({ ...config, preampGain: val });
  };

  const handleToggleSoftClipping = (enabled: boolean) => {
    audioEngine.setSoftClipping(enabled);
    updateConfig({ ...config, softClipping: enabled });
  };

  const handleToggleNormalization = (enabled: boolean) => {
    audioEngine.setVolumeNormalization(enabled);
    updateConfig({ ...config, volumeNormalization: enabled });
  };

  // Underwater Studio DSP Handlers
  const handleUpdateUnderwaterParam = (updates: Partial<UnderwaterDSPParams>) => {
    const next = { ...underwaterParams, ...updates };
    setUnderwaterParamsState(next);
    audioEngine.setUnderwaterParams(updates);
    if (updates.enabled !== undefined) {
      updateConfig({ ...config, underwaterFxEnabled: updates.enabled });
      StorageService.saveUnderwaterFx({ enabled: updates.enabled, cutoff: next.cutoffFreq });
    }
  };

  const handleApplyPreset = (preset: UnderwaterPresetName) => {
    setSelectedPreset(preset);
    audioEngine.applyUnderwaterPreset(preset);
    const updated = audioEngine.getUnderwaterParams();
    setUnderwaterParamsState(updated);
    setActiveCombo(audioEngine.getActiveEffectCombination());
    updateConfig({ ...config, underwaterFxEnabled: true, underwaterCutoff: updated.cutoffFreq });
    StorageService.saveUnderwaterFx({ enabled: true, cutoff: updated.cutoffFreq });
  };

  const handleApplyCombo = (combo: EffectCombination) => {
    setActiveCombo(combo);
    audioEngine.applyEffectCombination(combo);
    setUnderwaterParamsState(audioEngine.getUnderwaterParams());
  };

  const handleToggleAB = () => {
    const isBypassed = audioEngine.toggleUnderwaterAB();
    setUnderwaterParamsState(prev => ({ ...prev, bypassAB: isBypassed }));
  };

  const handleToggleUnderwaterFx = (enabled: boolean) => {
    handleUpdateUnderwaterParam({ enabled });
  };

  const handleUnderwaterCutoffChange = (cutoff: number) => {
    handleUpdateUnderwaterParam({ cutoffFreq: cutoff });
  };

  const allPresets = [...EQ_PRESETS, ...config.customPresets];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 pb-[max(10rem,calc(env(safe-area-inset-bottom,0px)+9rem))] animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/[0.12] shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/30 to-purple-500/20 border border-white/20 flex items-center justify-center text-indigo-300 shadow-xl">
              <Sliders className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  DSP PRO STUDIO
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Soft-Clipper Aktif
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Audio Lab PAPABVTIFY
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Pusat kustomisasi akustik 10-Band EQ, Bass Booster, dan Spatial Audio real-time.
              </p>
            </div>
          </div>

          {/* Section Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs font-bold overflow-x-auto flex-nowrap scrollbar-none max-w-full shrink-0">
            <button
              onClick={() => setActiveTabSection('eq')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTabSection === 'eq'
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              10-Band EQ
            </button>
            <button
              onClick={() => setActiveTabSection('bass')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTabSection === 'bass'
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bass Boost
            </button>
            <button
              onClick={() => setActiveTabSection('spatial')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTabSection === 'spatial'
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Spatial 3D
            </button>
            <button
              onClick={() => setActiveTabSection('underwater')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 ${
                activeTabSection === 'underwater'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <span>🌊</span>
              <span>Underwater FX</span>
            </button>
            <button
              onClick={() => setActiveTabSection('preamp')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTabSection === 'preamp'
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Preamp
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================
          SECTION 1: 10-BAND EQUALIZER
          =================================================================== */}
      {(activeTabSection === 'eq' || activeTabSection === 'bass') && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 border border-white/[0.12] shadow-xl">
          {/* Preset Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Preset Suara:</span>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                {config.activePreset}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleResetEQ}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Datar</span>
              </button>
              <button
                onClick={() => setIsSavingCustom(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black font-extrabold text-xs shadow-md hover:bg-slate-200 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Kustom</span>
              </button>
            </div>
          </div>

          {/* Modal / Dialog Simpan Preset Kustom */}
          {isSavingCustom && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 animate-fadeIn">
              <input
                type="text"
                placeholder="Nama Preset Kustom Anda..."
                value={customPresetName}
                onChange={(e) => setCustomPresetName(e.target.value)}
                className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={handleSaveCustomPreset}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition active:scale-95"
              >
                Simpan
              </button>
              <button
                onClick={() => setIsSavingCustom(false)}
                className="px-3 py-2 rounded-xl liquid-glass-pill text-xs text-slate-400 hover:text-white transition"
              >
                Batal
              </button>
            </div>
          )}

          {/* Presets List Pills */}
          <div className="flex flex-wrap gap-2">
            {allPresets.map((preset) => {
              const isActive = config.activePreset === preset.name;
              return (
                <div key={preset.name} className="relative group">
                  <button
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-black font-extrabold shadow-lg shadow-white/20'
                        : 'liquid-glass-pill text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{preset.name}</span>
                    {isActive && <Check className="w-3 h-3 text-black" />}
                  </button>

                  {preset.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomPreset(preset.name);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                      title="Hapus Preset"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 10-Band EQ Vertical Sliders with Exact Frequencies */}
          <div className="pt-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-3 border-b border-white/[0.04]">
              <span>+12 dB (Maksimum)</span>
              <span>0 dB (Netral)</span>
              <span>-12 dB (Atenuasi)</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-4 pt-6 items-center text-center">
              {EQ_FREQUENCIES.map((freq, i) => {
                const gain = config.eqGains[i] || 0;
                const freqLabel = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

                return (
                  <div key={freq} className="flex flex-col items-center gap-3">
                    <span className="text-[11px] font-mono font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-md min-w-10">
                      {gain > 0 ? `+${gain}` : gain}dB
                    </span>

                    {/* Vertical Slider Track Container */}
                    <div className="relative h-48 w-8 flex items-center justify-center">
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={gain}
                        onChange={(e) => handleBandChange(i, parseInt(e.target.value, 10))}
                        className="w-44 -rotate-90 origin-center cursor-pointer accent-indigo-400 bg-white/10 rounded-lg h-2"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-extrabold text-slate-300 block">
                        {freqLabel}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">
                        {i < 3 ? 'BASS' : i < 7 ? 'MID' : 'TREBLE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          SECTION 2: BASS BOOSTER, SPATIAL AUDIO & UNDERWATER FX DOCK
          =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* BASS BOOSTER CARD */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-5 border border-white/[0.12] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl transition ${
                config.bassBoostEnabled ? 'bg-indigo-500/30 text-indigo-300 shadow-lg shadow-indigo-500/20' : 'bg-white/[0.06] text-slate-400'
              }`}>
                <Disc3 className={`w-6 h-6 ${config.bassBoostEnabled ? 'animate-spin-slow' : ''}`} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Sub-Bass Booster</h3>
                <p className="text-xs text-slate-400">Resonansi frekuensi rendah 70 Hz</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggleBassBoost(!config.bassBoostEnabled)}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer ${
                config.bassBoostEnabled ? 'bg-indigo-600' : 'bg-white/15'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                config.bassBoostEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono font-semibold">
              <span className="text-slate-400">Intensitas Bass:</span>
              <span className="text-indigo-300 font-bold">{config.bassBoostIntensity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              disabled={!config.bassBoostEnabled}
              value={config.bassBoostIntensity}
              onChange={(e) => handleBassIntensityChange(parseInt(e.target.value, 10))}
              className={`w-full h-2 rounded-lg cursor-pointer accent-indigo-400 ${
                config.bassBoostEnabled ? 'bg-white/20' : 'bg-white/5 opacity-50'
              }`}
            />
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Perlindungan Distorsi (Soft Knee):</span>
            <span className="font-mono font-bold text-emerald-400">AKTIF (Zero Clipping)</span>
          </div>
        </div>

        {/* SPATIAL AUDIO VIRTUALIZER CARD */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-5 border border-white/[0.12] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl transition ${
                config.spatialAudioEnabled ? 'bg-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/20' : 'bg-white/[0.06] text-slate-400'
              }`}>
                <Waves className={`w-6 h-6 ${config.spatialAudioEnabled ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Spatial Audio 3D</h3>
                <p className="text-xs text-slate-400">Pelebaran Soundstage Stereo Haas</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggleSpatial(!config.spatialAudioEnabled)}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer ${
                config.spatialAudioEnabled ? 'bg-purple-600' : 'bg-white/15'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                config.spatialAudioEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono font-semibold">
              <span className="text-slate-400">Keluasan Stereo:</span>
              <span className="text-purple-300 font-bold">{config.spatialAudioIntensity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              disabled={!config.spatialAudioEnabled}
              value={config.spatialAudioIntensity}
              onChange={(e) => handleSpatialIntensityChange(parseInt(e.target.value, 10))}
              className={`w-full h-2 rounded-lg cursor-pointer accent-purple-400 ${
                config.spatialAudioEnabled ? 'bg-white/20' : 'bg-white/5 opacity-50'
              }`}
            />
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Algoritma:</span>
            <span className="font-mono text-purple-300">Binaural Crossfeed Delay</span>
          </div>
        </div>

        {/* ===================================================================
            PROFESSIONAL UNDERWATER DSP STUDIO (MUFFLED / MENDEM AUDIO PROCESSOR)
            =================================================================== */}
        <div className={`liquid-glass rounded-3xl p-6 sm:p-7 space-y-6 border border-cyan-500/30 shadow-2xl relative overflow-hidden transition ${
          activeTabSection === 'underwater' ? 'ring-2 ring-cyan-400 shadow-cyan-500/25' : ''
        }`}>
          {/* Header & Main Toggles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl transition ${
                underwaterParams.enabled && !underwaterParams.bypassAB
                  ? 'bg-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/[0.06] text-slate-400'
              }`}>
                <span className="text-2xl">🌊</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">Underwater Studio</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    DSP REALTIME
                  </span>
                  {underwaterParams.bypassAB && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      A/B BYPASS AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Pemrosesan sinyal audio mendem terendam air realistis (Aziz Hedra "Somebody's Pleasure" aesthetic)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Instant A/B Comparison Toggle */}
              <button
                onClick={handleToggleAB}
                disabled={!underwaterParams.enabled}
                title="Bandingkan langsung suara asli (A) vs efek underwater (B)"
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition flex items-center gap-1.5 ${
                  underwaterParams.bypassAB
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md'
                    : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/15'
                } ${!underwaterParams.enabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>A/B Compare</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40">
                  {underwaterParams.bypassAB ? 'ORIGINAL' : 'DSP ON'}
                </span>
              </button>

              {/* Master Power Switch */}
              <button
                onClick={() => handleToggleUnderwaterFx(!underwaterParams.enabled)}
                className={`w-13 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer ${
                  underwaterParams.enabled ? 'bg-cyan-500 shadow-lg shadow-cyan-500/30' : 'bg-white/15'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                  underwaterParams.enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* 6 Underwater Acoustic Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Preset Akustik Underwater:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {(Object.keys(UNDERWATER_DSP_PRESETS) as UnderwaterPresetName[]).map((pKey) => {
                const item = UNDERWATER_DSP_PRESETS[pKey];
                const isSelected = selectedPreset === pKey && underwaterParams.enabled;
                return (
                  <button
                    key={pKey}
                    onClick={() => handleApplyPreset(pKey)}
                    className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-extrabold truncate">{item.name}</span>
                    <span className="text-[9px] text-slate-500 line-clamp-1 mt-1">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8 Effect Combination Modes */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">8 Kombinasi Efek Studio:</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Mode: {activeCombo}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'original', label: '1. Original Normal', icon: '🎧' },
                { id: 'slowed', label: '2. Slowed (0.85x)', icon: '⏳' },
                { id: 'reverb', label: '3. Reverb Room', icon: '🏛️' },
                { id: 'slowed_reverb', label: '4. Slowed + Reverb', icon: '✨' },
                { id: 'underwater', label: '5. Underwater Muffled', icon: '🌊' },
                { id: 'slowed_underwater', label: '6. Slowed + Underwater', icon: '🫧' },
                { id: 'reverb_underwater', label: '7. Reverb + Underwater', icon: '🌌' },
                { id: 'slowed_reverb_underwater', label: '8. Full Experience (Aziz Hedra)', icon: '💎' }
              ].map(combo => {
                const isActive = activeCombo === combo.id;
                return (
                  <button
                    key={combo.id}
                    onClick={() => handleApplyCombo(combo.id as EffectCombination)}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 border-cyan-400 text-white shadow-md'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{combo.icon}</span>
                    <span className="truncate">{combo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Detailed Acoustic DSP Sliders */}
          <div className="space-y-4 pt-3 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-slate-300 block">Kontrol Akustik Parametrik (Realtime):</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Cutoff */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-slate-400">Cutoff Mendem:</span>
                  <span className="text-cyan-300 font-bold">{underwaterParams.cutoffFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={1500}
                  step={10}
                  disabled={!underwaterParams.enabled}
                  value={underwaterParams.cutoffFreq}
                  onChange={(e) => handleUpdateUnderwaterParam({ cutoffFreq: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 block">150Hz (tenggelam pekat) - 1500Hz (ringan)</span>
              </div>

              {/* 2. Resonance / Q */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-slate-400">Resonansi (Q):</span>
                  <span className="text-cyan-300 font-bold">{underwaterParams.resonance.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={4.0}
                  step={0.1}
                  disabled={!underwaterParams.enabled}
                  value={underwaterParams.resonance}
                  onChange={(e) => handleUpdateUnderwaterParam({ resonance: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 block">Kekuatan dengungan akustik air</span>
              </div>

              {/* 3. Bass / Vocal Warmth */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-slate-400">Vocal Warmth:</span>
                  <span className="text-cyan-300 font-bold">
                    {underwaterParams.bassGain > 0 ? `+${underwaterParams.bassGain}` : underwaterParams.bassGain} dB
                  </span>
                </div>
                <input
                  type="range"
                  min={-6}
                  max={12}
                  step={1}
                  disabled={!underwaterParams.enabled}
                  value={underwaterParams.bassGain}
                  onChange={(e) => handleUpdateUnderwaterParam({ bassGain: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 block">Penguatan 280Hz agar vokal tetap hangat</span>
              </div>

              {/* 4. Treble Dampening */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-slate-400">Treble Damp:</span>
                  <span className="text-cyan-300 font-bold">{underwaterParams.trebleGain} dB</span>
                </div>
                <input
                  type="range"
                  min={-24}
                  max={0}
                  step={1}
                  disabled={!underwaterParams.enabled}
                  value={underwaterParams.trebleGain}
                  onChange={(e) => handleUpdateUnderwaterParam({ trebleGain: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 block">Peredaman sibilansi frekuensi tinggi</span>
              </div>

              {/* 5. Reverb Amount */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-slate-400">Reverb Wet:</span>
                  <span className="text-cyan-300 font-bold">{underwaterParams.reverbAmount}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={!underwaterParams.enabled}
                  value={underwaterParams.reverbAmount}
                  onChange={(e) => handleUpdateUnderwaterParam({ reverbAmount: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 block">Kedalaman pantulan gema akustik</span>
              </div>

              {/* 6. Wet / Dry Mix */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-slate-400">Wet / Dry Balance:</span>
                  <span className="text-cyan-300 font-bold">{underwaterParams.wetDry}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={!underwaterParams.enabled}
                  value={underwaterParams.wetDry}
                  onChange={(e) => handleUpdateUnderwaterParam({ wetDry: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 block">Perbandingan sinyal basah vs kering</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          SECTION 3: PREAMP, NORMALIZATION & PROTECTION
          =================================================================== */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-6 border border-white/[0.12] shadow-xl">
        <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
          <Volume2 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-extrabold text-white">Preamp & Manajemen Dinamika Output</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Preamp Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Gain Preamp:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {config.preampGain > 0 ? `+${config.preampGain}` : config.preampGain} dB
              </span>
            </div>
            <input
              type="range"
              min={-6}
              max={6}
              step={0.5}
              value={config.preampGain}
              onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-indigo-400"
            />
            <p className="text-[10px] text-slate-500">
              Meningkatkan atau menurunkan headroom sebelum masuk ke filter EQ.
            </p>
          </div>

          {/* Soft-Clipping Protection Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Soft-Clipping Limiter</span>
              <span className="text-[10px] text-slate-400 block">Mencegah kresek audio digital</span>
            </div>
            <button
              onClick={() => handleToggleSoftClipping(!config.softClipping)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                config.softClipping ? 'bg-emerald-600' : 'bg-white/15'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                config.softClipping ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Volume Normalization Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Normalisasi Volume</span>
              <span className="text-[10px] text-slate-400 block">Menyamakan level antar lagu</span>
            </div>
            <button
              onClick={() => handleToggleNormalization(!config.volumeNormalization)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                config.volumeNormalization ? 'bg-indigo-600' : 'bg-white/15'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                config.volumeNormalization ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
