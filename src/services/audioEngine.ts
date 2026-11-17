import {
  SoundStyle,
  ChillAmbientSound,
  EQPreset,
  AudioLabConfig,
  EffectCombination,
  UnderwaterPresetName,
  UnderwaterDSPParams
} from '../types/music';

// 10-Band EQ Exact Frequencies as specified in requirements
export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: EQPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [8, 7, 5, 2, 0, 0, 0, 0, 1, 2] },
  { name: 'Deep Bass', gains: [11, 9, 6, 2, -1, -1, 0, 0, 0, 1] },
  { name: 'Pop', gains: [-1, 2, 4, 5, 5, 4, 2, -1, 2, 3] },
  { name: 'Rock', gains: [6, 4, 2, -1, -2, 1, 3, 5, 5, 6] },
  { name: 'Classical', gains: [4, 3, 2, 2, -1, -1, 0, 2, 3, 4] },
  { name: 'Jazz', gains: [3, 2, 1, 2, -1, -1, 0, 2, 3, 4] },
  { name: 'Electronic', gains: [7, 6, 2, 0, -2, 2, 3, 5, 6, 5] },
  { name: 'Vocal', gains: [-3, -2, -1, 1, 4, 6, 5, 3, 1, -1] },
  { name: 'Acoustic', gains: [3, 2, 1, 1, 2, 3, 3, 3, 2, 1] },
  { name: 'Custom', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isCustom: true }
];

// Professional Underwater DSP Presets
export const UNDERWATER_DSP_PRESETS: Record<
  UnderwaterPresetName,
  { name: string; description: string; params: Partial<UnderwaterDSPParams>; speed?: number }
> = {
  soft_underwater: {
    name: 'Soft Underwater',
    description: 'Suara terendam air lembut, vokal tetap jelas dan santai',
    params: { intensity: 65, cutoffFreq: 680, resonance: 1.8, bassGain: 3, midGain: 0, trebleGain: -8, reverbAmount: 35, wetDry: 75, modulationAmount: 20 }
  },
  deep_underwater: {
    name: 'Deep Underwater',
    description: 'Kedalaman laut pekat dengan peredaman frekuensi tinggi dan bass tebal',
    params: { intensity: 90, cutoffFreq: 340, resonance: 2.8, bassGain: 6, midGain: -2, trebleGain: -16, reverbAmount: 50, wetDry: 95, modulationAmount: 30 }
  },
  dreamy_underwater: {
    name: 'Dreamy Underwater',
    description: 'Suasana melayang estetik dengan reverb luas dan ayunan arus air halus',
    params: { intensity: 80, cutoffFreq: 500, resonance: 2.2, bassGain: 4, midGain: 1, trebleGain: -12, reverbAmount: 70, wetDry: 85, modulationAmount: 35 }
  },
  dark_underwater: {
    name: 'Dark Underwater',
    description: 'Akustik palung dalam terisolasi dengan filter curam dan nuansa misterius',
    params: { intensity: 95, cutoffFreq: 260, resonance: 3.2, bassGain: 8, midGain: -4, trebleGain: -20, reverbAmount: 40, wetDry: 100, modulationAmount: 15 }
  },
  slowed_underwater: {
    name: 'Slowed Underwater',
    description: 'Kombinasi tempo santai 0.82x dengan suara terendam air meditatif',
    params: { intensity: 85, cutoffFreq: 420, resonance: 2.4, bassGain: 5, midGain: 0, trebleGain: -14, reverbAmount: 55, wetDry: 90, modulationAmount: 25 },
    speed: 0.82
  },
  full_underwater: {
    name: 'Full Underwater Experience',
    description: 'Slowed + Reverb + Underwater penuh (Aestetik Aziz Hedra "Somebody\'s Pleasure")',
    params: { intensity: 90, cutoffFreq: 440, resonance: 2.6, bassGain: 5, midGain: 1, trebleGain: -15, reverbAmount: 75, wetDry: 95, modulationAmount: 40 },
    speed: 0.82
  }
};

