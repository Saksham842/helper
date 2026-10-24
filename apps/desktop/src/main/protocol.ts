import { app, BrowserWindow } from 'electron';
import path from 'node:path';

export const PROTOCOL_PREFIX = 'copilot';

export function registerCustomProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL_PREFIX, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL_PREFIX);
  }
}

export function handleDeepLinkUrl(urlStr: string, mainWindow: BrowserWindow | null) {
  if (!urlStr || !urlStr.startsWith(`${PROTOCOL_PREFIX}://`)) {
    return false;
  }

  try {
    const parsed = new URL(urlStr);
    const token = parsed.searchParams.get('token');
    const email = parsed.searchParams.get('email') || undefined;
    const userId = parsed.searchParams.get('userId') || undefined;

    if (token && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth:token-received', {
        token,
        email,
        userId,
      });

      if (mainWindow.isMinimized()) mainWindow.restore();
      return true;
    }
  } catch (err) {
    console.error('Failed to parse protocol URL:', urlStr, err);
  }
  return false;
}
