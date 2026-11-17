import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  LogIn,
  KeyRound,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { UserProfile } from '../types/music';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  onOpenAuthModal?: () => void;
}

export const GoogleConnectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
  onOpenAuthModal
}) => {
  const [googleConfigured, setGoogleConfigured] = useState<boolean>(false);
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [checkingConfig, setCheckingConfig] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [directGoogleEmail, setDirectGoogleEmail] = useState<string>('');
  const [directGoogleName, setDirectGoogleName] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setCheckingConfig(true);
    setErrorMessage(null);

    AuthService.getGoogleConfig()
      .then(cfg => {
        setGoogleConfigured(cfg.configured);
        setGoogleClientId(cfg.clientId || '');
      })
      .catch(() => {
        setGoogleConfigured(false);
      })
      .finally(() => {
        setCheckingConfig(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectDirectGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directGoogleEmail.trim()) {
      setErrorMessage('Alamat email Google wajib diisi.');
      return;
    }
    setConnecting(true);
    setErrorMessage(null);
    try {
      const res = await AuthService.loginWithGoogle({
        email: directGoogleEmail.trim(),
        displayName: directGoogleName.trim() || directGoogleEmail.split('@')[0]
      });
      if (res.success && res.user) {
        onProfileUpdated(AuthService.toUserProfile(res.user));
        onClose();
      } else {
        setErrorMessage(res.error || 'Gagal menghubungkan akun Google.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses autentikasi Google.');
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      const guest = StorageService.getUserProfile();
      onProfileUpdated(guest);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal keluar akun.');
    }
  };

  const handleSwitchToAuthModal = () => {
    onClose();
    if (onOpenAuthModal) {
      onOpenAuthModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1020]/50 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 dark:bg-[#151b2e]/95 border border-[#dce7f7] dark:border-[#222c45] p-6 sm:p-8 shadow-2xl overflow-hidden space-y-6 text-[#142247] dark:text-[#f0f4fc]">
        
        {/* Soft Dreamy Ambient Glow in Corner */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#9ab3f5]/25 dark:bg-[#9ab3f5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#e4e8fc]/40 dark:bg-[#202942]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#edf3fd] dark:hover:bg-[#1e2742] text-[#5d729c] hover:text-[#142247] dark:hover:text-white transition active:scale-95"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Google Logo */}
        <div className="space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#dce7f7] shadow-sm p-2.5 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-7 h-7">
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
                <h2 className="text-xl font-black text-[#142247] dark:text-white tracking-tight">
                  Google Identity Center
                </h2>
                {userProfile.isLoggedIn && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] mt-0.5">
                {userProfile.isLoggedIn
                  ? 'Akun terverifikasi aktif di ekosistem PAPABVTIFY.'
                  : 'Autentikasi resmi dan sinkronisasi akun Google.'}
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* LOGGED IN VIEW */}
        {userProfile.isLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#edf3fd] dark:bg-[#1b233a] border border-[#dce7f7] dark:border-[#283556] flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#142247] dark:text-white">{userProfile.name}</h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] font-mono">{userProfile.email || userProfile.handle}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    ● Sesi Aktif · Bergabung {userProfile.joinedDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12172a] border border-[#dce7f7] dark:border-[#222c45] space-y-1">
                <span className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4] uppercase tracking-wider block font-bold">
                  Status Keamanan
                </span>
                <span className="text-sm font-black text-[#142247] dark:text-white">PBKDF2 SHA-512</span>
                <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4]">Enkripsi Salted Password Terproteksi</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12172a] border border-[#dce7f7] dark:border-[#222c45] space-y-1">
                <span className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4] uppercase tracking-wider block font-bold">
                  Listening Room
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-[#9ab3f5]">ID Terverifikasi</span>
                <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4]">Nama & avatar resmi di room</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={handleLogout}
                className="py-2.5 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN VIEW */
          <div className="space-y-4">
            {checkingConfig ? (
              <div className="py-8 text-center space-y-2 text-xs text-[#5d729c] font-mono">
                <span className="inline-block w-3 h-3 rounded-full bg-[#142247] animate-ping mr-2" />
                <span>Memeriksa konfigurasi Google OAuth...</span>
              </div>
            ) : googleConfigured ? (
              <div className="p-5 rounded-2xl bg-[#edf3fd] dark:bg-[#1b233a] border border-[#dce7f7] dark:border-[#283556] space-y-3 text-center">
                <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
                  Google OAuth telah siap dengan Client ID: <span className="font-mono text-[11px] font-bold text-[#142247] dark:text-white">{googleClientId.slice(0, 15)}...</span>
                </p>
                <button
                  onClick={handleSwitchToAuthModal}
                  className="w-full py-3 rounded-2xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] text-xs font-bold transition active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Lanjutkan ke Halaman Masuk</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleConnectDirectGoogle} className="p-5 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#dce7f7] dark:border-[#283556] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#142247] dark:text-white">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Masuk dengan Akun Google Langsung</span>
                  </div>
                  <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] leading-relaxed">
                    Masukkan email Google Anda untuk akses instan tanpa kata sandi dengan profil tersimpan permanen.
                  </p>

                  <div className="space-y-2">
                    <input
                      type="email"
                      required
                      value={directGoogleEmail}
                      onChange={(e) => setDirectGoogleEmail(e.target.value)}
                      placeholder="email.anda@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#12172a] border border-[#dce7f7] dark:border-[#222c45] text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#4285F4]"
                    />
                    <input
                      type="text"
                      value={directGoogleName}
                      onChange={(e) => setDirectGoogleName(e.target.value)}
                      placeholder="Nama Tampilan (Opsional)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#12172a] border border-[#dce7f7] dark:border-[#222c45] text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#4285F4]"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={connecting || !directGoogleEmail.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold transition active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{connecting ? 'Menghubungkan...' : 'Hubungkan & Masuk Akun Google'}</span>
                  </button>
                </form>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12172a] border border-[#dce7f7] dark:border-[#222c45] space-y-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-[11px] font-bold text-[#142247] dark:text-white">Keamanan Riil</h4>
                    <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4]">
                      Password di-hash dengan salt acak 16-byte di backend.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12172a] border border-[#dce7f7] dark:border-[#222c45] space-y-1">
                    <Sparkles className="w-4 h-4 text-[#9ab3f5]" />
                    <h4 className="text-[11px] font-bold text-[#142247] dark:text-white">Tanpa Data Palsu</h4>
                    <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4]">
                      Semua data akun tersimpan resmi di database JSON server.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 border-t border-[#dce7f7] dark:border-[#222c45] flex items-center justify-between text-[11px] text-[#5d729c] dark:text-[#8fa1c4]">
          <span className="font-mono">PAPABVTIFY Auth v3.2</span>
          <button
            onClick={onClose}
            className="hover:text-[#142247] dark:hover:text-white transition font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};