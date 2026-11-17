import React from 'react';
import { MainTab } from '../types/music';
import {
  Compass,
  Search,
  Library,
  User
} from 'lucide-react';

interface Props {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  onOpenGoogleConnect?: () => void;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  setActiveTab
}) => {
  const tabs = [
    { id: 'beranda' as MainTab, label: 'Beranda', icon: Compass },
    { id: 'cari' as MainTab, label: 'Cari', icon: Search },
    { id: 'pustaka' as MainTab, label: 'Pustaka', icon: Library },
    { id: 'about' as MainTab, label: 'Kamu', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-3 inset-x-0 z-40 px-4 flex justify-center pointer-events-none select-none animate-fadeIn">
      <div className="pointer-events-auto rounded-full bg-white/95 dark:bg-[#12172a]/95 border border-[#dce7f7] dark:border-[#222c45] p-1.5 flex items-center justify-around gap-1.5 shadow-2xl max-w-sm w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-[#142247] text-white dark:bg-white dark:text-[#142247] shadow-md font-bold'
                  : 'text-[#62779f] hover:text-[#142247] dark:text-[#8fa1c4] dark:hover:text-white font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
