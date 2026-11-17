const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { startServer } = require('../server.cjs');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Hardware-tailored switches optimized for Intel HD Graphics 4400 (Haswell) & Core i5-4200U
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling'); // Clean integration
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256'); // Strict V8 heap boundary
app.commandLine.appendSwitch('renderer-process-limit', '2'); // Prevent process sprawl
app.commandLine.appendSwitch('use-angle', 'd3d11'); // Native Direct3D 11 backend for Intel HD Graphics
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-renderer-backgrounding', 'false'); // Allow Chromium to yield GPU in background

let mainWindow = null;
let tray = null;
let serverInstance = null;
let serverPort = 5188;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function createWindow() {
  // Clear any legacy Service Workers or stale HTTP cache in Electron
  try {
    const { session } = require('electron');
    if (session && session.defaultSession) {
      await session.defaultSession.clearStorageData({
        storages: ['serviceworkers', 'cachestorage']
      });
      await session.defaultSession.clearCache();
    }
  } catch (e) {
    console.warn('[Electron] Cache clean note:', e.message);
  }

  const iconPath = path.join(__dirname, '../build/icon.png');
  let icon = null;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch {}

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1024,
    minHeight: 680,
    title: 'PAPABVTIFY — Next-Gen Music Streaming',
    icon: icon || undefined,
    backgroundColor: '#0a0d14', // Default to PAPABVTIFY sleek dark surface
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Critical for uninterrupted background audio playback
      webSecurity: true
    }
  });

  // Remove default menu for clean editorial desktop feel
  Menu.setApplicationMenu(null);

  // Show window when ready or on failsafe timer so user never gets stuck with invisible window
  let hasShown = false;
  const showSafely = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !hasShown) {
      hasShown = true;
      mainWindow.show();
      mainWindow.focus();
    }
  };

  mainWindow.once('ready-to-show', showSafely);
  setTimeout(showSafely, 2500);

  // Start internal backend server on PAPABVTIFY's dedicated port (5188)
  try {
    const res = await startServer(5188);
    serverInstance = res.server;
    serverPort = res.port;
  } catch (err) {
    console.warn('[Electron] Server start note:', err.message);
  }

  // Always use explicit IPv4 127.0.0.1 (never bare 'localhost') to prevent IPv6 ::1 collision
  const targetUrl = `http://127.0.0.1:${serverPort}`;
  console.log('[Electron] Loading application URL:', targetUrl);

  // Robust load with retry to prevent blank screen if server initialization takes a fraction of a second
  const loadWithRetry = async (url, retries = 6, delay = 500) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        await mainWindow.loadURL(url);
        console.log(`[Electron] Application loaded successfully on attempt ${attempt}`);
        showSafely();
        return;
      } catch (err) {
        console.warn(`[Electron] Load attempt ${attempt}/${retries} failed (${err.message}). Retrying in ${delay}ms...`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('[Electron] All HTTP load attempts failed. Loading fallback bundle...');
          try {
            if (mainWindow && !mainWindow.isDestroyed()) {
              await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
              showSafely();
            }
          } catch (fileErr) {
            console.error('[Electron] Fallback loadFile failed:', fileErr.message);
            showSafely();
          }
        }
      }
    }
  };

  // Event handlers for resilience
  mainWindow.webContents.on('did-fail-load', (e, errorCode, errorDescription, validatedURL) => {
    console.warn(`[Electron] did-fail-load: ${errorDescription} (${errorCode}) for ${validatedURL}`);
    if (errorCode === -102 || errorCode === -105 || errorCode === -106) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(targetUrl).catch(() => {});
        }
      }, 1000);
    }
  });

  mainWindow.webContents.on('render-process-gone', (e, details) => {
    console.error('[Electron] Render process gone:', details);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  await loadWithRetry(targetUrl);

  // Emit OS-level window state to renderer for Adaptive Performance Management (Alt+Tab & Minimize stutter elimination)
  mainWindow.on('focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-window-state', { isFocused: true, isMinimized: false });
    }
  });

  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-window-state', { isFocused: false, isMinimized: false });
    }
  });

  mainWindow.on('minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-window-state', { isFocused: false, isMinimized: true });
    }
  });

  mainWindow.on('restore', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-window-state', { isFocused: true, isMinimized: false });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // IPC Handlers for custom title bar controls
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  // System Tray setup
  try {
    if (icon) {
      tray = new Tray(icon.resize({ width: 16, height: 16 }));
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Buka PAPABVTIFY',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Keluar',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]);
      tray.setToolTip('PAPABVTIFY — Next-Gen Music Streaming');
      tray.setContextMenu(contextMenu);
      tray.on('double-click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
    }
  } catch (e) {
    console.warn('[Electron] Tray init warning:', e.message);
  }
}

app.whenReady().then(createWindow);

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverInstance) {
      try { serverInstance.close(); } catch {}
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