export class AudioEngine {
  private static instance: AudioEngine;
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  
  // Audio Lab Nodes
  private preampNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassBoosterFilter: BiquadFilterNode | null = null;
  private bassBoosterEnabled: boolean = false;
  private bassBoosterIntensity: number = 0; // 0 - 100%

  // Spatial Audio Virtualizer Nodes
  private spatialDelayNode: DelayNode | null = null;
  private spatialWidenerGain: GainNode | null = null;
  private spatialDryGain: GainNode | null = null;
  private spatialAudioEnabled: boolean = false;
  private spatialAudioIntensity: number = 50; // 0 - 100%

  // Soft-Clipping Protection & Dynamics
  private compressorNode: DynamicsCompressorNode | null = null;
  private softClippingEnabled: boolean = true;
  private volumeNormalized: boolean = false;

  // Master Gain & Analyser
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // DSP Style nodes (8D, Reverb, Lo-Fi)
  private dspFilter: BiquadFilterNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private reverbGainNode: GainNode | null = null;
  private dryGainNode: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private lfoInterval: number | null = null;
  private lfoAngle: number = 0;
  private currentStyle: SoundStyle = 'normal';

  // --- PROFESSIONAL UNDERWATER DSP PROCESSOR SUBGRAPH ---
  private underwaterLpfNode: BiquadFilterNode | null = null;
  private underwaterLowMidNode: BiquadFilterNode | null = null;
  private underwaterHighDampNode: BiquadFilterNode | null = null;
  private underwaterDryGain: GainNode | null = null;
  private underwaterWetGain: GainNode | null = null;
  private underwaterMixGain: GainNode | null = null;
  private underwaterLfoNode: OscillatorNode | null = null;
  private underwaterLfoGain: GainNode | null = null;

  private underwaterParams: UnderwaterDSPParams = {
    enabled: false,
    intensity: 85,
    cutoffFreq: 480,
    resonance: 2.2,
    bassGain: 4,
    midGain: 0,
    trebleGain: -12,
    reverbAmount: 60,
    wetDry: 85,
    modulationAmount: 25,
    bypassAB: false
  };

  private activeCombo: EffectCombination = 'original';

  // Chill Ambient Sounds (Web Audio Synthesized)
  private ambientGainNode: GainNode | null = null;
  private ambientSourceNode: AudioBufferSourceNode | null = null;
  private currentAmbient: ChillAmbientSound = 'none';
  private ambientVolume: number = 0.35;

  // Playback Speed & Pitch Lock
  private playbackSpeed: number = 1.0;
  private preservePitch: boolean = true;

  private constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public getCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public initContext(): void {
    if (this.audioCtx) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Source from audio element
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);

      // Preamp Gain Node (-6dB to +6dB)
      this.preampNode = this.audioCtx.createGain();
      this.preampNode.gain.value = 1.0; // 0 dB

      // DSP Filter Node for Lo-Fi / Slowed
      this.dspFilter = this.audioCtx.createBiquadFilter();
      this.dspFilter.type = 'allpass';
      this.dspFilter.frequency.value = 20000;

      // --- ADVANCED UNDERWATER DSP PROCESSOR SUBGRAPH ---
      this.underwaterDryGain = this.audioCtx.createGain();
      this.underwaterDryGain.gain.value = this.underwaterParams.enabled ? (1.0 - (this.underwaterParams.wetDry / 100)) : 1.0;

      this.underwaterWetGain = this.audioCtx.createGain();
      this.underwaterWetGain.gain.value = this.underwaterParams.enabled && !this.underwaterParams.bypassAB ? (this.underwaterParams.wetDry / 100) : 0.0;

      this.underwaterMixGain = this.audioCtx.createGain();
      this.underwaterMixGain.gain.value = 1.0;

      // 1. Resonant Lowpass Filter (Muffled submerged cutoff)
      this.underwaterLpfNode = this.audioCtx.createBiquadFilter();
      this.underwaterLpfNode.type = 'lowpass';
      this.underwaterLpfNode.frequency.value = this.underwaterParams.cutoffFreq;
      this.underwaterLpfNode.Q.value = this.underwaterParams.resonance;

