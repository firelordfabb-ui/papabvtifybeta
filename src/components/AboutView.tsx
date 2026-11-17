import React from 'react';
import {
  Heart,
  Sparkles,
  Shield,
  Code2,
  ExternalLink,
  Cpu,
  Edit3,
  CheckCircle2,
  Calendar,
  Music,
  Headphones,
  Flame,
  LogOut,
  LogIn,
  AtSign,
  UserCheck,
  Disc3,
  Layers,
  Radio,
  Sliders
} from 'lucide-react';
import { UserProfile } from '../types/music';
import { StorageService } from '../services/storage';

const InstagramIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

interface Props {
  userProfile: UserProfile;
  onOpenEditProfile: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const AboutView: React.FC<Props> = ({
  userProfile,
  onOpenEditProfile,
  onOpenAuth,
  onLogout
}) => {
  const stats = StorageService.getListeningStats();
  const totalMinutes = Math.floor(stats.totalListeningSeconds / 60);
  const favoritesCount = StorageService.getFavorites().length;

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-7 pb-36 animate-fadeIn select-none text-[#142247] dark:text-[#f0f4fc] max-w-6xl mx-auto">
      
      {/* ==============================================================
          SECTION 1: MEMBER IDENTITY PASS (DREAMY FANTASY CARD)
          ============================================================== */}
      <div className="p-6 sm:p-8 space-y-6 rounded-3xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] shadow-sm relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-[#9ab3f5]/20 via-[#e4e8fc]/10 to-transparent pointer-events-none" />

        {/* Pass Top Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dce7f7] dark:border-[#222c45] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#142247] dark:bg-[#9ab3f5]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#5d729c] dark:text-[#8fa1c4] font-bold">
              PAPABVTIFY MEMBER PASS · № {userProfile.id.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {userProfile.isLoggedIn ? (
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>TERVERIFIKASI RESMI</span>
              </span>
            ) : (
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5d729c] dark:text-[#8fa1c4] border border-[#dce7f7] dark:border-[#283556] bg-[#edf3fd] dark:bg-[#1a233b] px-3 py-1 rounded-full">
                AKUN TAMU (GUEST)
              </span>
            )}
          </div>
        </div>

        {/* Member Identity Main Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Genuine Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-[#dce7f7] dark:border-[#283556] bg-[#edf3fd] dark:bg-[#0c101c] shrink-0 overflow-hidden shadow-sm">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white tracking-tight">
                {userProfile.name}
              </h2>
              <div className="flex items-center gap-3 text-xs font-mono text-[#5d729c] dark:text-[#8fa1c4]">
                <span className="text-[#233876] dark:text-[#9ab3f5] font-bold">{userProfile.handle}</span>
                {userProfile.email && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{userProfile.email}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] font-medium pt-0.5">
                Bergabung sejak: <span className="font-bold text-[#142247] dark:text-white">{userProfile.joinedDate}</span>
              </p>
            </div>
          </div>

          {/* Member Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {userProfile.isLoggedIn ? (
              <>
                <button
                  onClick={onOpenEditProfile}
                  className="px-4 py-2 bg-[#142247] text-white dark:bg-white dark:text-[#142247] rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 active:scale-95 border border-rose-500/25 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] text-xs font-mono font-black uppercase tracking-wider rounded-xl transition flex items-center gap-2 active:scale-95 shadow-md cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Buat Akun</span>
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {userProfile.bio && (
          <p className="text-xs sm:text-sm text-[#5d729c] dark:text-[#8fa1c4] leading-relaxed border-t border-[#dce7f7] dark:border-[#222c45] pt-4">
            {userProfile.bio}
          </p>
        )}

        {/* Favorite Genres Pills */}
        {userProfile.favoriteGenres && userProfile.favoriteGenres.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5d729c] dark:text-[#8fa1c4]">
              Preferensi Musik:
            </span>
            {userProfile.favoriteGenres.map((g) => (
              <span
                key={g}
                className="px-3 py-1 rounded-full bg-[#edf3fd] dark:bg-[#1a233b] text-[#142247] dark:text-[#9ab3f5] text-[11px] font-semibold border border-[#d2e2f8] dark:border-[#283556]"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ==============================================================
          SECTION 2: AUTHENTIC LISTENING METRICS (REAL DATA ONLY)
          ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#5d729c] dark:text-[#8fa1c4] font-mono text-[10px] uppercase font-bold">
            <span>Waktu Dengar</span>
            <Headphones className="w-3.5 h-3.5 text-[#142247] dark:text-[#9ab3f5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white font-mono">{totalMinutes}</div>
          <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4]">Total menit pemutaran</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#5d729c] dark:text-[#8fa1c4] font-mono text-[10px] uppercase font-bold">
            <span>Lagu Diputar</span>
            <Music className="w-3.5 h-3.5 text-[#5d729c]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white font-mono">{stats.totalSongsPlayed}</div>
          <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4]">Lagu yang telah disimak</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#5d729c] dark:text-[#8fa1c4] font-mono text-[10px] uppercase font-bold">
            <span>Disimpan</span>
            <Heart className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white font-mono">{favoritesCount}</div>
          <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4]">Lagu di Pustaka Pribadi</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#5d729c] dark:text-[#8fa1c4] font-mono text-[10px] uppercase font-bold">
            <span>Listening Room</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white font-mono">Realtime</div>
          <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4]">Sinkronisasi Audio Host</p>
        </div>
      </div>

      {/* ==============================================================
          SECTION 3: OFFICIAL CREATOR MONOGRAPH (FABB)
          ============================================================== */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] space-y-5 shadow-sm text-center relative overflow-hidden">
        {/* Soft Dreamy Ambient Aura */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#edf3fd]/60 dark:from-[#1b233a]/30 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-xl mx-auto space-y-4 relative z-10">
          <span className="font-mono text-[10px] font-extrabold tracking-widest uppercase text-[#142247] dark:text-[#9ab3f5] border border-[#d2e2f8] dark:border-[#283556] px-3.5 py-1.5 bg-[#edf3fd] dark:bg-[#1a233b] rounded-full inline-block">
            OFFICIAL CREATOR MONOGRAPH
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-[#142247] dark:text-white tracking-tight">
            PAPABVTIFY
          </h2>

          <p className="text-sm font-bold text-[#344b7d] dark:text-[#9ab3f5]">
            Music Without Limits · Dibuat oleh Fabb
          </p>

          <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] leading-relaxed">
            Aplikasi pemutar musik independen tanpa iklan komersial. Dilengkapi studio Audio Lab 10-Band EQ, lirik tersinkronisasi presisi 16ms, visualizer 60 FPS, sistem pengajuan lagu Dengar Bersama (Listening Room), dan katalog radio dunia.
          </p>

          <div className="pt-3">
            <a
              href="https://instagram.com/fabbvvnvm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#142247] text-white dark:bg-white dark:text-[#142247] font-mono text-xs font-extrabold uppercase tracking-wider rounded-2xl transition shadow-md active:scale-95 hover:opacity-90"
            >
              <InstagramIcon />
              <span>Instagram: @fabbvvnvm</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* ==============================================================
          SECTION 4: SYSTEM & ENGINE SPECIFICATIONS
          ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#dce7f7] dark:border-[#222c45] pb-2.5">
            <Cpu className="w-4 h-4 text-[#142247] dark:text-[#9ab3f5]" />
            <h3 className="text-xs font-mono font-bold uppercase text-[#142247] dark:text-white">Spesifikasi Arsitektur Sistem</h3>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-[#dce7f7]/60 dark:border-[#222c45]">
              <span className="text-[#5d729c] dark:text-[#8fa1c4]">Versi Rilis</span>
              <span className="text-[#142247] dark:text-white font-extrabold">v3.2.0 (Fantasy Release)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#dce7f7]/60 dark:border-[#222c45]">
              <span className="text-[#5d729c] dark:text-[#8fa1c4]">Kreator</span>
              <span className="text-[#142247] dark:text-white font-bold">Fabb (@fabbvvnvm)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#dce7f7]/60 dark:border-[#222c45]">
              <span className="text-[#5d729c] dark:text-[#8fa1c4]">Audio DSP Engine</span>
              <span className="text-[#233876] dark:text-[#9ab3f5] font-semibold">64-bit Float Web Audio API</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#dce7f7]/60 dark:border-[#222c45]">
              <span className="text-[#5d729c] dark:text-[#8fa1c4]">Keamanan Autentikasi</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">PBKDF2 SHA-512 Salted Hash</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#5d729c] dark:text-[#8fa1c4]">Lisensi</span>
              <span className="text-[#142247] dark:text-white font-medium">© 2026 PAPABVTIFY · All Rights Reserved</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#dce7f7] dark:border-[#222c45] pb-2.5">
            <Code2 className="w-4 h-4 text-[#142247] dark:text-[#9ab3f5]" />
            <h3 className="text-xs font-mono font-bold uppercase text-[#142247] dark:text-white">Ekosistem & Dependensi Terverifikasi</h3>
          </div>

          <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] leading-relaxed">
            Platform dibangun dengan fondasi teknologi standar industri tanpa simulasi palsu atau avatar AI generatif:
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {['React 18', 'TypeScript', 'Tailwind CSS', 'Vite 5', 'Node Crypto', 'Web Audio API', 'LRCLIB Synced', 'InnerTube Direct'].map((tech) => (
              <span key={tech} className="px-2.5 py-1 bg-[#edf3fd] dark:bg-[#1a233b] border border-[#dce7f7] dark:border-[#283556] rounded-xl text-[10px] font-mono font-semibold text-[#142247] dark:text-[#9ab3f5]">
                {tech}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] pt-1">
            Pengalaman mendengarkan musik yang bersih, bebas iklan komersial, responsif, dan artistik.
          </p>
        </div>
      </div>
    </div>
  );
};