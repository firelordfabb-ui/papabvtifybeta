export type PerformanceProfile = 'saver' | 'balanced' | 'high_quality';

export interface WindowStateInfo {
  isFocused: boolean;
  isMinimized: boolean;
  isBackground: boolean;
}

type WindowStateListener = (state: WindowStateInfo) => void;

export class AdaptivePerformanceManager {
  private static instance: AdaptivePerformanceManager;
  private isFocused: boolean = true;
  private isMinimized: boolean = false;
  private listeners: Set<WindowStateListener> = new Set();
  private profile: PerformanceProfile = 'balanced';

  private constructor() {
    this.initLifecycleListeners();
  }

  public static getInstance(): AdaptivePerformanceManager {
    if (!AdaptivePerformanceManager.instance) {
      AdaptivePerformanceManager.instance = new AdaptivePerformanceManager();
    }
    return AdaptivePerformanceManager.instance;
  }

  private initLifecycleListeners(): void {
    if (typeof window === 'undefined') return;

    // 1. Electron Native OS Window State
    const desktopApi = (window as any).PAPABVTIFY_DESKTOP;
    if (desktopApi && typeof desktopApi.onWindowState === 'function') {
      desktopApi.onWindowState((state: { isFocused: boolean; isMinimized: boolean }) => {
        this.isFocused = state.isFocused;
        this.isMinimized = state.isMinimized;
        this.applyAdaptiveState();
      });
    }

    // 2. Standard Web Visibility & Focus Fallbacks
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isFocused = false;
      } else {
        this.isFocused = true;
      }
      this.applyAdaptiveState();
    });

    window.addEventListener('focus', () => {
      this.isFocused = true;
      this.isMinimized = false;
      this.applyAdaptiveState();
    });

    window.addEventListener('blur', () => {
      this.isFocused = false;
      this.applyAdaptiveState();
    });
  }

  private applyAdaptiveState(): void {
    const isBackground = !this.isFocused || this.isMinimized;
    
    if (typeof document !== 'undefined' && document.body) {
      if (isBackground) {
        document.body.classList.add('app-background-mode');
      } else {
        document.body.classList.remove('app-background-mode');
      }
    }

    const stateInfo: WindowStateInfo = {
      isFocused: this.isFocused,
      isMinimized: this.isMinimized,
      isBackground
    };

    this.listeners.forEach(fn => {
      try {
        fn(stateInfo);
      } catch (err) {
        console.warn('[AdaptivePerformance] Listener notification error:', err);
      }
    });
  }

  public subscribe(listener: WindowStateListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener({
      isFocused: this.isFocused,
      isMinimized: this.isMinimized,
      isBackground: !this.isFocused || this.isMinimized
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isBackground(): boolean {
    return !this.isFocused || this.isMinimized;
  }

  public isVisualizerAllowed(): boolean {
    if (this.isBackground()) return false;
    if (this.profile === 'saver') return false;
    return true;
  }

  public getProfile(): PerformanceProfile {
    return this.profile;
  }

  public setProfile(profile: PerformanceProfile): void {
    this.profile = profile;
    this.applyAdaptiveState();
  }
}