      // 2. Parametric Low-Mid Body Boost (vocal warmth in water)
      this.underwaterLowMidNode = this.audioCtx.createBiquadFilter();
      this.underwaterLowMidNode.type = 'peaking';
      this.underwaterLowMidNode.frequency.value = 280;
      this.underwaterLowMidNode.Q.value = 1.2;
      this.underwaterLowMidNode.gain.value = this.underwaterParams.bassGain;

      // 3. High-Damp Filter (smooth water acoustic rolloff, removes sibilance)
      this.underwaterHighDampNode = this.audioCtx.createBiquadFilter();
      this.underwaterHighDampNode.type = 'highshelf';
      this.underwaterHighDampNode.frequency.value = 2200;
      this.underwaterHighDampNode.gain.value = this.underwaterParams.trebleGain;

      // 4. Subtle Water Current LFO (Modulation of cutoff frequency)
      this.underwaterLfoGain = this.audioCtx.createGain();
      this.underwaterLfoGain.gain.value = (this.underwaterParams.modulationAmount / 100) * 45;

      try {
        this.underwaterLfoNode = this.audioCtx.createOscillator();
        this.underwaterLfoNode.type = 'sine';
        this.underwaterLfoNode.frequency.value = 0.22; // ~4.5s cycle for gentle wave motion
        this.underwaterLfoNode.connect(this.underwaterLfoGain);
        this.underwaterLfoGain.connect(this.underwaterLpfNode.frequency);
        this.underwaterLfoNode.start();
      } catch (lfoErr) {
        console.warn('Underwater LFO note:', lfoErr);
      }

      // 10-Band Equalizer Filters
      this.eqFilters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (freq <= 31) {
          filter.type = 'lowshelf';
        } else if (freq >= 16000) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Bass Booster Low-Shelf Filter (70 Hz)
      this.bassBoosterFilter = this.audioCtx.createBiquadFilter();
      this.bassBoosterFilter.type = 'lowshelf';
      this.bassBoosterFilter.frequency.value = 70;
      this.bassBoosterFilter.gain.value = 0;

      // Spatial Audio Virtualizer (Haas stereo widener)
      this.spatialDelayNode = this.audioCtx.createDelay(0.1);
      this.spatialDelayNode.delayTime.value = 0.022; // 22ms Haas delay
      this.spatialWidenerGain = this.audioCtx.createGain();
      this.spatialWidenerGain.gain.value = 0;
      this.spatialDryGain = this.audioCtx.createGain();
      this.spatialDryGain.gain.value = 1.0;

      // Reverb Convolver & Gains
      this.convolverNode = this.audioCtx.createConvolver();
      this.convolverNode.buffer = this.createReverbBuffer(2.4, 2.0);
      this.reverbGainNode = this.audioCtx.createGain();
      this.reverbGainNode.gain.value = 0;
      this.dryGainNode = this.audioCtx.createGain();
      this.dryGainNode.gain.value = 1.0;

      // 8D Stereo Panner
      if (this.audioCtx.createStereoPanner) {
        this.pannerNode = this.audioCtx.createStereoPanner();
      }

      // Soft-Clipping Protection Compressor Node
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -0.5; // -0.5 dB
      this.compressorNode.knee.value = 10; // Soft knee
      this.compressorNode.ratio.value = 20; // Hard limiting
      this.compressorNode.attack.value = 0.003; // 3ms fast attack
      this.compressorNode.release.value = 0.25; // 250ms release

      // Master Gain
      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.value = 1.0;

      // Realtime Analyser for Visualizer
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.82;

      // Ambient Synthesizer Gain
      this.ambientGainNode = this.audioCtx.createGain();
      this.ambientGainNode.gain.value = this.ambientVolume;
      this.ambientGainNode.connect(this.audioCtx.destination);

      // --- SIGNAL GRAPH PIPELINE ---
      // Source -> Preamp -> DSP Filter -> 10-Band EQ chain -> Bass Booster
      let node: AudioNode = this.sourceNode;
      node.connect(this.preampNode);
      node = this.preampNode;

      node.connect(this.dspFilter);
      node = this.dspFilter;

