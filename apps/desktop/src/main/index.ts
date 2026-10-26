import { initProcessErrorCatchers, logInfo, logWarn, logError } from './logger';

// 1. Initialize top-level process crash / uncaught exception logging immediately
initProcessErrorCatchers();

import { app, ipcMain, session, desktopCapturer } from 'electron';
import { registerCustomProtocol, handleDeepLinkUrl } from './protocol';
import { HUDWindowManager } from './hud';
import { registerGlobalShortcuts } from './shortcuts';
import { ensureWindowsMicUnmuted } from './windowsAudio';

logInfo(`[Main] Process starting. PID: ${process.pid}, Exec: "${process.execPath}", Argv:`, process.argv);

let hudManager: HUDWindowManager | null = null;
let pendingDeepLinkUrl: string | null = null;

try {
  registerCustomProtocol();
  logInfo('[Main] Custom protocol registered.');
} catch (err) {
  logError('[Main] Failed to register custom protocol:', err);
}

const gotTheLock = app.requestSingleInstanceLock();
logInfo(`[Main] requestSingleInstanceLock status: ${gotTheLock ? 'PRIMARY_INSTANCE' : 'SECONDARY_INSTANCE'}`);

if (!gotTheLock) {
  logWarn(`[Main] Another instance of SystemAudioHelper is already running. Forwarding launch command to primary instance and exiting secondary PID ${process.pid}.`);
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    logInfo('[Main] second-instance event received with commandLine:', commandLine);
    if (hudManager) {
      logInfo('[Main] Restoring and bringing HUD overlay to front from second-instance.');
      hudManager.showHUD();
    }
    // Windows protocol argument check in second-instance
    const url = commandLine.find((arg) => arg.startsWith('copilot://'));
    if (url && hudManager) {
      logInfo('[Main] Forwarding deep link URL from second-instance:', url);
      let win = hudManager.getWindow();
      if (!win) {
        win = hudManager.createWindow();
      }
      handleDeepLinkUrl(url, win);
    }
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    logInfo('[Main] open-url event received with URL:', url);
    if (hudManager && hudManager.getWindow()) {
      handleDeepLinkUrl(url, hudManager.getWindow());
    } else {
      pendingDeepLinkUrl = url;
    }
  });

  app.whenReady().then(() => {
    logInfo(`[Main] app.whenReady() fired. AppVersion: ${app.getVersion()}, isPackaged: ${app.isPackaged}, userData: "${app.getPath('userData')}"`);

    // Silent permissions approval for loopback and microphone capture
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      logInfo(`[Main] Permission requested: ${permission} -> granting silently.`);
      callback(true);
    });

    session.defaultSession.setPermissionCheckHandler((_webContents, _permission) => {
      return true;
    });

    session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        if (sources.length > 0) {
          logInfo(`[Main] displayMediaRequestHandler selected primary display source: ${sources[0].name} (ID: ${sources[0].id})`);
          callback({ video: sources[0], audio: 'loopback' });
        } else {
          logWarn('[Main] displayMediaRequestHandler found 0 screen sources.');
          callback({});
        }
      }).catch((err) => {
        logError('[Main] Failed to get sources for loopback capture:', err);
        callback({});
      });
    });

    try {
      hudManager = new HUDWindowManager();
      const win = hudManager.createWindow();
      logInfo(`[Main] HUDWindowManager createWindow initialized. Window ID: ${win.id}`);
      registerGlobalShortcuts(hudManager);
      logInfo('[Main] Global shortcuts registered successfully.');
    } catch (err) {
      logError('[Main] FATAL: Error during HUD window creation or shortcuts registration:', err);
    }

    ipcMain.handle('app:version', () => app.getVersion());
    ipcMain.handle('app:get-user-data-path', () => app.getPath('userData'));
    ipcMain.handle('system:ensure-mic-unmuted', () => {
      ensureWindowsMicUnmuted();
      return true;
    });

    // Programmatically ensure Windows microphone is not muted and volume is healthy
    ensureWindowsMicUnmuted();

    // Check cold-start deep link on Windows
    const coldStartUrl = process.argv.find((arg) => arg.startsWith('copilot://'));
    if (coldStartUrl && hudManager?.getWindow()) {
      logInfo('[Main] Handling cold-start deep link URL:', coldStartUrl);
      handleDeepLinkUrl(coldStartUrl, hudManager.getWindow());
    } else if (pendingDeepLinkUrl && hudManager?.getWindow()) {
      logInfo('[Main] Handling pending deep link URL:', pendingDeepLinkUrl);
      handleDeepLinkUrl(pendingDeepLinkUrl, hudManager.getWindow());
      pendingDeepLinkUrl = null;
    }

    app.on('activate', () => {
      logInfo('[Main] app activate event received.');
      if (hudManager && !hudManager.getWindow()) {
        hudManager.createWindow();
      }
    });
  }).catch((err) => {
    logError('[Main] FATAL: Error in app.whenReady():', err);
  });

  app.on('window-all-closed', () => {
    logInfo('[Main] window-all-closed event received.');
    if (process.platform !== 'darwin' && !hudManager?.isRecovering()) {
      logInfo('[Main] Quitting application on non-macOS platform.');
      app.quit();
    }
  });

  app.on('before-quit', () => {
    logInfo('[Main] before-quit event received.');
  });

  app.on('will-quit', () => {
    logInfo('[Main] will-quit event received.');
  });
}
