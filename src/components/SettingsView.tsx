import React, { useState } from 'react';
import { Settings as SettingsIcon, Zap, Palette, Clock, Trash2, Heart, ShieldCheck } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [themeMode, setThemeMode] = useState<'fantasy_light' | 'fantasy_dark'>('fantasy_light');
  const [perfMode, setPerfMode] = useState<'full' | 'balanced' | 'lite'>('full');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  const handleClearCache = () => {
    localStorage.clear();
    alert('Cache pemutaran dan lirik lokal berhasil dibersihkan!');
  };

  return (
    <div className="h-full overflow-y-auto px-6 sm:px-12 py-8 space-y-7 select-none max-w-4xl mx-auto animate-fadeIn pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#dce7f7] dark:border-[#202942]">
        <div className="w-9 h-9 rounded-xl bg-[#142247] dark:bg-white text-white dark:text-[#142247] flex items-center justify-center shadow-sm">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#142247] dark:text-white tracking-tight">
            Pengaturan & Kustomisasi
          </h2>
          <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
            Kelola preferensi antarmuka, timer tidur, kinerja audio DSP, dan pemeliharaan memori.
          </p>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="fantasy-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#142247] dark:text-white">
          <Palette className="w-4 h-4 text-[#7d9bf0]" />
          <span>Tema & Nuansa Visual</span>
        </div>
        <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
          Pilih antara nuansa Dreamy Fantasy pastel biru lembut atau Obsidian Night kontras tinggi.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[
            { id: 'fantasy_light', name: 'Dreamy Fantasy (Default)', desc: 'Soft Ice Blue, Lavender, Cloud White, dan maskot chibi.' },
            { id: 'fantasy_dark', name: 'Obsidian Night (OLED)', desc: 'Midnight Navy pekat dengan kontras aksen periwinkle halus.' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setThemeMode(t.id as any)}
              className={`p-4 rounded-2xl text-left border transition-all active:scale-95 ${
                themeMode === t.id
                  ? 'bg-[#e3edfc] dark:bg-[#1f2842] border-[#a8c6f8] dark:border-[#3b4e7a] shadow-sm'
                  : 'bg-white/60 dark:bg-white/5 border-[#dce7f7] dark:border-[#202942] hover:border-[#b8d1f8]'
              }`}
            >
              <h4 className="text-xs font-bold text-[#142247] dark:text-white">{t.name}</h4>
              <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] mt-1 leading-relaxed">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Performance Profile */}
      <div className="fantasy-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#142247] dark:text-white">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Mode Optimasi Kinerja PC & Animasi</span>
        </div>
        <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
          Sesuaikan konsumsi rendering GPU agar aplikasi selalu ringan di komputer atau laptop dengan spesifikasi apapun.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: 'full', label: 'Penuh (Fluid 60 FPS + Efek Bintang)' },
            { id: 'balanced', label: 'Seimbang (Rekomendasi Hemat Daya)' },
            { id: 'lite', label: 'Ringan (Ultra Low RAM)' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPerfMode(p.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition active:scale-95 ${
                perfMode === p.id
                  ? 'bg-[#142247] text-white dark:bg-white dark:text-[#142247] shadow-sm'
                  : 'fantasy-pill'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sleep Timer */}
      <div className="fantasy-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#142247] dark:text-white">
          <Clock className="w-4 h-4 text-[#7d9bf0]" />
          <span>Timer Tidur Otomatis (Sleep Timer)</span>
        </div>
        <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
          Otomatis hentikan alunan musik jika Anda tertidur diiringi lagu santai.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { val: null, label: 'Nonaktif' },
            { val: 15, label: '15 Menit' },
            { val: 30, label: '30 Menit' },
            { val: 45, label: '45 Menit' },
            { val: 60, label: '1 Jam' },
          ].map((timer, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSleepTimer(timer.val);
                if (timer.val) alert(`Timer tidur diatur untuk ${timer.val} menit.`);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition active:scale-95 ${
                sleepTimer === timer.val
                  ? 'bg-[#142247] text-white dark:bg-white dark:text-[#142247] shadow-sm'
                  : 'fantasy-pill'
              }`}
            >
              {timer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cache & Maintenance */}
      <div className="fantasy-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-[#142247] dark:text-white">
            Bersihkan Cache & Penyimpanan Sementara
          </h4>
          <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] mt-0.5">
            Menghapus cache audio stream dan lirik lokal untuk membebaskan ruang penyimpanan disk.
          </p>
        </div>
        <button
          onClick={handleClearCache}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition active:scale-95 self-start sm:self-auto shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Bersihkan Cache</span>
        </button>
      </div>

      {/* Brand Signoff */}
      <div className="p-6 rounded-2xl border border-[#dce7f7] dark:border-[#202942] text-center space-y-2 text-[#5d729c] dark:text-[#8fa1c4] text-xs">
        <p className="font-bold text-[#142247] dark:text-white">
          PAPABVTIFY — Fantasy Music Experience v3.0
        </p>
        <p className="flex items-center justify-center gap-1.5 text-[11px]">
          <span>Made with passion by Fabb</span>
          <Heart className="w-3 h-3 text-pink-500 fill-current" />
          <span>(@fabbvvnvm)</span>
        </p>
      </div>
    </div>
  );
};