      // Connect through Underwater DSP Subgraph (Dry / Wet with LPF + LowMid + HighDamp)
      if (this.underwaterDryGain && this.underwaterWetGain && this.underwaterMixGain && this.underwaterLpfNode && this.underwaterLowMidNode && this.underwaterHighDampNode) {
        node.connect(this.underwaterDryGain);
        this.underwaterDryGain.connect(this.underwaterMixGain);

        node.connect(this.underwaterLpfNode);
        this.underwaterLpfNode.connect(this.underwaterLowMidNode);
        this.underwaterLowMidNode.connect(this.underwaterHighDampNode);
        this.underwaterHighDampNode.connect(this.underwaterWetGain);
        this.underwaterWetGain.connect(this.underwaterMixGain);

        node = this.underwaterMixGain;
      }

      for (const filter of this.eqFilters) {
        node.connect(filter);
        node = filter;
      }

      node.connect(this.bassBoosterFilter);
      node = this.bassBoosterFilter;

      // Spatial Virtualizer splitting
      node.connect(this.spatialDryGain);
      node.connect(this.spatialDelayNode);
      this.spatialDelayNode.connect(this.spatialWidenerGain);

      // Mix spatial dry + wet
      const spatialMix = this.audioCtx.createGain();
      this.spatialDryGain.connect(spatialMix);
      this.spatialWidenerGain.connect(spatialMix);
      node = spatialMix;

      // Panner for 8D
      if (this.pannerNode) {
        node.connect(this.pannerNode);
        node = this.pannerNode;
      }

      // Reverb routing
      node.connect(this.dryGainNode);
      node.connect(this.convolverNode);
      this.convolverNode.connect(this.reverbGainNode);

      const reverbMix = this.audioCtx.createGain();
      this.dryGainNode.connect(reverbMix);
      this.reverbGainNode.connect(reverbMix);

