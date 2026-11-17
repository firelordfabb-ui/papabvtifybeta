import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Check,
  User,
  AtSign,
  FileText,
  Music,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types/music';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/authService';
import {
  generateInitialAvatar,
  generateGeometricAvatar,
  ILLUSTRATIVE_AVATARS,
  getEffectiveAvatar
} from '../utils/avatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

const AVAILABLE_GENRES = [
  'Indie Pop',
  'R&B / Soul',
  'Synthwave',
  'Akustik',
  'Rock',
  'Lofi Beats',
  'Jazz Modern',
  'Hip-Hop',
  'Electronic',
  'Pop Ballad'
];

export const EditProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated
}) => {
  const [name, setName] = useState(userProfile.name);
  const [handle, setHandle] = useState(userProfile.handle.replace(/^@/, ''));
  const [bio, setBio] = useState(userProfile.bio);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [avatarType, setAvatarType] = useState<'initial' | 'geometric' | 'custom'>(userProfile.avatarType || 'initial');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(userProfile.favoriteGenres || []);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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
          setAvatar(event.target.result as string);
          setAvatarType('custom');
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input so user can choose another or same file without fail
    if (e.target) {
      e.target.value = '';
    }
  };

  const toggleGenre = (genre: string) => {
    if (favoriteGenres.includes(genre)) {
      setFavoriteGenres(favoriteGenres.filter(g => g !== genre));
    } else {
      if (favoriteGenres.length >= 5) {
        setError('Maksimal 5 genre favorit.');
        return;
      }
      setFavoriteGenres([...favoriteGenres, genre]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const formattedHandle = handle.trim().startsWith('@')
      ? handle.trim()
      : `@${handle.trim().replace(/\s+/g, '_').toLowerCase() || 'user'}`;

    try {
      // 1. Update backend profile if authenticated
      if (AuthService.isAuthenticated()) {
        await AuthService.updateProfile({
          displayName: name.trim(),
          username: formattedHandle.replace(/^@/, ''),
          bio: bio.trim(),
          avatar,
          avatarType,
          favoriteGenres
        });
      }

      // 2. Update local state
      const updated: UserProfile = {
        ...userProfile,
        name: name.trim(),
        handle: formattedHandle,
        bio: bio.trim(),
        avatar,
        avatarType,
        favoriteGenres
      };

      StorageService.saveUserProfile(updated);
      onProfileUpdated(updated);
      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none text-white">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#111218] border border-[#222533] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="p-6 border-b border-[#222533] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#ff442b]" />
            <div>
              <h2 className="text-lg font-black text-white font-mono uppercase">Edit Profil Anggota</h2>
              <p className="text-xs text-slate-400">Atur identitas resmi, avatar non-AI, dan selera musik Anda.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AVATAR CHOOSER (100% NON-AI) */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400 block">
              Foto / Avatar Akun (Bebas Gambar AI)
            </span>

            <div className="flex items-center gap-5 p-4 bg-[#0a0b0f] border border-[#222533]">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border border-[#222533] hover:border-[#ff442b] bg-[#161822] overflow-hidden shrink-0 shadow-lg cursor-pointer relative group transition"
                title="Klik untuk memilih foto dari perangkat Anda"
              >
                <img
                  src={avatar || generateInitialAvatar(name || 'User')}
                  alt="Avatar"
                  className="w-full h-full object-cover group-hover:opacity-75 transition"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition text-white">
                  <Camera className="w-5 h-5 text-[#ff442b]" />
                  <span className="text-[9px] font-mono font-bold mt-0.5">Ubah</span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#181924] hover:bg-[#202230] border border-[#2d3042] hover:border-[#ff442b] text-xs font-mono font-bold text-white transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#ff442b]" />
                    <span>Unggah Foto Lokal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAvatar(generateInitialAvatar(name || 'User'));
                      setAvatarType('initial');
                    }}
                    className="px-3 py-1.5 border border-[#222533] hover:border-slate-500 text-xs font-mono text-slate-300 transition"
                  >
                    Pakai Inisial
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAvatar(generateGeometricAvatar(handle || name || 'user'));
                      setAvatarType('geometric');
                    }}
                    className="px-3 py-1.5 border border-[#222533] hover:border-slate-500 text-xs font-mono text-slate-300 transition"
                  >
                    Pola Geometrik
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono text-slate-500">Ikon Musik:</span>
                  {ILLUSTRATIVE_AVATARS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setAvatar(item.svg);
                        setAvatarType('custom');
                      }}
                      className="w-7 h-7 border border-[#222533] hover:border-[#ff442b] p-0.5 transition"
                      title={item.label}
                    >
                      <img src={item.svg} alt={item.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields: Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase font-bold text-slate-400 block">
                Nama Tampilan
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full px-3.5 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase font-bold text-slate-400 block">
                Username / Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">@</span>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full pl-7 pr-3 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bio Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase font-bold text-slate-400 block">
                Bio / Keterangan Profil
              </label>
              <span className="text-[10px] font-mono text-slate-500">{bio.length}/180</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 180))}
              placeholder="Ceritakan preferensi audio Anda..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#0a0b0f] border border-[#222533] focus:border-[#ff442b] text-white text-xs focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Favorite Genres Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase font-bold text-slate-400 block">
              Preferensi Musik Favorit (Maksimal 5)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map((g) => {
                const isSelected = favoriteGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 text-xs font-mono transition border ${
                      isSelected
                        ? 'bg-[#ff442b] border-[#ff442b] text-white font-bold'
                        : 'bg-[#0a0b0f] border-[#222533] text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profil resmi Anda berhasil diperbarui!</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-3 border-t border-[#222533] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 font-mono text-xs uppercase text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-[#ff442b] hover:bg-[#e03a22] text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
