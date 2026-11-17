// ============================================================================
// PAPABVTIFY — Authentic Non-AI Avatar Generator & Illustrative Icons
// ============================================================================

const PALETTES = [
  { bg: '#ff442b', fg: '#ffffff', label: 'Vermillion' },
  { bg: '#1c1d27', fg: '#f59e0b', label: 'Graphite Gold' },
  { bg: '#2563eb', fg: '#ffffff', label: 'Electric Blue' },
  { bg: '#059669', fg: '#ffffff', label: 'Emerald' },
  { bg: '#7c3aed', fg: '#ffffff', label: 'Deep Violet' },
  { bg: '#0f172a', fg: '#38bdf8', label: 'Obsidian Cyan' },
];

/**
 * Generates an elegant SVG Data URI containing initial monogram
 */
export function generateInitialAvatar(name: string, variant = 0): string {
  const cleanName = (name || 'P').trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : cleanName.slice(0, 2).toUpperCase();

  if (!initials) initials = 'P';

  const palette = PALETTES[Math.abs(variant) % PALETTES.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="30" fill="${palette.bg}"/>
    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
    <text x="60" y="69" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="44" font-weight="900" fill="${palette.fg}" text-anchor="middle" letter-spacing="-1.5">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an abstract geometric vector art avatar (Bauhaus / Swiss minimalist)
 */
export function generateGeometricAvatar(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const p1 = PALETTES[Math.abs(hash) % PALETTES.length];
  const p2 = PALETTES[Math.abs(hash >> 3) % PALETTES.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="28" fill="${p1.bg}"/>
    <circle cx="36" cy="36" r="24" fill="${p2.bg}" opacity="0.85"/>
    <polygon points="60,20 100,60 60,100" fill="rgba(255,255,255,0.15)"/>
    <rect x="25" y="65" width="45" height="35" rx="8" fill="rgba(255,255,255,0.9)"/>
    <circle cx="85" cy="85" r="16" fill="${p2.fg}"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Curated Original Illustrative Audio Avatars (Non-human, artistic music glyphs)
 */
export const ILLUSTRATIVE_AVATARS = [
  {
    id: 'vinyl',
    label: 'Piringan Hitam (Vinyl)',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect width="120" height="120" rx="28" fill="#111218"/>
        <circle cx="60" cy="60" r="46" fill="#090a0f" stroke="#ff442b" stroke-width="2.5"/>
        <circle cx="60" cy="60" r="34" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5" stroke-dasharray="3,3"/>
        <circle cx="60" cy="60" r="22" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
        <circle cx="60" cy="60" r="12" fill="#ff442b"/>
        <circle cx="60" cy="60" r="4" fill="#ffffff"/>
      </svg>
    `)}`
  },
  {
    id: 'headphones',
    label: 'Studio Monitor',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect width="120" height="120" rx="28" fill="#1c1d27"/>
        <path d="M30 65 A30 30 0 0 1 90 65" fill="none" stroke="#f59e0b" stroke-width="7" stroke-linecap="round"/>
        <rect x="22" y="58" width="16" height="32" rx="8" fill="#ffffff"/>
        <rect x="82" y="58" width="16" height="32" rx="8" fill="#ffffff"/>
        <line x1="60" y1="28" x2="60" y2="35" stroke="#f59e0b" stroke-width="3"/>
      </svg>
    `)}`
  },
  {
    id: 'tape',
    label: 'Kaset Pita Analog',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect width="120" height="120" rx="28" fill="#181924"/>
        <rect x="22" y="32" width="76" height="56" rx="10" fill="#2563eb"/>
        <rect x="32" y="44" width="56" height="26" rx="6" fill="#0f172a"/>
        <circle cx="44" cy="57" r="7" fill="#ffffff"/>
        <circle cx="76" cy="57" r="7" fill="#ffffff"/>
        <polygon points="52,78 68,78 64,88 56,88" fill="#f8fafc" opacity="0.8"/>
      </svg>
    `)}`
  },
  {
    id: 'synth',
    label: 'Synthesizer Wave',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect width="120" height="120" rx="28" fill="#090a0f"/>
        <path d="M20 60 Q35 25 50 60 T80 60 T100 60" fill="none" stroke="#059669" stroke-width="6" stroke-linecap="round"/>
        <rect x="26" y="80" width="12" height="18" rx="2" fill="#ffffff"/>
        <rect x="42" y="80" width="12" height="18" rx="2" fill="#ffffff"/>
        <rect x="58" y="80" width="12" height="18" rx="2" fill="#ffffff"/>
        <rect x="74" y="80" width="12" height="18" rx="2" fill="#ffffff"/>
      </svg>
    `)}`
  }
];

/**
 * Returns a valid, non-dummy avatar for any user.
 * If user has uploaded avatar (data:image) or chosen SVG, returns it.
 * If user has dummy unsplash face or no avatar, falls back to clean initial monogram.
 */
export function getEffectiveAvatar(user?: { avatar?: string; displayName?: string; name?: string; username?: string }): string {
  if (!user) return generateInitialAvatar('P');

  // Check if avatar is valid and NOT an external dummy photo
  if (user.avatar && (user.avatar.startsWith('data:image/') || user.avatar.startsWith('blob:'))) {
    return user.avatar;
  }

  // Fallback to initial monogram with deterministic color
  const name = user.displayName || user.name || user.username || 'User';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }

  return generateInitialAvatar(name, hash);
}