      // Soft Clipper & Master Output
      reverbMix.connect(this.compressorNode);
      this.compressorNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);

    } catch (e) {
      console.warn('Web Audio Context initialization deferred:', e);
    }
  }

  // =========================================================================
  // EQUALIZER (10-BAND REALTIME DSP)
  // =========================================================================

  public setEQBand(index: number, gainDb: number): void {
    if (this.eqFilters[index] && isFinite(gainDb)) {
      const clamped = Math.max(-12, Math.min(12, gainDb));
      this.eqFilters[index].gain.setTargetAtTime(clamped, this.audioCtx?.currentTime || 0, 0.02);
    }
  }

  public setEQPreset(preset: EQPreset): void {
    preset.gains.forEach((gain, index) => {
      this.setEQBand(index, gain);
    });
  }

  public resetEQ(): void {
    this.eqFilters.forEach((filter) => {
      filter.gain.setTargetAtTime(0, this.audioCtx?.currentTime || 0, 0.02);
    });
  }

  // =========================================================================
  // BASS BOOSTER
  // =========================================================================

  public setBassBooster(enabled: boolean, intensityPercent: number): void {
    this.bassBoosterEnabled = enabled;
    this.bassBoosterIntensity = Math.max(0, Math.min(100, intensityPercent));

    if (this.bassBoosterFilter) {
      const targetGain = enabled ? (this.bassBoosterIntensity / 100) * 14 : 0;
      this.bassBoosterFilter.gain.setTargetAtTime(targetGain, this.audioCtx?.currentTime || 0, 0.03);
    }
  }

  // =========================================================================
  // SPATIAL AUDIO / VIRTUALIZER
  // =========================================================================

  public setSpatialAudio(enabled: boolean, intensityPercent: number): void {
    this.spatialAudioEnabled = enabled;
    this.spatialAudioIntensity = Math.max(0, Math.min(100, intensityPercent));

    if (this.spatialWidenerGain && this.spatialDryGain) {
      const wetGain = enabled ? (this.spatialAudioIntensity / 100) * 0.75 : 0;
      const dryGain = enabled ? 1.0 - (wetGain * 0.25) : 1.0;
      this.spatialWidenerGain.gain.setTargetAtTime(wetGain, this.audioCtx?.currentTime || 0, 0.03);
      this.spatialDryGain.gain.setTargetAtTime(dryGain, this.audioCtx?.currentTime || 0, 0.03);
    }
  }

  // =========================================================================
  // PREAMP & SOFT-CLIPPING PROTECTION
  // =========================================================================

  public setPreamp(gainDb: number): void {
    if (this.preampNode) {
      const clamped = Math.max(-6, Math.min(6, gainDb));
      const linear = Math.pow(10, clamped / 20);
      this.preampNode.gain.setTargetAtTime(linear, this.audioCtx?.currentTime || 0, 0.02);
    }
  }

  public setSoftClipping(enabled: boolean): void {
    this.softClippingEnabled = enabled;
    if (this.compressorNode) {
      this.compressorNode.ratio.value = enabled ? 20 : 1;
    }
  }

  public setVolumeNormalization(enabled: boolean): void {
    this.volumeNormalized = enabled;
    if (enabled) {
      this.setPreamp(-1.5);
    } else {
      this.setPreamp(0);
    }
  }

  // =========================================================================
  // UNDERWATER SOUND EFFECT (MUFFLED / MENDEM DSP AUDIO PROCESSOR)
  // =========================================================================

  public setUnderwaterParams(params: Partial<UnderwaterDSPParams>): void {
    this.underwaterParams = {
      ...this.underwaterParams,
      ...params
    };

    if (params.cutoffFreq !== undefined) {
      this.underwaterParams.cutoffFreq = Math.max(150, Math.min(2000, params.cutoffFreq));
    }
    if (params.resonance !== undefined) {
      this.underwaterParams.resonance = Math.max(1.0, Math.min(4.0, params.resonance));
    }
    if (params.bassGain !== undefined) {
      this.underwaterParams.bassGain = Math.max(-6, Math.min(12, params.bassGain));
    }
    if (params.midGain !== undefined) {
      this.underwaterParams.midGain = Math.max(-12, Math.min(6, params.midGain));
    }
    if (params.trebleGain !== undefined) {
      this.underwaterParams.trebleGain = Math.max(-24, Math.min(0, params.trebleGain));
    }
    if (params.wetDry !== undefined) {
      this.underwaterParams.wetDry = Math.max(0, Math.min(100, params.wetDry));
    }
    if (params.reverbAmount !== undefined) {
      this.underwaterParams.reverbAmount = Math.max(0, Math.min(100, params.reverbAmount));
    }
    if (params.modulationAmount !== undefined) {
      this.underwaterParams.modulationAmount = Math.max(0, Math.min(100, params.modulationAmount));
    }

    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const isEngaged = this.underwaterParams.enabled && !this.underwaterParams.bypassAB;

    // 1. Resonant Lowpass Filter (Muffled Submerged Acoustic)
    if (this.underwaterLpfNode) {
      this.underwaterLpfNode.type = 'lowpass';
      this.underwaterLpfNode.frequency.setTargetAtTime(this.underwaterParams.cutoffFreq, now, 0.03);
      this.underwaterLpfNode.Q.setTargetAtTime(this.underwaterParams.resonance, now, 0.03);
    }

    // 2. Parametric Low-Mid Body Boost (vocal warmth in water)
    if (this.underwaterLowMidNode) {
      this.underwaterLowMidNode.gain.setTargetAtTime(this.underwaterParams.bassGain, now, 0.03);
    }

    // 3. High-Damp Shelf (water acoustic rolloff)
    if (this.underwaterHighDampNode) {
      this.underwaterHighDampNode.gain.setTargetAtTime(this.underwaterParams.trebleGain, now, 0.03);
    }

    // 4. LFO Modulation Depth
    if (this.underwaterLfoGain) {
      const modDepth = (this.underwaterParams.modulationAmount / 100) * 45;
      this.underwaterLfoGain.gain.setTargetAtTime(modDepth, now, 0.03);
    }

    // 5. Wet / Dry Mix Gains
    if (this.underwaterWetGain && this.underwaterDryGain) {
      const wetRatio = isEngaged ? (this.underwaterParams.wetDry / 100) : 0.0;
      const dryRatio = isEngaged ? Math.max(0, 1.0 - wetRatio) : 1.0;

      this.underwaterWetGain.gain.setTargetAtTime(wetRatio, now, 0.03);
      this.underwaterDryGain.gain.setTargetAtTime(dryRatio, now, 0.03);
    }

    // 6. Linked Reverb Wet Gain if active
    if (this.reverbGainNode && this.dryGainNode) {
      if (isEngaged && this.underwaterParams.reverbAmount > 0) {
        const revWet = (this.underwaterParams.reverbAmount / 100) * 0.65;
        this.reverbGainNode.gain.setTargetAtTime(revWet, now, 0.03);
        this.dryGainNode.gain.setTargetAtTime(Math.max(0.4, 1.0 - (revWet * 0.5)), now, 0.03);
      }
    }
  }

  public getUnderwaterParams(): UnderwaterDSPParams {
    return { ...this.underwaterParams };
  }

  public applyUnderwaterPreset(presetName: UnderwaterPresetName): void {
    const preset = UNDERWATER_DSP_PRESETS[presetName];
    if (!preset) return;

    this.setUnderwaterParams({
      ...preset.params,
      enabled: true,
      bypassAB: false
    });

    if (preset.speed) {
      this.setPlaybackSpeed(preset.speed, false);
      this.activeCombo = 'slowed_underwater';
    } else {
      this.activeCombo = 'underwater';
    }
  }

  public toggleUnderwaterAB(): boolean {
    this.underwaterParams.bypassAB = !this.underwaterParams.bypassAB;
    this.setUnderwaterParams({});
    return this.underwaterParams.bypassAB;
  }

  public applyEffectCombination(combo: EffectCombination): void {
    this.activeCombo = combo;
    this.initContext();
    const now = this.audioCtx ? this.audioCtx.currentTime : 0;

    switch (combo) {
      case 'original':
        this.setPlaybackSpeed(1.0, true);
        if (this.reverbGainNode) this.reverbGainNode.gain.setTargetAtTime(0, now, 0.03);
        if (this.dryGainNode) this.dryGainNode.gain.setTargetAtTime(1.0, now, 0.03);
        this.setUnderwaterParams({ enabled: false, bypassAB: false });
        break;

      case 'slowed':
        this.setPlaybackSpeed(0.85, false);
        if (this.reverbGainNode) this.reverbGainNode.gain.setTargetAtTime(0, now, 0.03);
        if (this.dryGainNode) this.dryGainNode.gain.setTargetAtTime(1.0, now, 0.03);
        this.setUnderwaterParams({ enabled: false, bypassAB: false });
        break;

      case 'reverb':
        this.setPlaybackSpeed(1.0, true);
        if (this.reverbGainNode) this.reverbGainNode.gain.setTargetAtTime(0.45, now, 0.03);
        if (this.dryGainNode) this.dryGainNode.gain.setTargetAtTime(0.75, now, 0.03);
        this.setUnderwaterParams({ enabled: false, bypassAB: false });
        break;

      case 'slowed_reverb':
        this.setPlaybackSpeed(0.85, false);
        if (this.reverbGainNode) this.reverbGainNode.gain.setTargetAtTime(0.48, now, 0.03);
        if (this.dryGainNode) this.dryGainNode.gain.setTargetAtTime(0.72, now, 0.03);
        this.setUnderwaterParams({ enabled: false, bypassAB: false });
        break;

      case 'underwater':
        this.setPlaybackSpeed(1.0, true);
        this.setUnderwaterParams({
          enabled: true,
          bypassAB: false,
          cutoffFreq: 520,
          resonance: 2.2,
          bassGain: 4,
          midGain: 0,
          trebleGain: -12,
          wetDry: 85,
          reverbAmount: 40,
          modulationAmount: 25
        });
        break;

      case 'slowed_underwater':
        this.setPlaybackSpeed(0.85, false);
        this.setUnderwaterParams({
          enabled: true,
          bypassAB: false,
          cutoffFreq: 460,
          resonance: 2.4,
          bassGain: 5,
          midGain: 0,
          trebleGain: -14,
          wetDry: 90,
          reverbAmount: 50,
          modulationAmount: 25
        });
        break;

      case 'reverb_underwater':
        this.setPlaybackSpeed(1.0, true);
        this.setUnderwaterParams({
          enabled: true,
          bypassAB: false,
          cutoffFreq: 480,
          resonance: 2.2,
          bassGain: 4,
          midGain: 1,
          trebleGain: -12,
          wetDry: 85,
          reverbAmount: 70,
          modulationAmount: 30
        });
        break;

      case 'slowed_reverb_underwater':
        // The quintessential Aziz Hedra - Somebody's Pleasure (Slowed + Reverb + Underwater) signature
        this.setPlaybackSpeed(0.82, false);
        this.setUnderwaterParams({
          enabled: true,
          bypassAB: false,
          cutoffFreq: 440,
          resonance: 2.6,
          bassGain: 5,
          midGain: 1,
          trebleGain: -15,
          wetDry: 95,
          reverbAmount: 75,
          modulationAmount: 40
        });
        break;
    }
  }

  public getActiveEffectCombination(): EffectCombination {
    return this.activeCombo;
  }

  // Backwards compatibility helper methods
  public setUnderwaterEffect(enabled: boolean, cutoff?: number): void {
    const update: Partial<UnderwaterDSPParams> = { enabled };
    if (cutoff !== undefined && isFinite(cutoff)) {
      update.cutoffFreq = cutoff;
    }
    this.setUnderwaterParams(update);
  }

  public setUnderwaterCutoff(cutoff: number): void {
    this.setUnderwaterParams({ cutoffFreq: cutoff });
  }

  public isUnderwaterEffectEnabled(): boolean {
    return this.underwaterParams.enabled && !this.underwaterParams.bypassAB;
  }

  public getUnderwaterCutoff(): number {
    return this.underwaterParams.cutoffFreq;
  }

  // =========================================================================
  // PLAYBACK SPEED & PITCH CONTROL (SPEED UP & SLOWED)
  // =========================================================================

  public setPlaybackSpeed(speed: number, preservePitch: boolean = true): void {
    const clamped = Math.max(0.5, Math.min(2.0, Math.round(speed * 100) / 100));
    this.playbackSpeed = clamped;
    this.preservePitch = preservePitch;

    this.audioElement.playbackRate = clamped;
    this.audioElement.preservesPitch = preservePitch;
    (this.audioElement as any).mozPreservesPitch = preservePitch;
    (this.audioElement as any).webkitPreservesPitch = preservePitch;
  }

  public getPlaybackSpeed(): { speed: number; preservePitch: boolean } {
    return {
      speed: this.playbackSpeed,
      preservePitch: this.preservePitch
    };
  }

  public resetPlaybackSpeed(): void {
    this.setPlaybackSpeed(1.0, true);
  }

  // =========================================================================
  // VISUALIZER DATA EXTRACTORS (60 FPS OPTIMIZED)
  // =========================================================================

  public getFrequencyData(dataArray: any): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(dataArray);
    }
  }

  public getTimeDomainData(dataArray: any): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(dataArray);
    }
  }

  // =========================================================================
  // SLEEP TIMER FADEOUT
  // =========================================================================

  public smoothFadeout(durationSec: number = 15): void {
    if (this.masterGainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
      this.masterGainNode.gain.linearRampToValueAtTime(0.001, now + durationSec);
    }
  }

  public restoreMasterGain(): void {
    if (this.masterGainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setValueAtTime(1.0, now);
    }
  }

  // =========================================================================
  // DSP SOUND STYLES & REVERB
  // =========================================================================

  private createReverbBuffer(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.audioCtx?.sampleRate || 44100;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioCtx!.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      const envelope = Math.pow(n, decay);
      left[i] = ((Math.random() * 2) - 1) * envelope;
      right[i] = ((Math.random() * 2) - 1) * envelope;
    }
    return buffer;
  }

  public setSoundStyle(style: SoundStyle): void {
    this.currentStyle = style;
    this.stop8DLfo();

    if (!this.audioCtx) return;

    if (this.dspFilter) {
      this.dspFilter.type = 'allpass';
      this.dspFilter.frequency.value = 20000;
    }
    if (this.reverbGainNode) this.reverbGainNode.gain.value = 0.0;
    if (this.dryGainNode) this.dryGainNode.gain.value = 1.0;
    if (this.pannerNode) this.pannerNode.pan.value = 0;

    switch (style) {
      case 'slowed_reverb':
        this.setPlaybackSpeed(0.85, false);
        if (this.dspFilter) {
          this.dspFilter.type = 'lowpass';
          this.dspFilter.frequency.value = 4500;
        }
        if (this.reverbGainNode) this.reverbGainNode.gain.value = 0.45;
        if (this.dryGainNode) this.dryGainNode.gain.value = 0.75;
        break;

      case 'sped_up':
        this.setPlaybackSpeed(1.25, false);
        break;

      case 'nightcore':
        this.setPlaybackSpeed(1.32, false);
        break;

      case 'lofi':
        this.setPlaybackSpeed(0.95, false);
        if (this.dspFilter) {
          this.dspFilter.type = 'lowpass';
          this.dspFilter.frequency.value = 3600;
        }
        if (this.reverbGainNode) this.reverbGainNode.gain.value = 0.25;
        break;

      case 'eight_d':
        this.start8DLfo();
        if (this.reverbGainNode) this.reverbGainNode.gain.value = 0.30;
        break;

      case 'normal':
      default:
        this.setPlaybackSpeed(1.0, true);
        break;
    }
  }

  private start8DLfo(): void {
    if (!this.pannerNode) return;
    this.lfoAngle = 0;
    this.lfoInterval = window.setInterval(() => {
      this.lfoAngle += 0.04;
      if (this.pannerNode) {
        this.pannerNode.pan.value = Math.sin(this.lfoAngle) * 0.92;
      }
    }, 40);
  }

  private stop8DLfo(): void {
    if (this.lfoInterval !== null) {
      clearInterval(this.lfoInterval);
      this.lfoInterval = null;
    }
    if (this.pannerNode) {
      this.pannerNode.pan.value = 0;
    }
  }

  // =========================================================================
  // CHILL AMBIENT SOUNDS
  // =========================================================================

  public setChillAmbient(ambient: ChillAmbientSound): void {
    this.currentAmbient = ambient;
    this.stopChillAmbient();

    if (ambient === 'none' || !this.audioCtx || !this.ambientGainNode) return;

    const sampleRate = this.audioCtx.sampleRate;
    const length = sampleRate * 4;
    const buffer = this.audioCtx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (ambient === 'rain') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555;
        b1 = 0.99332 * b1 + white * 0.0750;
        b2 = 0.96900 * b2 + white * 0.1538;
        const pink = (b0 + b1 + b2) * 0.06;
        left[i] = pink;
        right[i] = pink * 0.95;
      }
    } else if (ambient === 'fireplace' || ambient === 'vinyl') {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        let crackle = Math.random() < 0.0006 ? (Math.random() * 2 - 1) * 0.5 : 0;
        left[i] = last * 0.3 + crackle;
        right[i] = last * 0.3 + crackle * 0.9;
      }
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.ambientGainNode);
    source.start(0);
    this.ambientSourceNode = source;
  }

  public setChillAmbientVolume(vol: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGainNode) {
      this.ambientGainNode.gain.value = this.ambientVolume;
    }
  }

  private stopChillAmbient(): void {
    if (this.ambientSourceNode) {
      try {
        this.ambientSourceNode.stop();
        this.ambientSourceNode.disconnect();
      } catch (e) {}
      this.ambientSourceNode = null;
    }
  }

  // =========================================================================
  // LIFECYCLE & PLAYBACK
  // =========================================================================

  public setVolume(vol: number): void {
    this.audioElement.volume = Math.max(0, Math.min(1, vol));
  }

  public async play(): Promise<void> {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    this.restoreMasterGain();
    await this.audioElement.play();
  }

  public pause(): void {
    this.audioElement.pause();
  }

  public seek(seconds: number): void {
    if (isFinite(seconds)) {
      this.audioElement.currentTime = seconds;
    }
  }
}
