import React, { useEffect, useRef } from 'react';
import { AudioEngine } from '../services/audioEngine';
import { VisualizerMode } from '../types/music';
import { AdaptivePerformanceManager } from '../services/adaptivePerformance';

interface Props {
  isPlaying: boolean;
  mode?: VisualizerMode;
  sensitivity?: number; // 0.5 to 2.0
  width?: number;
  height?: number;
  className?: string;
  accentColor?: string;
}

export const Visualizer: React.FC<Props> = ({
  isPlaying,
  mode = 'spectrum',
  sensitivity = 1.0,
  width = 240,
  height = 48,
  className = '',
  accentColor = '#818cf8' // Default indigo-400
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // If NOT playing, draw static flat baseline once and exit (Zero CPU consumption)
    if (!isPlaying) {
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return;
    }

    let animId: number | null = null;
    let isDisposed = false;
    let lastTime = 0;
    const minFrameInterval = height <= 60 ? 33 : 16; // 30 FPS for mini-visualizers, 60 FPS for full modal

    const audioEngine = AudioEngine.getInstance();
    const bufferLength = 128;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    // Particle system state for 'particles' mode
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }> = [];
    for (let p = 0; p < 20; p++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2.5 + 1.2,
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    let waveOffset = 0;

    const render = (now: number) => {
      if (isDisposed) return;

      // Stop loop completely if in background mode or document is hidden to save Intel GPU & CPU
      if (document.hidden || AdaptivePerformanceManager.getInstance().isBackground()) {
        animId = null;
        return;
      }

      // Frame throttle check
      if (now - lastTime < minFrameInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastTime = now;

      ctx.clearRect(0, 0, w, h);

      audioEngine.getFrequencyData(freqData);
      audioEngine.getTimeDomainData(timeData);

      // Average energy for amplitude-driven glow/particles
      let sum = 0;
      for (let i = 0; i < 32; i++) sum += freqData[i];
      const avgEnergy = (sum / 32 / 255) * sensitivity;

      switch (mode) {
        // 1. SPECTRUM BARS
        case 'spectrum': {
          const barCount = Math.min(32, Math.floor(w / 6));
          const barWidth = Math.max(3, (w / barCount) - 3);
          let x = 0;

          for (let i = 0; i < barCount; i++) {
            const rawVal = freqData[i] || 0;
            const val = Math.min(255, rawVal * sensitivity);
            const barHeight = Math.max(3, (val / 255) * h * 0.92);

            const grad = ctx.createLinearGradient(0, h - barHeight, 0, h);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, accentColor);
            grad.addColorStop(1, 'rgba(129, 140, 248, 0.25)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, h - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
            ctx.fill();

            x += barWidth + 3;
          }
          break;
        }

        // 2. CIRCULAR SPECTRUM
        case 'circular': {
          const centerX = w / 2;
          const centerY = h / 2;
          const baseRadius = Math.min(w, h) * 0.28;
          const points = 32;

          ctx.save();
          ctx.translate(centerX, centerY);

          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const val = (freqData[i % 32] / 255) * sensitivity;
            const barLen = Math.max(2, val * (Math.min(w, h) * 0.22));

            const x1 = Math.cos(angle) * baseRadius;
            const y1 = Math.sin(angle) * baseRadius;
            const x2 = Math.cos(angle) * (baseRadius + barLen);
            const y2 = Math.sin(angle) * (baseRadius + barLen);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + val * 0.6})`;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(0, 0, baseRadius - 2, 0, Math.PI * 2);
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
          break;
        }

        // 3. WAVEFORM (OSCILLOSCOPE)
        case 'waveform': {
          ctx.beginPath();
          ctx.lineWidth = 2.0;
          ctx.strokeStyle = accentColor;

          const sliceWidth = w / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = (timeData[i] / 128.0) * sensitivity;
            const y = (v * h) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.stroke();
          break;
        }

        // 4. AUDIO PARTICLES
        case 'particles': {
          for (const p of particles) {
            p.x += p.vx * (1 + avgEnergy * 2);
            p.y += p.vy * (1 + avgEnergy * 2);

            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            const currentSize = p.size * (1 + avgEnergy * 1.5);
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.alpha + avgEnergy * 0.4)})`;
            ctx.fill();
          }
          break;
        }

        // 5. AMBIENT GLOW
        case 'ambient_glow': {
          const glowRadius = Math.max(10, avgEnergy * Math.min(w, h) * 0.45);
          const grad = ctx.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, glowRadius);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          grad.addColorStop(0.3, accentColor);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          break;
        }

        // 6. MINIMAL WAVE
        case 'minimal_wave':
        default: {
          waveOffset += 0.05;
          ctx.beginPath();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = '#ffffff';

          for (let x = 0; x < w; x++) {
            const freqVal = (freqData[Math.floor((x / w) * 16)] || 0) / 255;
            const y = (h / 2) + Math.sin((x * 0.05) + waveOffset) * (freqVal * (h * 0.35) * sensitivity);

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
          break;
        }
      }

      animId = requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      const isBg = document.hidden || AdaptivePerformanceManager.getInstance().isBackground();
      if (!isBg && isPlaying && !isDisposed) {
        if (!animId) {
          animId = requestAnimationFrame(render);
        }
      } else if (isBg && animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    const unsubAdaptive = AdaptivePerformanceManager.getInstance().subscribe(handleVisibility);
    animId = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubAdaptive();
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [isPlaying, mode, sensitivity, width, height, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded-xl transition-all duration-300 ${className}`}
    />
  );
};
