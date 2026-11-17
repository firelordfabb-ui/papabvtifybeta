import React from 'react';
import { MainTab } from '../types/music';
import { FantasyLogo } from './FantasyLogo';
import { MascotIllustration } from './MascotIllustration';
import {
  Home,
  Search,
  Library,
  Sliders,
  Users2,
  Settings,
  Compass,
  Radio,
  Download,
  Mic,
  UserCheck
} from 'lucide-react';

interface Props {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  className?: string;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  className = ''
}) => {
  const mainNavItems = [
    { id: 'beranda' as MainTab, label: 'Beranda', icon: Home },
    { id: 'cari' as MainTab, label: 'Cari', icon: Search },
    { id: 'pustaka' as MainTab, label: 'Pustaka', icon: Library },
    { id: 'podcast' as MainTab, label: 'Podcast', icon: Mic },
    { id: 'friends' as MainTab, label: 'Teman', icon: UserCheck },
    { id: 'audiolab' as MainTab, label: 'Audio Lab', icon: Sliders },
    { id: 'room' as MainTab, label: 'Room', icon: Users2 },
    { id: 'unduhan' as MainTab, label: 'Unduhan', icon: Download },
  ];

  const secondaryNavItems = [
    { id: 'pengaturan' as MainTab, label: 'Pengaturan', icon: Settings },
    { id: 'about' as MainTab, label: 'Tentang', icon: Compass },
  ];

  return (
    <aside
      className={`w-60 h-full fantasy-sidebar flex flex-col justify-between p-5 select-none shrink-0 z-20 ${className}`}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div
          className="cursor-pointer transition hover:opacity-95"
          onClick={() => setActiveTab('beranda')}
        >
          <FantasyLogo />
        </div>

        {/* Primary Navigation Menu */}
        <nav className="space-y-1.5 pt-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'fantasy-nav-active'
                    : 'text-[#55698f] hover:text-[#142247] hover:bg-[#e7f0fc]/60 dark:text-[#94A6D2] dark:hover:text-white dark:hover:bg-[#1d253d]/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-[#142247] dark:text-[#9ab3f5] scale-105' : 'text-[#62779f] dark:text-[#7f95c4]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Subtle Divider */}
        <div className="border-t border-[#dce7f7] dark:border-[#202942] my-3" />

        {/* Secondary Navigation Menu */}
        <nav className="space-y-1.5">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'fantasy-nav-active'
                    : 'text-[#55698f] hover:text-[#142247] hover:bg-[#e7f0fc]/60 dark:text-[#94A6D2] dark:hover:text-white dark:hover:bg-[#1d253d]/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#142247] dark:text-[#9ab3f5]' : 'text-[#62779f] dark:text-[#7f95c4]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mascot & Brand Emblem at Bottom */}
      <div className="pt-2 flex flex-col items-center">
        <MascotIllustration size={135} />
      </div>
    </aside>
  );
};
