import { UnderwaterConfig, UnderwaterPreset } from '../types/music';
import { StorageService } from './storage';

export const DEFAULT_UNDERWATER_CONFIG: UnderwaterConfig = {
  enabled: false,
  preset: 'deep_ocean',
  ambientVolume: 0.4,
  visualIntensity: 0.8,
  showBubbles: true,
  showLightRays: true,
  reduceMotion: false,
  lowPerformanceMode: false
};

export interface UnderwaterPresetMeta {
  id: UnderwaterPreset;
  name: string;
  subtitle: string;
  description: string;
  colors: {
    surface: string;
    mid: string;
    deep: string;
    accent: string;
  };
  audioProfile: {
    cutoff: number;
    resonance: number;
    lfoSpeed: number;
    subBassFreq: number;
    bubbleIntervalMs: number;
  };
}

export const UNDERWATER_PRESETS: UnderwaterPresetMeta[] = [
  {
    id: 'deep_ocean',
    name: 'Deep Ocean',
    subtitle: 'Kedalaman Samudera Biru',
    description: 'Tekanan air dalam yang tenang dengan deburan arus bawah laut yang konstan dan meditatif.',
    colors: {
      surface: '#0077b6',
      mid: '#023e8a',
      deep: '#03045e',
      accent: '#00b4d8'
    },
    audioProfile: {
      cutoff: 240,
      resonance: 2.5,
      lfoSpeed: 0.08,
      subBassFreq: 55,
      bubbleIntervalMs: 4200
    }
  },
  {
    id: 'underwater_cave',
    name: 'Underwater Cave',
    subtitle: 'Gua Bawah Air yang Sunyi',
    description: 'Akustik terisolasi di dalam rongga bawah air, dengan pantulan resonansi lembut dan tetesan air gua.',
    colors: {
      surface: '#05668d',
      mid: '#028090',
      deep: '#012a4a',
      accent: '#00a896'
    },
    audioProfile: {
      cutoff: 320,
      resonance: 4.0,
      lfoSpeed: 0.05,
      subBassFreq: 45,
      bubbleIntervalMs: 3500
    }
  },
  {
    id: 'coral_reef',
    name: 'Coral Reef',
    subtitle: 'Terumbu Karang Berwarna Cyan',
    description: 'Air jernih berpasir putih dengan biasan cahaya matahari cerah dan riak gelembung hangat.',
    colors: {
      surface: '#48cae4',
      mid: '#0096c7',
      deep: '#0077b6',
      accent: '#90e0ef'
    },
    audioProfile: {
      cutoff: 480,
      resonance: 1.8,
      lfoSpeed: 0.14,
      subBassFreq: 65,
      bubbleIntervalMs: 2200
    }
  },
  {
    id: 'abyss',
    name: 'The Abyss',
    subtitle: 'Palung Terdalam yang Misterius',
    description: 'Ruang hampa kegelapan mutlak dengan getaran sub-bass purba dan kilau bioluminesensi halus.',
    colors: {
      surface: '#0d1b2a',
      mid: '#07111e',
      deep: '#02060d',
      accent: '#48cae4'
    },
    audioProfile: {
      cutoff: 140,
      resonance: 3.2,
      lfoSpeed: 0.04,
      subBassFreq: 38,
      bubbleIntervalMs: 6500
    }
  },
  {
    id: 'calm_ocean',
    name: 'Calm Ocean',
    subtitle: 'Permukaan Tenang Mengalir',
    description: 'Ayunan ombak laut yang damai didengar tepat dari bawah permukaan air laut yang sejuk.',
    colors: {
      surface: '#00b4d8',
      mid: '#0077b6',
      deep: '#03045e',
      accent: '#ade8f4'
    },
    audioProfile: {
      cutoff: 360,
      resonance: 2.0,
      lfoSpeed: 0.11,
      subBassFreq: 50,
      bubbleIntervalMs: 3000
    }
  }
];

class UnderwaterAudioManager {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private bubbleTimer: any = null;
  private isRunning: boolean = false;
  private currentVolume: number = 0.4;
  private currentPreset: UnderwaterPreset = 'deep_ocean';

