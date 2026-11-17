import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Zap, Palette, Clock, Trash2, Heart, Server, Wifi, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiConfig, DEFAULT_LAN_SERVER } from '../services/apiConfig';
import { StorageService } from '../services/storage';

export const SettingsView: React.FC = () => {
  const [themeMode, setThemeMode] = useState<'fantasy_light' | 'fantasy_dark'>('fantasy_light');
  const [perfMode, setPerfMode] = useState<'full' | 'balanced' | 'lite'>('full');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  // Backend Server Connection State
  const [serverUrlInput, setServerUrlInput] = useState<string>(() => ApiConfig.getServerBaseUrl());
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    testConnection(ApiConfig.getServerBaseUrl());
  }, []);

  const testConnection = async (urlToTest: string) => {
    setConnectionStatus('testing');
    setStatusMessage('Menguji sambungan ke server backend...');
    try {
      const cleanUrl = urlToTest.trim().replace(/\/+$/, '');
      const testEndpoint = cleanUrl ? `${cleanUrl}/api/auth/google/status` : '/api/auth/google/status';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(testEndpoint, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        setConnectionStatus('connected');
        setStatusMessage(`Terhubung dengan server (${cleanUrl || 'Localhost'})! Data akun & musik tersinkronisasi.`);
      } else {
        setConnectionStatus('error');
        setStatusMessage(`Server merespon dengan status ${res.status}.`);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setStatusMessage(`Gagal terhubung. Pastikan PC dan HP berada di jaringan Wi-Fi yang sama.`);
    }
  };

  const handleSaveServerUrl = () => {
    ApiConfig.setServerBaseUrl(serverUrlInput);
    testConnection(serverUrlInput);
  };

  const handleSetPresetServer = (preset: string) => {
    setServerUrlInput(preset);
    ApiConfig.setServerBaseUrl(preset);
    testConnection(preset);
  };

  const handleClearCache = () => {
    localStorage.clear();
    alert('Cache pemutaran dan lirik lokal berhasil dibersihkan!');
  };

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-12 py-6 sm:py-8 space-y-6 sm:space-y-7 select-none max-w-4xl mx-auto animate-fadeIn pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#dce7f7] dark:border-[#202942]">
        <div className="w-9 h-9 rounded-xl bg-[#142247] dark:bg-white text-white dark:text-[#142247] flex items-center justify-center shadow-sm">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#142247] dark:text-white tracking-tight">
            Pengaturan & Kustomisasi
          </h2>
          <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
            Kelola koneksi backend, timer tidur, kinerja audio DSP, dan pemeliharaan memori.
          </p>
        </div>
      </div>

      {/* Backend Server Connection & Synchronization (Crucial for Android <-> Windows Parity) */}
      <div className="fantasy-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#142247] dark:text-white">
            <Server className="w-4 h-4 text-[#7d9bf0]" />
            <span>Koneksi Backend & Sinkronisasi Silang Platform</span>
          </div>
          <div className="flex items-center gap-1.5">
            {connectionStatus === 'connected' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terhubung</span>
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-200/50 dark:border-red-800/50">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Terputus</span>
              </span>
            )}
            {connectionStatus === 'testing' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji...</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] leading-relaxed">
          Agar versi Android dan Windows saling terhubung ke database akun, playlist, lagu yang disukai, dan Dengar Bersama (Listening Room) yang sama, arahkan alamat ke host server PAPABVTIFY.
        </p>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="http://192.168.1.10:5188"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-[#151b2e]/90 border border-[#dce7f7] dark:border-[#222c45] text-xs font-mono font-semibold text-[#142247] dark:text-[#f0f4fc] placeholder-[#879abf] focus:outline-none focus:ring-2 focus:ring-[#9ab3f5]/50 shadow-sm"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => testConnection(serverUrlInput)}
                disabled={connectionStatus === 'testing'}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-[#142247] dark:text-[#9ab3f5] text-xs font-bold hover:opacity-85 transition active:scale-95 shadow-xs"
              >
                Uji Sambungan
              </button>
              <button
                onClick={handleSaveServerUrl}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#142247] text-white dark:bg-white dark:text-[#142247] text-xs font-bold hover:opacity-90 transition active:scale-95 shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-[#5d729c] dark:text-[#8fa1c4]">Pilihan Cepat:</span>
            <button
              onClick={() => handleSetPresetServer(DEFAULT_LAN_SERVER)}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#edf3fd] dark:bg-[#1a233b] text-[#2c4b9b] dark:text-[#9ab3f5] border border-[#d2e2f8] dark:border-[#283556] hover:opacity-80 transition"
            >
              Wi-Fi Host ({DEFAULT_LAN_SERVER})
            </button>
            <button
              onClick={() => handleSetPresetServer('http://127.0.0.1:5188')}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#edf3fd] dark:bg-[#1a233b] text-[#2c4b9b] dark:text-[#9ab3f5] border border-[#d2e2f8] dark:border-[#283556] hover:opacity-80 transition"
            >
              Localhost (127.0.0.1:5188)
            </button>
          </div>

          {statusMessage && (
            <p className={`text-[11px] font-medium leading-relaxed ${
              connectionStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : connectionStatus === 'error' ? 'text-red-500' : 'text-[#5d729c] dark:text-[#8fa1c4]'
            }`}>
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* Theme Selection */}
      <div className="fantasy-card p-5 sm:p-6 space-y-4">
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
      <div className="fantasy-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#142247] dark:text-white">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Mode Optimasi Kinerja & Animasi</span>
        </div>
        <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
          Sesuaikan konsumsi rendering GPU agar aplikasi selalu ringan di HP atau PC dengan spesifikasi apapun.
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
      <div className="fantasy-card p-5 sm:p-6 space-y-4">
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
      <div className="fantasy-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
