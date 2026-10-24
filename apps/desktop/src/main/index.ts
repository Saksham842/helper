import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { registerCustomProtocol, handleDeepLinkUrl } from './protocol';

let mainWindow: BrowserWindow | null = null;
let pendingDeepLinkUrl: string | null = null;

registerCustomProtocol();

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // Windows protocol argument check in second-instance
    const url = commandLine.find((arg) => arg.startsWith('copilot://'));
    if (url) {
      handleDeepLinkUrl(url, mainWindow);
    }
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
      handleDeepLinkUrl(url, mainWindow);
    } else {
      pendingDeepLinkUrl = url;
    }
  });

  app.whenReady().then(() => {
    createWindow();

    // Check cold-start deep link on Windows
    const coldStartUrl = process.argv.find((arg) => arg.startsWith('copilot://'));
    if (coldStartUrl) {
      handleDeepLinkUrl(coldStartUrl, mainWindow);
    } else if (pendingDeepLinkUrl) {
      handleDeepLinkUrl(pendingDeepLinkUrl, mainWindow);
      pendingDeepLinkUrl = null;
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  ipcMain.handle('app:version', () => app.getVersion());

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}
