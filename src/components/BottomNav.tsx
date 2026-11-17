import React, { useState } from 'react';
import { MainTab } from '../types/music';
import {
  Compass,
  Search,
  Library,
  Users2,
  Menu,
  X,
  Mic,
  UserCheck,
  Sliders,
  Download,
  Settings,
  Info,
  Radio,
  BarChart3,
  Waves
} from 'lucide-react';

interface Props {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  onOpenGoogleConnect?: () => void;
  onOpenUnderwaterModal?: () => void;
  isUnderwaterActive?: boolean;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onOpenUnderwaterModal,
  isUnderwaterActive
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs = [
    { id: 'beranda' as MainTab, label: 'Beranda', icon: Compass },
    { id: 'cari' as MainTab, label: 'Cari', icon: Search },
    { id: 'pustaka' as MainTab, label: 'Pustaka', icon: Library },
    { id: 'room' as MainTab, label: 'Room', icon: Users2 },
  ];

  const drawerItems = [
    { id: 'podcast' as MainTab, label: 'Podcast & Audio', icon: Mic, desc: 'Episode misteri, cerita & inspirasi' },
    { id: 'friends' as MainTab, label: 'Teman & Aktivitas', icon: UserCheck, desc: 'Koneksi teman & lagu yang didengar' },
    { id: 'audiolab' as MainTab, label: 'Audio Lab & DSP', icon: Sliders, desc: 'Equalizer, 8D, Slowed + Reverb' },
    { id: 'unduhan' as MainTab, label: 'Musik Unduhan', icon: Download, desc: 'Putar lagu favorit tanpa koneksi' },
    { id: 'radio' as MainTab, label: 'Radio Dunia', icon: Radio, desc: 'Stasiun siaran langsung global' },
    { id: 'statistik' as MainTab, label: 'Statistik Musik', icon: BarChart3, desc: 'Waktu dengar & artis favorit' },
    { id: 'pengaturan' as MainTab, label: 'Pengaturan', icon: Settings, desc: 'Akun, audio, server & preferensi' },
    { id: 'about' as MainTab, label: 'Tentang & Profil', icon: Info, desc: 'Informasi aplikasi & profil Anda' },
  ];

  const isMoreActive = !mainTabs.some(t => t.id === activeTab);
  const activeDrawerItem = drawerItems.find(item => item.id === activeTab);

  const handleSelectTab = (tab: MainTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-2 inset-x-0 z-40 px-3 flex justify-center pointer-events-none select-none animate-fadeIn pb-[env(safe-area-inset-bottom,0px)]">
        <div className="pointer-events-auto rounded-full bg-white/95 dark:bg-[#12172a]/95 backdrop-blur-xl border border-[#dce7f7] dark:border-[#222c45] p-1.5 flex items-center justify-between gap-1 shadow-2xl max-w-md w-full">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#142247] text-white dark:bg-white dark:text-[#142247] shadow-md font-bold'
                    : 'text-[#62779f] hover:text-[#142247] dark:text-[#8fa1c4] dark:hover:text-white font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] tracking-tight truncate max-w-[54px]">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: Menu / Lainnya Drawer Trigger */}
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
              isMoreActive || isMenuOpen
                ? 'bg-[#142247] text-white dark:bg-white dark:text-[#142247] shadow-md font-bold'
                : 'text-[#62779f] hover:text-[#142247] dark:text-[#8fa1c4] dark:hover:text-white font-medium'
            }`}
          >
            {isMenuOpen ? (
              <X className="w-4 h-4 mb-0.5 text-red-400" />
            ) : (
              <Menu className="w-4 h-4 mb-0.5 transition-transform scale-105" />
            )}
            <span className="text-[10px] tracking-tight truncate max-w-[54px]">
              {isMoreActive && activeDrawerItem ? activeDrawerItem.label.split(' ')[0] : 'Menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Full Feature Mobile Navigation Drawer Modal */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col justify-end animate-fadeIn">
          {/* Backdrop Tap to Close */}
          <div className="flex-1" onClick={() => setIsMenuOpen(false)} />

          <div className="bg-[#F8FAFF] dark:bg-[#12172a] rounded-t-[32px] border-t border-[#A8C5FF] dark:border-[#283556] p-6 pb-[max(7rem,calc(env(safe-area-inset-bottom,0px)+6rem))] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp">
            {/* Header with dismiss bar */}
            <div className="flex flex-col items-center pb-2">
              <div className="w-12 h-1 rounded-full bg-[#d2e2f8] dark:bg-[#283556] mb-3" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <h3 className="text-base font-black text-[#142247] dark:text-white">Menu & Navigasi PAPABVTIFY</h3>
                  <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4]">Akses seluruh fitur lengkap musik, studio & akun</p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full bg-[#edf3fd] dark:bg-[#1a233b] text-[#5d729c] dark:text-[#8fa1c4]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Underwater Mode Quick Pill */}
            {onOpenUnderwaterModal && (
              <div
                onClick={() => {
                  onOpenUnderwaterModal();
                  setIsMenuOpen(false);
                }}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                  isUnderwaterActive
                    ? 'bg-[#0077b6] text-white border-transparent shadow-md'
                    : 'bg-white dark:bg-[#161d32] border-[#dce7f7] dark:border-[#222c45] text-[#142247] dark:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isUnderwaterActive ? 'bg-white/20' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'}`}>
                    <Waves className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Underwater DSP Effect</h4>
                    <p className={`text-[10px] ${isUnderwaterActive ? 'text-white/80' : 'text-[#5d729c] dark:text-[#8fa1c4]'}`}>
                      {isUnderwaterActive ? 'Status: Aktif (Suara terendam air)' : 'Mode suara terendam air meditatif'}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUnderwaterActive ? 'bg-white text-[#0077b6]' : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'}`}>
                  {isUnderwaterActive ? 'ON' : 'OFF'}
                </span>
              </div>
            )}

            {/* Menu Grid */}
            <div className="grid grid-cols-1 gap-2">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.98] border ${
                      isSelected
                        ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] border-transparent shadow-md font-bold'
                        : 'bg-white dark:bg-[#161d32] border-[#dce7f7] dark:border-[#243152] text-[#142247] dark:text-white hover:border-[#9ab3f5]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-white/20 dark:bg-[#142247]/20 text-white dark:text-[#142247]'
                          : 'bg-[#edf3fd] dark:bg-[#1a233b] text-[#5d729c] dark:text-[#9ab3f5]'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate">{item.label}</h4>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-white/80 dark:text-[#142247]/80' : 'text-[#5d729c] dark:text-[#8fa1c4]'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