  private initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume * 0.35, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  public start(preset: UnderwaterPreset = 'deep_ocean', volume = 0.4): void {
    this.currentPreset = preset;
    this.currentVolume = Math.max(0, Math.min(1, volume));

    if (this.currentVolume <= 0.01) {
      this.stop();
      return;
    }

    const ctx = this.initContext();
    const meta = UNDERWATER_PRESETS.find(p => p.id === preset) || UNDERWATER_PRESETS[0];

    // Clean existing
    this.stopAudioNodes();

    try {
      this.masterGain!.gain.setValueAtTime(this.currentVolume * 0.35, ctx.currentTime);

      // 1. Water wash pink noise base
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = this.createPinkNoiseBuffer(ctx, 6);
      this.noiseSource.loop = true;

      // 2. Resonant Lowpass Filter modeling water absorption
      this.filterNode = ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(meta.audioProfile.cutoff, ctx.currentTime);
      this.filterNode.Q.setValueAtTime(meta.audioProfile.resonance, ctx.currentTime);

      // 3. Gentle tidal pressure modulation LFO
      this.lfoOsc = ctx.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(meta.audioProfile.lfoSpeed, ctx.currentTime);

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.setValueAtTime(meta.audioProfile.cutoff * 0.35, ctx.currentTime);
      this.lfoOsc.connect(this.lfoGain);
      this.lfoGain.connect(this.filterNode.frequency);

      // 4. Sub-bass hydrodynamic rumble
      this.subOsc = ctx.createOscillator();
      this.subOsc.type = 'triangle';
      this.subOsc.frequency.setValueAtTime(meta.audioProfile.subBassFreq, ctx.currentTime);

      this.subGain = ctx.createGain();
      this.subGain.gain.setValueAtTime(0.08, ctx.currentTime);

      // Connect noise path
      this.noiseSource.connect(this.filterNode);
      this.filterNode.connect(this.masterGain!);

      // Connect sub path
      this.subOsc.connect(this.subGain);
      this.subGain.connect(this.masterGain!);

      // Start sound nodes
      this.noiseSource.start();
      this.lfoOsc.start();
      this.subOsc.start();
      this.isRunning = true;

      // Schedule occasional organic bubble sounds
      this.scheduleBubbles(meta.audioProfile.bubbleIntervalMs);
    } catch (err) {
      console.warn('[UnderwaterAudio] Start note:', err);
    }
  }

  public setVolume(vol: number): void {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume * 0.35, this.audioCtx.currentTime, 0.1);
    }
    if (this.currentVolume === 0 && this.isRunning) {
      this.stop();
    } else if (this.currentVolume > 0 && !this.isRunning) {
      this.start(this.currentPreset, this.currentVolume);
    }
  }

  public setPreset(preset: UnderwaterPreset): void {
    this.currentPreset = preset;
    if (this.isRunning) {
      this.start(preset, this.currentVolume);
    }
  }

  public playBubblePop(): void {
    if (!this.audioCtx || this.currentVolume <= 0.05) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      // Sine wave with upward chirp pitch bend typical of underwater air bubble release
      const startFreq = 280 + Math.random() * 200;
      const endFreq = startFreq + 180 + Math.random() * 100;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

      const popVol = (this.currentVolume * 0.15) * (0.6 + Math.random() * 0.4);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(popVol, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  private scheduleBubbles(intervalMs: number): void {
    if (this.bubbleTimer) clearInterval(this.bubbleTimer);
    this.bubbleTimer = setInterval(() => {
      if (this.isRunning && Math.random() > 0.3) {
        this.playBubblePop();
      }
    }, intervalMs);
  }

  private stopAudioNodes(): void {
    if (this.bubbleTimer) {
      clearInterval(this.bubbleTimer);
      this.bubbleTimer = null;
    }
    try {
      if (this.noiseSource) {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
        this.noiseSource = null;
      }
      if (this.lfoOsc) {
        this.lfoOsc.stop();
        this.lfoOsc.disconnect();
        this.lfoOsc = null;
      }
      if (this.subOsc) {
        this.subOsc.stop();
        this.subOsc.disconnect();
        this.subOsc = null;
      }
    } catch {}
    this.isRunning = false;
  }

  public stop(): void {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
      setTimeout(() => this.stopAudioNodes(), 150);
    } else {
      this.stopAudioNodes();
    }
  }
}

export const UnderwaterAudio = new UnderwaterAudioManager();
