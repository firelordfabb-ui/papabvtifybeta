import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  AtSign,
  ArrowRight,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Disc,
  Headphones,
  RotateCcw
} from 'lucide-react';
import { AuthService, AuthResponse } from '../services/authService';
import { UserAccount } from '../types/music';
import { generateInitialAvatar, generateGeometricAvatar, ILLUSTRATIVE_AVATARS } from '../utils/avatar';

interface Props {
  onSuccess: (user: UserAccount) => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

type AuthTab = 'login' | 'register' | 'forgot' | 'reset';

export const AuthView: React.FC<Props> = ({ onSuccess, onCancel, canCancel = false }) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatarType, setRegAvatarType] = useState<'initial' | 'geometric' | 'custom'>('initial');
  const [regAvatarUrl, setRegAvatarUrl] = useState<string>('');

  // Forgot / Reset Form
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Local Photo Upload (FileReader -> Base64) with reset
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file foto maksimal 10 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRegAvatarUrl(event.target.result as string);
          setRegAvatarType('custom');
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // 1. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: AuthResponse = await AuthService.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || 'Gagal masuk. Periksa kembali kredensial Anda.');
      }
    } catch (err: any) {
      setError(err.message || 'Kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      // Determine final avatar
      let avatar = regAvatarUrl;
      if (!avatar || regAvatarType === 'initial') {
        avatar = generateInitialAvatar(regDisplayName || regUsername);
      } else if (regAvatarType === 'geometric') {
        avatar = generateGeometricAvatar(regUsername || 'user');
      }

      const res: AuthResponse = await AuthService.register({
        username: regUsername.trim().toLowerCase(),
        displayName: regDisplayName.trim() || regUsername.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        avatar,
        avatarType: regAvatarType
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || 'Pendaftaran gagal. Username atau email mungkin sudah terdaftar.');
      }
    } catch (err: any) {
      setError(err.message || 'Kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Forgot Password
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await AuthService.forgotPassword(forgotEmail.trim().toLowerCase());
      if (res.success) {
        setGeneratedCodeHint(res.resetCode || null);
        setSuccessMsg('Kode pemulihan akun berhasil dibuat.');
        setTab('reset');
      } else {
        setError(res.error || 'Email tidak ditemukan.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal meminta kode pemulihan.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Reset Password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await AuthService.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        resetCode: resetCode.trim(),
        newPassword
      });

      if (res.success) {
        setSuccessMsg('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.');
        setTab('login');
        setLoginIdentifier(forgotEmail);
        setLoginPassword('');
      } else {
        setError(res.error || 'Kode pemulihan tidak valid atau sudah kedaluwarsa.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#090a0f] text-white select-none animate-fadeIn">
      {/* Background Subtle Editorial Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e212b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative w-full max-w-lg bg-[#111218] border border-[#222533] shadow-2xl p-6 sm:p-10 space-y-7 z-10">
        {/* Editorial Top Bar Stamp */}
        <div className="flex items-center justify-between border-b border-[#222533] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#ff442b]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400 font-bold">
              PAPABVTIFY IDENTITY CORE • 2026
            </span>
          </div>
          {canCancel && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-white transition font-mono uppercase tracking-wider"
            >
              [Tutup]
            </button>
          )}
        </div>

        {/* Masthead Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#f5f6fa]">
            {tab === 'login' && 'Masuk Akun'}
            {tab === 'register' && 'Daftar Anggota'}
            {tab === 'forgot' && 'Pemulihan Akun'}
            {tab === 'reset' && 'Reset Sandi'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {tab === 'login' && 'Masuk dengan kredensial akun terdaftar untuk akses penuh perpustakaan dan Dengar Bersama.'}
            {tab === 'register' && 'Buat identitas resmi tanpa profil palsu atau gambar AI. Keamanan terenkripsi SHA-256.'}
            {tab === 'forgot' && 'Masukkan alamat email Anda untuk menerima kode pemulihan akun instan.'}
            {tab === 'reset' && 'Masukkan kode verifikasi 6-digit dan tetapkan kata sandi baru Anda.'}
          </p>
        </div>

        {/* Tab Switcher (Login / Register) */}
        {(tab === 'login' || tab === 'register') && (
          <div className="flex border border-[#222533] bg-[#0c0d12] p-1 gap-1">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition ${
                tab === 'login'
                  ? 'bg-[#181922] text-white border border-[#2f3346] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition ${
                tab === 'register'
                  ? 'bg-[#181922] text-white border border-[#2f3346] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daftar Akun
            </button>
          </div>
        )}

        {/* Alert Error / Success Messages */}
        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* FORM 1: LOGIN */}
        {/* ============================================================== */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
                <AtSign className="w-3.5 h-3.5 text-[#ff442b]" />
                <span>Username atau Alamat Email</span>
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="nama_pengguna atau email@domain.com"
                className="w-full px-4 py-3 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
                  <KeyRound className="w-3.5 h-3.5 text-[#ff442b]" />
                  <span>Kata Sandi</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setError(null); }}
                  className="text-[11px] text-slate-400 hover:text-white transition font-mono"
                >
                  Lupa sandi?
                </button>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#ff442b] hover:bg-[#e03a22] text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <span>{loading ? 'Mengautentikasi...' : 'Masuk ke Akun'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 2: REGISTER */}
        {/* ============================================================== */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Username Akun
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">@</span>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full pl-7 pr-3 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Nama Tampilan
                </label>
                <input
                  type="text"
                  required
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  placeholder="Contoh: Fabian Garfield"
                  className="w-full px-3 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Alamat Email Resmi
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="nama@domain.com"
                className="w-full px-3 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Kata Sandi (Min 6)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Ulangi Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* AVATAR CHOOSER (NO AI FACE PICTURES) */}
            <div className="space-y-2 pt-2 border-t border-[#222533]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Pilihan Gambar Profil (Non-AI)
                </span>
                <span className="text-[10px] text-[#ff442b] font-mono">Bebas Foto AI</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Live Preview Avatar */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 border border-[#222533] hover:border-[#ff442b] bg-[#0c0d12] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer relative group transition"
                  title="Klik untuk memilih foto profil lokal"
                >
                  <img
                    src={
                      regAvatarType === 'custom' && regAvatarUrl
                        ? regAvatarUrl
                        : regAvatarType === 'geometric'
                        ? generateGeometricAvatar(regUsername || 'user')
                        : generateInitialAvatar(regDisplayName || regUsername || 'User')
                    }
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:opacity-75 transition"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                    <Upload className="w-3.5 h-3.5 text-[#ff442b]" />
                  </div>
                </div>

                {/* Avatar Type Selector Buttons */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRegAvatarType('initial')}
                      className={`flex-1 py-1 px-2 text-[10px] font-mono uppercase font-bold border transition ${
                        regAvatarType === 'initial'
                          ? 'border-[#ff442b] text-[#ff442b] bg-[#1a1315]'
                          : 'border-[#222533] text-slate-400 hover:text-white'
                      }`}
                    >
                      Inisial
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegAvatarType('geometric')}
                      className={`flex-1 py-1 px-2 text-[10px] font-mono uppercase font-bold border transition ${
                        regAvatarType === 'geometric'
                          ? 'border-[#ff442b] text-[#ff442b] bg-[#1a1315]'
                          : 'border-[#222533] text-slate-400 hover:text-white'
                      }`}
                    >
                      Geometrik
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 py-1 px-2 text-[10px] font-mono uppercase font-bold border transition ${
                        regAvatarType === 'custom'
                          ? 'border-[#ff442b] text-[#ff442b] bg-[#1a1315]'
                          : 'border-[#222533] text-slate-400 hover:text-white'
                      }`}
                    >
                      Upload
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    {regAvatarType === 'initial' && 'Dibuat otomatis dari nama tampilan Anda.'}
                    {regAvatarType === 'geometric' && 'Pola seni geometrik abstrak unik.'}
                    {regAvatarType === 'custom' && 'Foto lokal Anda berhasil dipilih.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#ff442b] hover:bg-[#e03a22] text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Resmi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 3: FORGOT PASSWORD */}
        {/* ============================================================== */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Alamat Email Akun
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full px-4 py-3 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#ff442b] hover:bg-[#e03a22] text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Memproses...' : 'Dapatkan Kode Pemulihan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className="w-full py-2 text-center text-xs font-mono text-slate-400 hover:text-white"
            >
              Kembali ke Halaman Masuk
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 4: RESET PASSWORD */}
        {/* ============================================================== */}
        {tab === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            {generatedCodeHint && (
              <div className="p-3 bg-[#181922] border border-[#ff442b]/40 text-xs font-mono">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Kode Pemulihan Anda:</span>
                <span className="text-lg font-black text-[#ff442b] tracking-widest">{generatedCodeHint}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Kode Verifikasi 6-Digit
              </label>
              <input
                type="text"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Contoh: 849201"
                className="w-full px-4 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-sm font-mono tracking-widest focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Kata Sandi Baru (Min 6)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#ff442b] hover:bg-[#e03a22] text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Menyimpan...' : 'Perbarui Kata Sandi & Masuk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer Security Badges */}
        <div className="pt-2 border-t border-[#222533] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ENCRYPTED SESSION • NO DUMMY USERS</span>
          </div>
          <span>PAPABVTIFY SECURE</span>
        </div>
      </div>
    </div>
  );
};
