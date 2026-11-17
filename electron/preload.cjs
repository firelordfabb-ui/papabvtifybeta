const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('PAPABVTIFY_DESKTOP', {
  isDesktop: true,
  platform: process.platform,
  version: '3.2.0',
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  sendMediaState: (state) => ipcRenderer.send('media-state-update', state),
  onWindowState: (callback) => {
    ipcRenderer.on('app-window-state', (_event, state) => callback(state));
  }
});
