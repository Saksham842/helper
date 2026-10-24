import { app, ipcMain } from 'electron';
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
    hudManager = new HUDWindowManager();
    hudManager.createWindow();
    registerGlobalShortcuts(hudManager);

    ipcMain.handle('app:version', () => app.getVersion());

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
