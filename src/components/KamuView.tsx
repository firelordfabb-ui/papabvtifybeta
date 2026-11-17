import React from 'react';
import { AppTheme } from '../types/music';
import {
  User,
  ShieldCheck,
  Moon,
  Sun,
  Sparkles,
  RefreshCw,
  Bell,
  Heart,
  Headphones,
  Check
} from 'lucide-react';

interface Props {
  currentTheme: AppTheme;
  onThemeToggle: () => void;
  onOpenGoogleConnect: () => void;
}

export const KamuView: React.FC<Props> = ({
  currentTheme,
  onThemeToggle,
  onOpenGoogleConnect
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto px-4 sm:px-8 pt-6 pb-48 space-y-6 max-w-4xl mx-auto animate-fadeIn select-none">
      <div className="space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Pengaturan & Akun
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Kamu
        </h1>
      </div>

      {/* Google Connect Card */}
      <div
        onClick={onOpenGoogleConnect}
        className="rounded-3xl p-5 liquid-glass-card border border-slate-200/80 cursor-pointer group hover:scale-[1.01] transition-all bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white p-2.5 shadow-md flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                Hubungkan Akun Google
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sinkronisasi playlist YouTube Music & lagu yang disukai secara otomatis.
            </p>
          </div>
        </div>

        <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm shrink-0">
          Hubungkan
        </button>
      </div>

      {/* Theme & Appearance Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Tampilan
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onThemeToggle()}
            className={`p-4 rounded-2xl liquid-glass-card flex items-center justify-between transition-all ${
              currentTheme === 'liquid_glass_light'
                ? 'ring-2 ring-slate-900 bg-white'
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Liquid Glass Light</h4>
                <p className="text-[10px] text-slate-400">Minimalis bersih (Foto referensi)</p>
              </div>
            </div>
            {currentTheme === 'liquid_glass_light' && (
              <Check className="w-4 h-4 text-slate-900" />
            )}
          </button>

          <button
            onClick={() => onThemeToggle()}
            className={`p-4 rounded-2xl liquid-glass-card flex items-center justify-between transition-all ${
              currentTheme === 'liquid_glass_dark'
                ? 'ring-2 ring-slate-900 bg-white'
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Liquid Glass Dark</h4>
                <p className="text-[10px] text-slate-400">Matte modern malam hari</p>
              </div>
            </div>
            {currentTheme === 'liquid_glass_dark' && (
              <Check className="w-4 h-4 text-slate-900" />
            )}
          </button>
        </div>
      </div>

      {/* App Stats */}
      <div className="p-5 rounded-3xl liquid-glass-card space-y-3 border border-slate-200/80">
        <h3 className="text-sm font-black text-slate-900">
          Tentang papabvtify
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          papabvtify adalah pemutar musik modern tanpa iklan dengan mesin InnerTube YouTube Music langsung, HTTP Partial Content 206 seek duration, sinkronisasi lirik LRCLIB, dan radio dunia 24 jam.
        </p>
        <div className="pt-2 text-[11px] font-mono font-bold text-slate-400">
          Versi 2.5.0 • Minimalist Liquid Glass Engine
        </div>
      </div>
    </div>
  );
};
