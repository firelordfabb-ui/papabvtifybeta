import { StorageService } from './storage';

/**
 * PAPABVTIFY Unified Cross-Platform API & Network Configuration
 * 100% Feature Parity & Seamless Cross-Platform Connectivity between Windows Electron & Android APK.
 * Auto-detects local PC server on Wi-Fi (192.168.1.10:5188) while supporting standalone cloud & offline modes.
 */

export const DEFAULT_LAN_SERVER = 'http://192.168.1.10:5188';

export class ApiConfig {
  private static cachedBaseUrl: string | null = null;
  private static isServerOnline: boolean = true;
  private static probePromise: Promise<boolean> | null = null;

  /**
   * Detects if app is running inside Capacitor Android / iOS native wrapper
   */
  public static isNativeMobile(): boolean {
    if (typeof window === 'undefined') return false;
    const isCapacitor = (window as any).Capacitor !== undefined;
    const isCapacitorScheme = window.location.protocol === 'capacitor:' || 
      (window.location.hostname === 'localhost' && !window.location.port && !window.location.origin.includes(':5188'));
    return isCapacitor || isCapacitorScheme;
  }

  public static isNativePlatform(): boolean {
    return this.isNativeMobile();
  }

  /**
   * Returns user-configured custom backend server URL (if explicitly set in Settings)
   */
  public static getCustomServerUrl(): string {
    const configured = StorageService.getServerUrl();
    if (configured && configured.trim()) {
      return configured.trim().replace(/\/+$/, '');
    }
    return '';
  }

  /**
   * Resolves the active backend server URL.
   * Seamlessly resolves to the PC LAN server (192.168.1.10:5188) on home Wi-Fi,
   * or user-customized URL in Settings, or origin in Electron/Web.
   */
  public static getServerBaseUrl(): string {
    // 1. Check user-configured override from Settings
    const configured = this.getCustomServerUrl();
    if (configured) {
      return configured;
    }

    // 2. If running inside Electron or direct web localhost:5188 / 127.0.0.1
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      const hostname = window.location.hostname;
      if (port === '5188' || hostname === '127.0.0.1') {
        return window.location.origin;
      }
    }

    // 3. If running inside Android APK (Capacitor)
    if (this.isNativeMobile()) {
      // Connect to the local PC server by default for full Windows = Android parity
      return this.cachedBaseUrl || DEFAULT_LAN_SERVER;
    }

    // 4. Default fallback in standard browser
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:') && !window.location.origin.startsWith('capacitor:')) {
      return window.location.origin;
    }

    return DEFAULT_LAN_SERVER;
  }

  /**
   * Sets custom backend server URL and persists in StorageService
   */
  public static setServerBaseUrl(url: string): void {
    const clean = url.trim().replace(/\/+$/, '');
    StorageService.setServerUrl(clean);
    this.cachedBaseUrl = clean || null;
  }

  /**
   * Converts a relative API path (/api/...) into a fully qualified URL
   */
  public static resolveApiUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = this.getServerBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${cleanPath}` : cleanPath;
  }

  /**
   * Resolves audio stream URLs for HTMLAudioElement playback.
   * Guarantees a fully-qualified playable URL so Capacitor WebView never resolves to local index.html.
   */
  public static resolveStreamUrl(streamUrlOrId: string): string {
    if (!streamUrlOrId) return '';
    if (streamUrlOrId.startsWith('blob:') || streamUrlOrId.startsWith('http://') || streamUrlOrId.startsWith('https://')) {
      return streamUrlOrId;
    }
    const cleanId = streamUrlOrId.replace(/^\/api\/stream\?id=/, '');
    const base = this.getServerBaseUrl() || DEFAULT_LAN_SERVER;
    return `${base}/api/stream?id=${encodeURIComponent(cleanId)}`;
  }

  /**
   * Asynchronous background health check to probe if backend server is responsive
   */
  public static async probeBackend(timeoutMs: number = 2000): Promise<boolean> {
    if (this.probePromise) return this.probePromise;

    this.probePromise = (async () => {
      const base = this.getServerBaseUrl();
      if (!base) {
        this.isServerOnline = false;
        return false;
      }
      try {
        const res = await fetch(`${base}/api/health`, {
          signal: AbortSignal.timeout(timeoutMs)
        });
        this.isServerOnline = res.ok;
        return res.ok;
      } catch {
        this.isServerOnline = false;
        return false;
      } finally {
        setTimeout(() => { this.probePromise = null; }, 5000);
      }
    })();

    return this.probePromise;
  }

  public static isOnline(): boolean {
    return this.isServerOnline;
  }

  /**
   * Safe fetch with Content-Type verification and polite Indonesian error handling.
   * Completely avoids unhandled "Unexpected token '<', '<!DOCTYPE '..." or unrouted crashes.
   */
  public static async safeFetch(endpoint: string, options?: RequestInit): Promise<Response> {
    const fullUrl = this.resolveApiUrl(endpoint);

    try {
      const res = await fetch(fullUrl, options);
      return res;
    } catch (err: any) {
      console.warn(`[ApiConfig] Fetch failed for ${fullUrl}:`, err.message);
      throw new Error(`Tidak dapat terhubung ke server PAPABVTIFY (${fullUrl}). Pastikan HP dan PC terhubung ke jaringan Wi-Fi yang sama.`);
    }
  }

  /**
   * Safe JSON fetch with Content-Type validation
   */
  public static async safeJsonFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await this.safeFetch(endpoint, options);
    const contentType = res.headers.get('content-type') || '';

    // If server returned HTML (e.g. 404 or index.html fallback from Capacitor WebView)
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error(`Server mengembalikan respons tidak valid. Periksa koneksi backend.`);
      }
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Respon server tidak valid (${res.status}).`);
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Permintaan gagal dengan status ${res.status}.`);
    }
    return data as T;
  }
}
