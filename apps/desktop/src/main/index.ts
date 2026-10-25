import { app, ipcMain, session, desktopCapturer } from 'electron';
import { registerCustomProtocol, handleDeepLinkUrl } from './protocol';
import { HUDWindowManager } from './hud';
import { registerGlobalShortcuts } from './shortcuts';

let hudManager: HUDWindowManager | null = null;
let pendingDeepLinkUrl: string | null = null;

registerCustomProtocol();

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (hudManager) {
      hudManager.showHUD();
    }
    // Windows protocol argument check in second-instance
    const url = commandLine.find((arg) => arg.startsWith('copilot://'));
    if (url && hudManager) {
      handleDeepLinkUrl(url, hudManager.getWindow());
    }
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (hudManager && hudManager.getWindow()) {
      handleDeepLinkUrl(url, hudManager.getWindow());
    } else {
      pendingDeepLinkUrl = url;
    }
  });

  app.whenReady().then(() => {
    // Silent permissions approval for loopback and microphone capture
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true);
      } else {
        callback(true);
      }
    });

    session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        if (sources.length > 0) {
          callback({ video: sources[0], audio: 'loopback' });
        } else {
          callback({});
        }
      }).catch((err) => {
        console.error('Failed to get sources for loopback capture:', err);
        callback({});
      });
    });

    hudManager = new HUDWindowManager();
    hudManager.createWindow();
    registerGlobalShortcuts(hudManager);

    ipcMain.handle('app:version', () => app.getVersion());
    ipcMain.handle('app:get-user-data-path', () => app.getPath('userData'));


    // Check cold-start deep link on Windows
    const coldStartUrl = process.argv.find((arg) => arg.startsWith('copilot://'));
    if (coldStartUrl && hudManager.getWindow()) {
      handleDeepLinkUrl(coldStartUrl, hudManager.getWindow());
    } else if (pendingDeepLinkUrl && hudManager.getWindow()) {
      handleDeepLinkUrl(pendingDeepLinkUrl, hudManager.getWindow());
      pendingDeepLinkUrl = null;
    }

    app.on('activate', () => {
      if (hudManager && !hudManager.getWindow()) {
        hudManager.createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
