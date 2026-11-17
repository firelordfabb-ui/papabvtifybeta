import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  isLoggingOut?: boolean;
}

export const LogoutConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirmLogout,
  isLoggingOut = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#101A35] border border-[#dce7f7] dark:border-[#1E2D56] p-6 shadow-2xl space-y-5 text-[#142247] dark:text-[#EAF0FF] overflow-hidden">
        
        {/* Soft Ambient Aurora Backdrop in Dark */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/15 dark:bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Dismiss Button */}
        <button
          onClick={onClose}
          disabled={isLoggingOut}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#edf3fd] dark:hover:bg-[#1a2444] text-[#5d729c] hover:text-[#142247] dark:hover:text-white transition disabled:opacity-50 cursor-pointer"
          title="Batal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center shrink-0">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-[#142247] dark:text-white">
              Keluar dari Akun?
            </h3>
            <span className="text-[11px] font-mono font-semibold text-[#5d729c] dark:text-[#94A6D2]">
              Konfirmasi Sesi
            </span>
          </div>
        </div>

        {/* Body Description */}
        <p className="text-xs text-[#5d729c] dark:text-[#94A6D2] leading-relaxed">
          Yakin ingin keluar dari akun Anda? Sesi Anda pada perangkat ini akan diakhiri. Seluruh playlist, musik tersimpan, riwayat, dan statistik Anda tetap aman di server.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#edf3fd] dark:bg-[#162142] hover:bg-[#e1ebfa] dark:hover:bg-[#1c2a55] text-xs font-bold text-[#142247] dark:text-[#EAF0FF] transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={onConfirmLogout}
            disabled={isLoggingOut}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Keluar...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};