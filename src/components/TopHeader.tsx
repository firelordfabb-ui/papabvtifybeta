import React from 'react';
import { Search, Headphones, Sliders, Bell, Sun, Moon, Waves } from 'lucide-react';
import { UserProfile, ChillAmbientSound, UnderwaterConfig } from '../types/music';

interface Props {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onOpenAudioLab: () => void;
  ambientSound: ChillAmbientSound;
  onAmbientSoundChange: (sound: ChillAmbientSound) => void;
  userProfile: UserProfile;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  underwaterConfig?: UnderwaterConfig;
  onOpenUnderwaterModal?: () => void;
}

export const TopHeader: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenAudioLab,
  ambientSound,
  onAmbientSoundChange,
  userProfile,
  onOpenAuth,
  onOpenProfile,
  theme = 'light',
  onToggleTheme,
  underwaterConfig,
  onOpenUnderwaterModal
}) => {
  const toggleAmbient = () => {
    const list: ChillAmbientSound[] = ['none', 'rain', 'fireplace', 'vinyl'];
    const nextIdx = (list.indexOf(ambientSound) + 1) % list.length;
    onAmbientSoundChange(list[nextIdx]);
  };

  return (
    <header className="h-16 px-3 sm:px-6 md:px-10 flex items-center justify-between gap-2.5 sm:gap-4 select-none shrink-0 z-20 pt-[env(safe-area-inset-top,0px)]">
      {/* Search Input matching Reference */}
      <form onSubmit={onSearchSubmit} className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 sm:left-4 w-4 h-4 text-[#7589ae]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lagu, artis, playlist..."
            className="w-full pl-10 sm:pl-11 pr-4 md:pr-20 py-2 sm:py-2.5 rounded-full bg-white/90 dark:bg-[#151b2e]/90 border border-[#dce7f7] dark:border-[#222c45] text-xs font-semibold text-[#142247] dark:text-[#f0f4fc] placeholder-[#879abf] focus:outline-none focus:ring-2 focus:ring-[#9ab3f5]/50 shadow-sm transition"
          />
          <div className="hidden md:block absolute right-3.5 px-2 py-0.5 rounded-md bg-[#edf3fd] dark:bg-[#202942] border border-[#d3e2f7] dark:border-[#2a3656] text-[10px] font-mono font-bold text-[#62779f] dark:text-[#8ba2cb]">
            Ctrl + K
          </div>
        </div>
      </form>

      {/* Right Utility Buttons matching Reference */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Underwater Mode Quick Button */}
        {onOpenUnderwaterModal && (
          <button
            onClick={onOpenUnderwaterModal}
            title={underwaterConfig?.enabled ? 'Underwater Mode Aktif' : 'Buka Underwater Mode'}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition active:scale-95 cursor-pointer shadow-sm ${
              underwaterConfig?.enabled
                ? 'bg-[#0077b6] text-white dark:bg-[#00b4d8] dark:text-[#041124] border-transparent font-bold animate-pulse'
                : 'bg-white/85 dark:bg-[#151b2e] border-[#dce7f7] dark:border-[#222c45] text-[#55698f] hover:text-[#0077b6] dark:hover:text-[#00b4d8]'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold hidden md:inline">
              {underwaterConfig?.enabled ? 'Underwater' : 'Laut'}
            </span>
          </button>
        )}

        {/* Ambient / Headset Pill Toggle */}
        <button
          onClick={toggleAmbient}
          title={`Suara Latar: ${ambientSound}`}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border transition active:scale-95 ${
            ambientSound !== 'none'
              ? 'bg-[#e3edfc] border-[#b8d2f8] text-[#142247]'
              : 'bg-white/85 dark:bg-[#151b2e] border-[#dce7f7] dark:border-[#222c45] text-[#55698f] hover:text-[#142247]'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold capitalize hidden sm:inline">
            {ambientSound === 'none' ? 'Chill' : ambientSound}
          </span>
        </button>

        {/* Theme Toggle Sun / Moon */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/85 dark:bg-[#151b2e] border border-[#dce7f7] dark:border-[#222c45] flex items-center justify-center text-[#55698f] hover:text-[#142247] dark:hover:text-white transition active:scale-95 shadow-sm"
            title="Ganti Tema"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        )}

        {/* Audio Lab Shortcut */}
        <button
          onClick={onOpenAudioLab}
          className="hidden sm:flex w-9 h-9 rounded-full bg-white/85 dark:bg-[#151b2e] border border-[#dce7f7] dark:border-[#222c45] items-center justify-center text-[#55698f] hover:text-[#142247] dark:hover:text-white transition active:scale-95 shadow-sm"
          title="Buka Audio Lab & Equalizer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => alert('Semua notifikasi siaran dan update telah aktif.')}
          className="hidden sm:flex w-9 h-9 rounded-full bg-white/85 dark:bg-[#151b2e] border border-[#dce7f7] dark:border-[#222c45] items-center justify-center text-[#55698f] hover:text-[#142247] dark:hover:text-white transition active:scale-95 shadow-sm"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Profile Avatar with Online Badge */}
        <div
          onClick={userProfile.isLoggedIn ? onOpenProfile : onOpenAuth}
          className="relative cursor-pointer group"
          title={userProfile.isLoggedIn ? userProfile.name : 'Masuk Akun'}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#142247] border-2 border-white dark:border-[#222c45] flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition">
            {userProfile.avatar && (userProfile.avatar.startsWith('http') || userProfile.avatar.startsWith('data:image') || userProfile.avatar.startsWith('blob:')) ? (
              <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-black text-white">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'F'}
              </span>
            )}
          </div>
          {/* Online Green Indicator Dot */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#142247]" />
        </div>
      </div>
    </header>
  );
};
