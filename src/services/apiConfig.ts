import { StorageService } from './storage';

/**
 * PAPABVTIFY Unified Cross-Platform API & Network Configuration
 * 100% Standalone on Android APK & Web, seamlessly integrated with Windows Electron.
 * Eliminates all hardcoded local LAN IP dependencies in production.
 */

export class ApiConfig {
  private static cachedBaseUrl: string | null = null;

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
   * On standalone Android APK, returns user-configured URL or empty string (standalone mode).
   */
  public static getServerBaseUrl(): string {
    // 1. Check user-configured override from Settings
    const configured = this.getCustomServerUrl();
    if (configured) {
      return configured;
    }

    // 2. If running inside Electron or direct web localhost:5188
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      const hostname = window.location.hostname;
      if (port === '5188' || hostname === '127.0.0.1') {
        return window.location.origin;
      }
    }

    // 3. If running inside Android APK (Capacitor) without custom server
    if (this.isNativeMobile()) {
      return ''; // Standalone mode: uses direct client APIs (YouTube InnerTube & Piped)
    }

    // 4. Default fallback in standard browser
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:') && !window.location.origin.startsWith('capacitor:')) {
      return window.location.origin;
    }

    return '';
  }

  /**
   * Sets custom backend server URL and persists in StorageService
   */
  public static setServerBaseUrl(url: string): void {
    const clean = url.trim().replace(/\/+$/, '');
    StorageService.setServerUrl(clean);
    this.cachedBaseUrl = clean;
  }

  /**
   * Converts a relative API path (/api/...) into a full qualified URL
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
   * Resolves audio stream URLs for HTMLAudioElement playback
   */
  public static resolveStreamUrl(streamUrlOrId: string): string {
    if (!streamUrlOrId) return '';
    if (streamUrlOrId.startsWith('blob:') || streamUrlOrId.startsWith('http://') || streamUrlOrId.startsWith('https://')) {
      return streamUrlOrId;
    }
    const cleanId = streamUrlOrId.replace(/^\/api\/stream\?id=/, '');
    const base = this.getServerBaseUrl();
    if (base) {
      return `${base}/api/stream?id=${encodeURIComponent(cleanId)}`;
    }
    return `/api/stream?id=${encodeURIComponent(cleanId)}`;
  }

  /**
   * Safe fetch with Content-Type verification and intelligent error reporting.
   * Completely avoids "Unexpected token '<', '<!DOCTYPE '... is not valid JSON" crashes.
   */
  public static async safeFetch(endpoint: string, options?: RequestInit): Promise<Response> {
    const fullUrl = this.resolveApiUrl(endpoint);

    // If on native mobile and URL is relative (no backend configured), do not attempt unroutable fetch
    if (this.isNativeMobile() && fullUrl.startsWith('/api/') && !this.getServerBaseUrl()) {
      throw new Error(`Mode Standalone: Backend publik tidak dikonfigurasi.`);
    }

    try {
      const res = await fetch(fullUrl, options);
      return res;
    } catch (err: any) {
      console.warn(`[ApiConfig] Fetch failed for ${fullUrl}:`, err.message);
      throw new Error(`Tidak dapat terhubung ke server PAPABVTIFY (${fullUrl}). Periksa koneksi jaringan perangkat.`);
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
        throw new Error(`Server mengembalikan respons tidak valid.`);
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
