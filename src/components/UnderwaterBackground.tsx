import React, { useEffect, useRef } from 'react';
import { UnderwaterConfig, UnderwaterPreset } from '../types/music';
import { UNDERWATER_PRESETS } from '../services/underwaterService';

interface Props {
  config: UnderwaterConfig;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface Bubble {
  id: number;
  x: number;
  size: number;
  speed: number;
  wobble: number;
  delay: number;
}

export const UnderwaterBackground: React.FC<Props> = ({ config, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  const meta = UNDERWATER_PRESETS.find(p => p.id === config.preset) || UNDERWATER_PRESETS[0];

  // 12 Gentle Rising Bubbles with deterministic pseudo-random spread
  const bubbles: Bubble[] = React.useMemo(() => [
    { id: 1, x: 12, size: 14, speed: 18, wobble: 2.2, delay: 0 },
    { id: 2, x: 28, size: 22, speed: 22, wobble: 3.1, delay: 3 },
    { id: 3, x: 45, size: 10, speed: 16, wobble: 1.8, delay: 1.5 },
    { id: 4, x: 62, size: 26, speed: 25, wobble: 3.8, delay: 4.2 },
    { id: 5, x: 78, size: 16, speed: 19, wobble: 2.5, delay: 2.1 },
    { id: 6, x: 91, size: 12, speed: 17, wobble: 2.0, delay: 5 },
    { id: 7, x: 20, size: 18, speed: 21, wobble: 2.9, delay: 6.5 },
    { id: 8, x: 52, size: 15, speed: 20, wobble: 2.4, delay: 7.8 },
    { id: 9, x: 84, size: 20, speed: 23, wobble: 3.4, delay: 8.2 },
    { id: 10, x: 38, size: 8, speed: 14, wobble: 1.5, delay: 9.1 },
    { id: 11, x: 68, size: 12, speed: 18, wobble: 2.1, delay: 10.4 },
    { id: 12, x: 95, size: 16, speed: 19, wobble: 2.7, delay: 11.2 }
  ], []);

  // Marine snow / bioluminescent micro-particles simulation
  useEffect(() => {
    if (config.lowPerformanceMode || !config.enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Limit particles to 24 for ultra-low CPU (<0.5%)
    const particleCount = config.reduceMotion ? 10 : 24;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        speedY: (Math.random() * 0.35 + 0.15) * (config.reduceMotion ? 0.4 : 1.0),
        speedX: (Math.random() - 0.5) * 0.25 * (config.reduceMotion ? 0.3 : 1.0),
        alpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    let lastFrameTime = performance.now();

    const render = (now: number) => {
      // Pause completely if window is hidden / minimized
      if (document.hidden) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      // Throttle to 30 FPS to conserve CPU/RAM
      const elapsed = now - lastFrameTime;
      if (elapsed < 33) {
        animRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now;

      ctx.clearRect(0, 0, width, height);

      const accent = meta.colors.accent;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speedY;
        p.x += Math.sin(p.pulsePhase) * p.speedX;
        p.pulsePhase += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulsePhase)) * config.visualIntensity;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 235, 255, ${currentAlpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [config.enabled, config.preset, config.lowPerformanceMode, config.reduceMotion, config.visualIntensity, meta]);

  if (!config.enabled) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-colors duration-1000 ${className}`}
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${meta.colors.surface} 0%, ${meta.colors.mid} 45%, ${meta.colors.deep} 100%)`
      }}
    >
      {/* Layer 1: Sunlight Caustics / Light Rays */}
      {config.showLightRays && !config.lowPerformanceMode && (
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
          style={{ opacity: 0.35 * config.visualIntensity }}
        >
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 600">
            <defs>
              <linearGradient id="rayGrad1" x1="0%" y1="0%" x2="40%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="35%" stopColor={meta.colors.accent} stopOpacity="0.25" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="rayGrad2" x1="100%" y1="0%" x2="60%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="40%" stopColor={meta.colors.accent} stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Downward angled soft caustics beams */}
            <polygon points="120,0 280,0 480,600 240,600" fill="url(#rayGrad1)" />
            <polygon points="460,0 620,0 780,600 520,600" fill="url(#rayGrad1)" />
            <polygon points="780,0 910,0 860,600 680,600" fill="url(#rayGrad2)" />
            <polygon points="20,0 120,0 220,600 80,600" fill="url(#rayGrad1)" />
          </svg>
        </div>
      )}

      {/* Layer 2: Particle Canvas (Bioluminescent Marine Snow) */}
      {!config.lowPerformanceMode && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* Layer 3: Rising Bubbles with Soft Shimmer */}
      {config.showBubbles && !config.lowPerformanceMode && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ opacity: config.visualIntensity }}
        >
          {bubbles.map((b) => (
            <div
              key={b.id}
              className="absolute rounded-full border border-white/50 bg-gradient-to-tr from-white/30 via-white/10 to-transparent shadow-sm"
              style={{
                left: `${b.x}%`,
                bottom: '-40px',
                width: `${b.size}px`,
                height: `${b.size}px`,
                animation: `underwaterBubbleRise ${config.reduceMotion ? 30 : b.speed}s linear infinite`,
                animationDelay: `${b.delay}s`,
                filter: 'drop-shadow(0 2px 4px rgba(0, 80, 160, 0.25))'
              }}
            >
              {/* Highlight Glint on Bubble */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          ))}
        </div>
      )}

      {/* Layer 4: Distant Subtle Giant Sea Creature Silhouette (Manta Ray gliding across deep background) */}
      {!config.lowPerformanceMode && !config.reduceMotion && (
        <div
          className="absolute pointer-events-none opacity-15 mix-blend-overlay"
          style={{
            bottom: '22%',
            left: '-20%',
            width: '280px',
            height: '140px',
            animation: 'underwaterMantaGlide 65s ease-in-out infinite',
            animationDelay: '12s'
          }}
        >
          <svg viewBox="0 0 200 100" className="w-full h-full fill-current text-[#001f3f] dark:text-[#011428]">
            <path d="M 100,50 C 70,25 30,10 0,40 C 25,60 70,60 90,75 C 95,85 105,85 110,75 C 130,60 175,60 200,40 C 170,10 130,25 100,50 Z" />
            <path d="M 100,75 Q 100,95 102,100 Q 100,95 100,75" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      )}

      {/* Layer 5: Deep Ocean Bottom Fog Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 60%, rgba(2, 6, 18, 0.6) 100%)'
        }}
      />
    </div>
  );
};
