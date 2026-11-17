// Ambient Experience 2.0: Procedural Web Audio Ambient Sound Generator
// Zero external mp3 dependencies, 100% mathematically synthesized in realtime.

export type AmbientSoundType =
  | 'rain'
  | 'heavy_rain'
  | 'fireplace'
  | 'forest'
  | 'ocean'
  | 'crickets'
  | 'thunder'
  | 'wind'
  | 'cafe'
  | 'white_noise';

export interface AmbientTrackConfig {
  id: AmbientSoundType;
  name: string;
  category: 'nature' | 'weather' | 'cozy' | 'focus';
  icon: string;
  volume: number; // 0 - 1
  enabled: boolean;
}

export interface AmbientPreset {
  id: string;
  name: string;
  description: string;
  tracks: Partial<Record<AmbientSoundType, number>>;
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'cozy_night',
    name: 'Cozy Night',
    description: 'Kombinasi hujan lembut dan gemersik api unggun yang hangat.',
    tracks: { rain: 0.5, fireplace: 0.6 }
  },
  {
    id: 'rainy_window',
    name: 'Rainy Window',
    description: 'Hujan deras dengan dentuman petir lembut di kejauhan.',
    tracks: { heavy_rain: 0.7, thunder: 0.4 }
  },
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    description: 'Noise masking pink/brown noise dipadukan dengan kesegaran hutan.',
    tracks: { white_noise: 0.4, forest: 0.5 }
  },
  {
    id: 'midnight_forest',
    name: 'Midnight Forest',
    description: 'Suasana malam hening dengan suara jangkrik dan semilir angin.',
    tracks: { crickets: 0.5, wind: 0.3 }
  },
  {
    id: 'ocean_escape',
    name: 'Ocean Escape',
    description: 'Deburan ombak pantai yang ritmis dan menenangkan pikiran.',
    tracks: { ocean: 0.65, wind: 0.3 }
  }
];

class AmbientEngineManager {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeGenerators: Map<AmbientSoundType, {
    gainNode: GainNode;
    stop: () => void;
  }> = new Map();

  private activeTracks: Map<AmbientSoundType, number> = new Map();

  private initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Generates white/pink noise buffer
   */
  private createNoiseBuffer(ctx: AudioContext, seconds = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter (Paul Kellet's method)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * Starts a procedural ambient sound generator
   */
  public setTrackVolume(type: AmbientSoundType, volume: number): void {
    const cleanVol = Math.max(0, Math.min(1, volume));
    if (cleanVol === 0) {
      this.stopTrack(type);
      return;
    }

    const ctx = this.initContext();
    this.activeTracks.set(type, cleanVol);

    const existing = this.activeGenerators.get(type);
    if (existing) {
      existing.gainNode.gain.setTargetAtTime(cleanVol * 0.35, ctx.currentTime, 0.1);
      return;
    }

    // Spawn generator
    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(cleanVol * 0.35, ctx.currentTime);
    trackGain.connect(this.masterGain!);

    const stopFn = this.spawnGenerator(ctx, type, trackGain);
    this.activeGenerators.set(type, { gainNode: trackGain, stop: stopFn });
  }

  public stopTrack(type: AmbientSoundType): void {
    const gen = this.activeGenerators.get(type);
    if (gen && this.audioCtx) {
      gen.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.15);
      setTimeout(() => {
        gen.stop();
        this.activeGenerators.delete(type);
      }, 200);
    }
    this.activeTracks.delete(type);
  }

  public stopAll(): void {
    for (const key of Array.from(this.activeGenerators.keys())) {
      this.stopTrack(key);
    }
    this.activeTracks.clear();
  }

  public applyPreset(preset: AmbientPreset): void {
    this.stopAll();
    for (const [track, vol] of Object.entries(preset.tracks)) {
      if (typeof vol === 'number' && vol > 0) {
        this.setTrackVolume(track as AmbientSoundType, vol);
      }
    }
  }

  public getActiveTracks(): Map<AmbientSoundType, number> {
    return new Map(this.activeTracks);
  }

  private spawnGenerator(ctx: AudioContext, type: AmbientSoundType, dest: AudioNode): () => void {
    switch (type) {
      case 'rain': {
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 4);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, ctx.currentTime);
        filter.Q.setValueAtTime(0.7, ctx.currentTime);

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        return () => { try { noise.stop(); noise.disconnect(); } catch {} };
      }

      case 'heavy_rain': {
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 4);
        noise.loop = true;

        const low = ctx.createBiquadFilter();
        low.type = 'lowpass';
        low.frequency.setValueAtTime(700, ctx.currentTime);

        noise.connect(low);
        low.connect(dest);
        noise.start();
        return () => { try { noise.stop(); noise.disconnect(); } catch {} };
      }

      case 'ocean': {
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        // Slow LFO for ocean wave cycles
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 1 wave every ~8 seconds
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(320, ctx.currentTime);
        lfo.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(dest);

        noise.start();
        lfo.start();
        return () => {
          try {
            noise.stop();
            lfo.stop();
            noise.disconnect();
            lfo.disconnect();
          } catch {}
        };
      }

      case 'wind': {
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 5);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(550, ctx.currentTime);
        filter.Q.setValueAtTime(2.5, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.25, ctx.currentTime);
        lfo.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(dest);

        noise.start();
        lfo.start();
        return () => {
          try { noise.stop(); lfo.stop(); } catch {}
        };
      }

      case 'fireplace': {
        // Crackling noise with intermittent spikes
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 3);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2500, ctx.currentTime);

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        return () => { try { noise.stop(); } catch {} };
      }

      case 'crickets': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500, ctx.currentTime);

        const mod = ctx.createOscillator();
        mod.type = 'square';
        mod.frequency.setValueAtTime(12, ctx.currentTime);

        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(0.5, ctx.currentTime);
        mod.connect(modGain.gain);

        osc.connect(modGain);
        modGain.connect(dest);

        osc.start();
        mod.start();
        return () => {
          try { osc.stop(); mod.stop(); } catch {}
        };
      }

      default: {
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 5);
        noise.loop = true;
        noise.connect(dest);
        noise.start();
        return () => { try { noise.stop(); } catch {} };
      }
    }
  }
}

export const AmbientService = new AmbientEngineManager();
