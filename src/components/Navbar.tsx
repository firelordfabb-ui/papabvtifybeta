import React from 'react';
import { MainTab, ChillAmbientSound, SleepTimerState, PerformanceMode, UserProfile } from '../types/music';
import {
  Compass,
  Search,
  Library,
  Radio,
  Sliders,
  Download,
  BarChart3,
  User,
  CloudRain,
  Flame,
  Disc,
  Sparkles,
  Gauge,
  Moon,
  Activity,
  Zap,
  Users,
  LogIn,
  Sun,
  Moon as MoonIcon
} from 'lucide-react';

interface Props {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  ambientSound: ChillAmbientSound;
  onAmbientSoundChange: (sound: ChillAmbientSound) => void;
  onOpenGoogleConnect: () => void;
  playbackSpeed: number;
  onOpenSpeedModal: () => void;
  sleepTimer: SleepTimerState;
  onOpenSleepTimerModal: () => void;
  onOpenVisualizerModal: () => void;
  performanceMode: PerformanceMode;
  onOpenPerformanceModal: () => void;
  userProfile: UserProfile;
  onOpenAuth: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  ambientSound,
  onAmbientSoundChange,
  onOpenGoogleConnect,
  playbackSpeed,
  onOpenSpeedModal,
  sleepTimer,
  onOpenSleepTimerModal,
  onOpenVisualizerModal,
  performanceMode,
  onOpenPerformanceModal,
  userProfile,
  onOpenAuth,
  theme = 'light',
  onToggleTheme
}) => {
  const tabs = [
    { id: 'beranda' as MainTab, label: 'Beranda', icon: Compass },
    { id: 'cari' as MainTab, label: 'Cari', icon: Search },
    { id: 'pustaka' as MainTab, label: 'Pustaka', icon: Library },
    { id: 'audiolab' as MainTab, label: 'Audio Lab', icon: Sliders, highlight: true },
    { id: 'room' as MainTab, label: 'Room', icon: Users, highlight: true },
    { id: 'unduhan' as MainTab, label: 'Unduhan', icon: Download },
    { id: 'radio' as MainTab, label: 'Radio', icon: Radio },
    { id: 'statistik' as MainTab, label: 'Statistik', icon: BarChart3 },
    { id: 'about' as MainTab, label: 'Kamu', icon: User },
  ];

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    return `${m}m`;
  };

  return (
    <header className="h-16 px-4 sm:px-8 border-b border-black/5 dark:border-[#222533] flex items-center justify-between z-30 select-none bg-white/90 dark:bg-[#0c0d13]/90 backdrop-blur-xl text-slate-900 dark:text-white shrink-0">
      {/* Brand Masthead */}
      <div
        onClick={() => setActiveTab('beranda')}
        className="flex items-center gap-3 cursor-pointer group shrink-0"
      >
        <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-[#181924] border border-black/10 dark:border-[#2d3042] flex items-center justify-center shadow-md">
          <span className="text-xs font-black font-mono tracking-tighter text-[#ff442b]">
            PV
          </span>
        </div>
        <div className="hidden lg:block">
          <span className="text-sm font-black tracking-tight text-slate-900 dark:text-[#f5f6fa] group-hover:text-[#ff442b] transition">
            PAPABVTIFY
          </span>
          <span className="ml-2 font-mono text-[9px] tracking-widest text-[#ff442b] uppercase font-bold">
            PRO STREAMING
          </span>
        </div>
      </div>

      {/* Center Nav Tabs */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#111218] border border-black/5 dark:border-[#222533] rounded-2xl overflow-x-auto max-w-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-[#1e202d] text-slate-900 dark:text-white shadow-sm border border-black/5 dark:border-[#363a50]'
                  : tab.highlight
                  ? 'text-[#ff442b] hover:text-black dark:hover:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.highlight && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff442b]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Speed, Timer, Visualizer, Perf Mode & Auth */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Speed Indicator Pill */}
        <button
          onClick={onOpenSpeedModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold border transition active:scale-95 ${
            playbackSpeed !== 1.0
              ? 'bg-[#1f1618] border-[#ff442b] text-[#ff442b]'
              : 'bg-[#14151e] border-[#222533] text-slate-300 hover:text-white'
          }`}
          title="Kecepatan Putar"
        >
          <Gauge className="w-3.5 h-3.5 text-[#ff442b]" />
          <span>{playbackSpeed.toFixed(1)}x</span>
        </button>

        {/* Sleep Timer Indicator */}
        <button
          onClick={onOpenSleepTimerModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold border transition active:scale-95 ${
            sleepTimer.active
              ? 'bg-[#181924] border-indigo-500 text-indigo-300'
              : 'bg-[#14151e] border-[#222533] text-slate-300 hover:text-white'
          }`}
          title="Sleep Timer"
        >
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">
            {sleepTimer.active ? formatCountdown(sleepTimer.remainingSeconds) : 'Timer'}
          </span>
        </button>

        {/* Cinematic Visualizer */}
        <button
          onClick={onOpenVisualizerModal}
          className="p-2 bg-[#14151e] border border-[#222533] hover:border-slate-500 text-slate-300 hover:text-white transition active:scale-95"
          title="Buka Visualizer Sinematik"
        >
          <Activity className="w-3.5 h-3.5 text-[#ff442b]" />
        </button>

        {/* Ambient Mood Switcher */}
        <div className="hidden xl:flex items-center gap-0.5 p-0.5 bg-[#111218] border border-[#222533]">
          {[
            { key: 'none' as ChillAmbientSound, label: 'Off', icon: Sparkles },
            { key: 'rain' as ChillAmbientSound, label: 'Rain', icon: CloudRain },
            { key: 'fireplace' as ChillAmbientSound, label: 'Fire', icon: Flame },
            { key: 'vinyl' as ChillAmbientSound, label: 'Vinyl', icon: Disc },
          ].map((a) => {
            const Icon = a.icon;
            const isActive = ambientSound === a.key;
            return (
              <button
                key={a.key}
                onClick={() => onAmbientSoundChange(a.key)}
                title={`Suara Ambient: ${a.label}`}
                className={`p-1.5 text-xs transition ${
                  isActive
                    ? 'bg-[#1e202d] text-white border border-[#363a50]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
              </button>
            );
          })}
        </div>

        {/* Theme Mode Switcher */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl liquid-glass-pill text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition active:scale-95"
            title={theme === 'light' ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
          >
            {theme === 'light' ? (
              <MoonIcon className="w-3.5 h-3.5 text-slate-700" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        )}

        {/* User Account Module (Real Auth or Login Trigger) */}
        {userProfile.isLoggedIn ? (
          <button
            onClick={() => setActiveTab('about')}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl liquid-glass-pill hover:border-[#ff442b] transition active:scale-95 group"
            title={`Profil: ${userProfile.name} (${userProfile.handle})`}
          >
            <div className="w-6 h-6 rounded-lg border border-black/10 dark:border-[#222533] overflow-hidden shrink-0">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden sm:inline text-xs font-mono font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#ff442b] truncate max-w-[90px]">
              {userProfile.handle}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff442b] hover:bg-[#e03a22] text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-md"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
        )}
      </div>
    </header>
  );
};
