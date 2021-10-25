import {app, BrowserWindow, nativeTheme} from 'electron';
import path from 'path';
import DEBUG from './utils/debug';
import PKG from '../package.json';

// TODO Fix DevTools Extensions
try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions')); // eslint-disable-line
  }
} catch (_) {
}

// Fix the source map. Use content scripts for node code, page for vue
if (DEBUG) {
  const sourceMapSupport = require('source-map-support'); // eslint-disable-line
  sourceMapSupport.install(); // eslint-disable-line
}

// Enable electron debug
if (DEBUG) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-var-requires
  require('electron-debug')(); // eslint-disable-line global-require
  const path = require('path'); // eslint-disable-line
  const p = path.join(__dirname, '..', 'app', 'node_modules'); // eslint-disable-line
  require('module').globalPaths.push(p); // eslint-disable-line
}

// Handle Mac quit option
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

// Install vuejs3 devtools
const installExtensions = async () => {
  if (DEBUG) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
    const installer = require('electron-devtools-installer'); // eslint-disable-line global-require

    const extensions = [
      'VUEJS3_DEVTOOLS'
    ];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    for (const name of extensions) { // eslint-disable-line
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await installer.default(installer[name], forceDownload);
      } catch (e) {
      } // eslint-disable-line
    }
  }
};

let mainWindow;

const createWindow = () => {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    autoHideMenuBar: process.platform !== 'darwin',
    webPreferences: {
      contextIsolation: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      enableRemoteModule: true
    }
  })

  mainWindow.maximize();
  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  });

  // Show developer tools
  if (DEBUG) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // mainWindow.openDevTools();
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.on('ready', async () => {
  await installExtensions();
  createWindow();
  if (DEBUG) console.info('Electron app ready.');
});

// Set about options
if (typeof app.setAboutPanelOptions === 'function') {
  app.setAboutPanelOptions({
    applicationName: PKG.productName,
    applicationVersion: PKG.version,
    copyright: 'Copyright (C) 2021 theagilemonkeys.com',
    credits: 'Licence: ' + PKG.license,
    version: DEBUG ? '[debug]' : ''
  });
}

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
  if (DEBUG) console.info('Electron app activate.');
})
