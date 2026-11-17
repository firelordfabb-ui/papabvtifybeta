const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('../server.cjs');

const logFile = path.join(__dirname, 'capture.log');
function log(...args) {
  const line = args.join(' ') + '\n';
  fs.appendFileSync(logFile, line);
  console.log(...args);
}
fs.writeFileSync(logFile, 'Starting...\n');

async function run() {
  log('1. Starting PAPABVTIFY test server...');
  const { server, port } = await startServer(5199);
  log(`Server started on port ${port}`);

  await app.whenReady();
  log('2. Electron ready. Launching headless browser...');

  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    show: false,
    webPreferences: {
      offscreen: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const url = `http://127.0.0.1:${port}`;
  // Set auth credentials via cookie or evaluate before initial page render
  await win.loadURL(url);
  log('3. Loaded initial page. Setting test user session...');
  await win.webContents.executeJavaScript(`
    const testUser = {
      id: 'usr_fabb_test',
      username: 'fabb',
      displayName: 'Fabb',
      email: 'fabb@papabvtify.com',
      avatar: 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg',
      avatarType: 'custom',
      createdAt: Date.now()
    };
    localStorage.setItem('papabvtify_session_token_v2', 'test_tok_999');
    localStorage.setItem('papabvtify_auth_user_v2', JSON.stringify(testUser));
    localStorage.setItem('papabvtify_theme', 'light');
  `);

  // Reload and wait for DOM ready
  log('4. Navigating with active session...');
  await win.loadURL(url);
  await new Promise(r => setTimeout(r, 4000));

  log('5. Navigating to Pustaka view...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pustaka = buttons.find(b => b.textContent && b.textContent.includes('Pustaka'));
      if (pustaka) pustaka.click();
    })();
  `);

  await new Promise(r => setTimeout(r, 2000));

  log('6. Opening Import modal...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const importBtn = buttons.find(b => b.textContent && b.textContent.includes('Import Playlist'));
      if (importBtn) importBtn.click();
    })();
  `);

  await new Promise(r => setTimeout(r, 2000));

  log('7. Triggering authentic YouTube / Spotify import...');
  await win.webContents.executeJavaScript(`
    (() => {
      // Click official YouTube Top Hits sample button
      const buttons = Array.from(document.querySelectorAll('button'));
      const sampleBtn = buttons.find(b => b.textContent && b.textContent.includes('YouTube (Top Hits)'));
      if (sampleBtn) {
        sampleBtn.click();
      } else {
        const input = document.querySelector('input[type="url"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'https://www.youtube.com/playlist?list=PLuV8nkFf3ardy2JaKAVgTU3ihpT_LAQ2O');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      setTimeout(() => {
        const submit = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Mulai Import'));
        if (submit) submit.click();
      }, 500);
    })();
  `);

  log('8. Waiting for matching progress...');
  let maxWait = 25;
  while (maxWait > 0) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await win.webContents.executeJavaScript(`
      (() => {
        const text = document.body.innerText || '';
        const hasResults = text.includes('Total Sumber') || text.includes('Akurasi') || text.includes('Cocok Akurat');
        return { hasResults, snippet: text.slice(0, 150).replace(/\\n/g, ' ') };
      })()
    `);
    if (status.hasResults) {
      log('   -> Import results loaded into DOM!');
      break;
    }
    maxWait--;
  }

  await new Promise(r => setTimeout(r, 2000));

  const artifactDir = 'C:/Users/fabiangarfield/.gemini/antigravity/brain/8b27c848-de72-4d9a-9d94-c0d129dcdc5a';
  const img1 = await win.capturePage();
  const file1 = path.join(artifactDir, 'playlist_import_modal_verified.png');
  fs.writeFileSync(file1, img1.toPNG());
  log('9. Saved Screenshot 1:', file1);

  // Click Simpan button
  log('10. Saving playlist to Pustaka...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => b.textContent && b.textContent.includes('Simpan ('));
      if (saveBtn) saveBtn.click();
    })();
  `);

  await new Promise(r => setTimeout(r, 2500));

  const img2 = await win.capturePage();
  const file2 = path.join(artifactDir, 'playlist_pustaka_saved_verified.png');
  fs.writeFileSync(file2, img2.toPNG());
  log('11. Saved Screenshot 2:', file2);

  // Click on the imported playlist card in Pustaka
  log('12. Opening Playlist Detail View in Pustaka...');
  await win.webContents.executeJavaScript(`
    (() => {
      const elements = Array.from(document.querySelectorAll('h3, h4, span, div'));
      const card = elements.find(el => el.textContent && el.textContent.includes('Today'));
      if (card) {
        (card.closest('.liquid-glass') || card).click();
      }
    })();
  `);

  await new Promise(r => setTimeout(r, 2000));

  const img3 = await win.capturePage();
  const file3 = path.join(artifactDir, 'playlist_detail_view_verified.png');
  fs.writeFileSync(file3, img3.toPNG());
  log('13. Saved Screenshot 3:', file3);

  log('All verification captures completed successfully!');
  server.close();
  app.quit();
}

run().catch(err => {
  log('Run error:', err.stack || err.message);
  app.quit();
});
