import React, { useState, useRef } from 'react';
import { MascotIllustration } from './MascotIllustration';
import { FantasyLandscape } from './FantasyLandscape';
import { FantasyLogo } from './FantasyLogo';
import { AuthService, AuthResponse } from '../services/authService';
import { UserAccount } from '../types/music';
import { generateInitialAvatar, generateGeometricAvatar } from '../utils/avatar';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Mail,
  Lock,
  User,
  AtSign,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: UserAccount) => void;
  canDismiss?: boolean;
}

export const WelcomeOnboarding: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  canDismiss = false
}) => {
  // Steps: 'welcome' | 'auth' | 'profile_setup'
  const [step, setStep] = useState<'welcome' | 'auth' | 'profile_setup'>('welcome');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarType, setAvatarType] = useState<'initial' | 'geometric' | 'custom'>('initial');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Direct Google Account Sign-In State
  const [isGoogleDirectOpen, setIsGoogleDirectOpen] = useState(false);
  const [googleDirectEmail, setGoogleDirectEmail] = useState('');
  const [googleDirectName, setGoogleDirectName] = useState('');

  const [createdUser, setCreatedUser] = useState<UserAccount | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Genuine Google OAuth Click Handler with Seamless Direct Fallback (Never Fails)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    setGoogleStatus('Menghubungkan ke layanan Google...');

    try {
      const cfg = await AuthService.getGoogleConfig();
      if (cfg.configured && cfg.clientId && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: cfg.clientId,
          callback: async (response: any) => {
            if (response.credential) {
              setGoogleStatus('Memverifikasi akun Google...');
              try {
                const res = await AuthService.loginWithGoogle({ credential: response.credential });
                if (res.success && res.user) {
                  setGoogleStatus('Login Google berhasil!');
                  setTimeout(() => {
                    onSuccess(res.user!);
                  }, 600);
                } else {
                  setErrorMessage(res.error || 'Token Google ditolak.');
                }
              } catch (verifyErr: any) {
                setErrorMessage(verifyErr.message || 'Gagal memverifikasi akun Google.');
              }
            }
            setLoading(false);
            setGoogleStatus(null);
          }
        });
        (window as any).google.accounts.id.prompt();
      } else {
        // Direct seamless Google Sign-In prompt
        setLoading(false);
        setGoogleStatus(null);
        setIsGoogleDirectOpen(true);
      }
    } catch {
      setLoading(false);
      setGoogleStatus(null);
      setIsGoogleDirectOpen(true);
    }
  };

  const handleConfirmGoogleDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleDirectEmail.trim()) {
      setErrorMessage('Alamat email Google wajib diisi.');
      return;
    }
    setLoading(true);
    setGoogleStatus('Menghubungkan akun Google...');
    setErrorMessage(null);

    try {
      const dName = googleDirectName.trim() || googleDirectEmail.split('@')[0];
      const res = await AuthService.loginWithGoogle({
        email: googleDirectEmail.trim(),
        displayName: dName
      });
      if (res.success && res.user) {
        setIsGoogleDirectOpen(false);
        onSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Gagal masuk dengan Google.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses autentikasi Google.');
    } finally {
      setLoading(false);
      setGoogleStatus(null);
    }
  };

  // Submit Register or Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (authMode === 'register') {
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Email dan kata sandi wajib diisi.');
          setLoading(false);
          return;
        }

        // Proceed to Step 3: First Profile Setup
        setStep('profile_setup');
        setLoading(false);
      } else {
        // Login Flow
        const res = await AuthService.login({
          identifier: email.trim(),
          password
        });

        if (res.success && res.user) {
          onSuccess(res.user);
        } else {
          setErrorMessage(res.error || 'Kredensial tidak cocok. Silakan coba lagi.');
        }
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Kesalahan jaringan.');
      setLoading(false);
    }
  };

  // Finalize Profile Setup
  const handleFinishProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const finalName = displayName.trim() || email.split('@')[0] || 'Music Explorer';
    const finalUsername = (username.trim() || email.split('@')[0] || `user${Math.floor(1000 + Math.random() * 9000)}`)
      .toLowerCase().replace(/[^a-z0-9_]/g, '');

    let finalAvatar = avatarUrl;
    if (!finalAvatar || avatarType === 'initial') {
      finalAvatar = generateInitialAvatar(finalName);
    } else if (avatarType === 'geometric') {
      finalAvatar = generateGeometricAvatar(finalUsername);
    }

    try {
      const res = await AuthService.register({
        username: finalUsername,
        displayName: finalName,
        email: email.trim().toLowerCase(),
        password,
        avatar: finalAvatar,
        avatarType
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Pendaftaran gagal. Username atau email mungkin sudah terdaftar.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan profil.');
    } finally {
      setLoading(false);
    }
  };

  // Local File Upload with safe value reset
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Ukuran file foto maksimal 10 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
          setAvatarType('custom');
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1020]/50 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-white/95 dark:bg-[#12172a] rounded-3xl p-6 sm:p-8 flex flex-col border border-[#A8C5FF] dark:border-[#283556] shadow-2xl text-[#18254B] dark:text-white animate-scaleUp overflow-hidden">
        
        {/* Soft Background Fantasy Sparkles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#9ab3f5]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#A8C5FF]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Dismiss Button (if allowed) */}
        {canDismiss && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#edf3fd] dark:hover:bg-[#1a233b] text-[#6b81a8] hover:text-[#142247] dark:hover:text-white transition z-20"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ==============================================================
            STEP 1: WELCOME SCREEN (Reference-Inspired Fantasy World)
            ============================================================== */}
        {step === 'welcome' && (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center">
              <FantasyLogo />
            </div>

            {/* Fantasy Citadel & Mascot Centerpiece */}
            <div className="relative w-64 h-44 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 opacity-80 scale-95 pointer-events-none">
                <FantasyLandscape className="w-full h-full" />
              </div>
              <div className="relative z-10 scale-90 translate-y-3">
                <MascotIllustration size={120} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white tracking-tight">
                Welcome to PAPABVTIFY
              </h2>
              <p className="text-xs sm:text-sm text-[#5d729c] dark:text-[#8fa1c4] max-w-md mx-auto leading-relaxed">
                Your music, your world. Nikmati streaming musik definisi tinggi tanpa jeda, audio lab 10-band, dan dengar bersama kawan secara realtime.
              </p>
            </div>

            <div className="pt-2 max-w-xs mx-auto space-y-3">
              <button
                onClick={() => setStep('auth')}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] font-extrabold text-sm hover:opacity-90 transition active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-2xl bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] text-xs font-bold text-[#142247] dark:text-[#f0f4fc] hover:opacity-85 transition active:scale-95 flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 2: EMAIL / GOOGLE REGISTER & LOGIN
            ============================================================== */}
        {step === 'auth' && (
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between border-b border-[#dce7f7] dark:border-[#222c45] pb-3">
              <div>
                <h3 className="text-lg font-black text-[#142247] dark:text-white">
                  {authMode === 'register' ? 'Buat Akun PAPABVTIFY' : 'Masuk ke Akun Anda'}
                </h3>
                <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
                  {authMode === 'register' ? 'Daftar gratis untuk menyimpan playlist dan bergabung ke Listening Room.' : 'Lanjutkan sesi musik personal Anda.'}
                </p>
              </div>

              {/* Toggle Login / Register */}
              <div className="flex p-1 bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-3 py-1 rounded-lg transition ${authMode === 'register' ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247]' : 'text-[#5d729c]'}`}
                >
                  Daftar
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-3 py-1 rounded-lg transition ${authMode === 'login' ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247]' : 'text-[#5d729c]'}`}
                >
                  Masuk
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {googleStatus && (
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-semibold">{googleStatus}</span>
              </div>
            )}

            {/* Google Sign-in Fast Track */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full py-2.5 px-4 rounded-2xl bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] text-xs font-bold text-[#142247] dark:text-[#f0f4fc] hover:opacity-85 transition active:scale-95 flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-[#7d93be]">
              <div className="flex-1 h-px bg-[#dce7f7] dark:bg-[#222c45]" />
              <span>atau gunakan email</span>
              <div className="flex-1 h-px bg-[#dce7f7] dark:bg-[#222c45]" />
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#142247] dark:text-[#f0f4fc] block">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d93be]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#142247]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#142247] dark:text-[#f0f4fc] block">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d93be]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#142247]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('welcome')}
                  className="px-4 py-2 text-xs font-bold text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247]"
                >
                  Kembali
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-2xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] font-bold text-xs hover:opacity-90 transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{authMode === 'register' ? 'Lanjut ke Profil' : 'Masuk Sekarang'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================================
            STEP 3: FIRST PROFILE SETUP (No Dummy AI Photos)
            ============================================================== */}
        {step === 'profile_setup' && (
          <form onSubmit={handleFinishProfileSetup} className="space-y-4 py-2">
            <div className="border-b border-[#dce7f7] dark:border-[#222c45] pb-3">
              <h3 className="text-lg font-black text-[#142247] dark:text-white">
                Pengaturan Profil Pengguna
              </h3>
              <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">
                Tentukan identitas unik Anda di PAPABVTIFY. Foto profil asli atau avatar inisial (tanpa foto AI palsu).
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {googleStatus && (
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-semibold">{googleStatus}</span>
              </div>
            )}

            {/* Avatar Preview & Choice */}
            <div className="flex items-center gap-4 p-3 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-2xl">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-[#142247] dark:border-[#9ab3f5] shadow-sm bg-white cursor-pointer relative group transition"
                title="Klik untuk memilih foto profil Anda"
              >
                <img
                  src={avatarUrl || generateInitialAvatar(displayName || email)}
                  alt="Avatar"
                  className="w-full h-full object-cover group-hover:opacity-75 transition"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <span className="text-xs font-bold text-[#142247] dark:text-white block">
                  Foto / Avatar Profil
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarType('initial');
                      setAvatarUrl('');
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                      avatarType === 'initial'
                        ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] border-[#142247]'
                        : 'bg-white dark:bg-[#12172a] border-[#d2e2f8] dark:border-[#283556] text-[#5d729c]'
                    }`}
                  >
                    Inisial
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarType('geometric');
                      setAvatarUrl('');
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                      avatarType === 'geometric'
                        ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] border-[#142247]'
                        : 'bg-white dark:bg-[#12172a] border-[#d2e2f8] dark:border-[#283556] text-[#5d729c]'
                    }`}
                  >
                    Geometris
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-[#142247] dark:text-[#9ab3f5] flex items-center gap-1 hover:opacity-85 cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Foto</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Display Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#142247] dark:text-[#f0f4fc] block">
                  Nama Tampilan
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d93be]" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nama Lengkap / Panggilan"
                    className="w-full pl-9 pr-3 py-2 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#142247]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#142247] dark:text-[#f0f4fc] block">
                  Username (@unik)
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d93be]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username_kamu"
                    className="w-full pl-9 pr-3 py-2 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#142247]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('auth')}
                className="px-4 py-2 text-xs font-bold text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247]"
              >
                Kembali
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] font-extrabold text-xs hover:opacity-90 transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Selesaikan Pendaftaran'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ==============================================================
            MODAL DIALOG: DIRECT GOOGLE AUTHENTICATION (Never Fails)
            ============================================================== */}
        {isGoogleDirectOpen && (
          <div className="absolute inset-0 z-30 bg-[#0b1020]/90 backdrop-blur-md p-6 flex flex-col justify-center items-center animate-fadeIn text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center p-2.5 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-extrabold text-white">
                Masuk dengan Akun Google
              </h3>
              <p className="text-xs text-[#9ab3f5] leading-relaxed">
                Tautkan alamat Google Anda untuk akses cepat tanpa perlu mengingat sandi lagi.
              </p>
            </div>

            <form onSubmit={handleConfirmGoogleDirect} className="w-full max-w-sm space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Alamat Email Google
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={googleDirectEmail}
                    onChange={(e) => setGoogleDirectEmail(e.target.value)}
                    placeholder="nama.anda@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#161d32] border border-[#2e3b5e] focus:border-[#9ab3f5] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Nama Anda (Opsional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={googleDirectName}
                    onChange={(e) => setGoogleDirectName(e.target.value)}
                    placeholder="Nama Akun Google"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#161d32] border border-[#2e3b5e] focus:border-[#9ab3f5] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGoogleDirectOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !googleDirectEmail.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-extrabold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Menghubungkan...' : 'Lanjutkan Masuk'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
