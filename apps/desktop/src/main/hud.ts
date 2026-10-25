import { app, BrowserWindow, screen, ipcMain, desktopCapturer } from 'electron';
import path from 'node:path';
import type { HUDState } from '@parakeet/shared';

export class HUDWindowManager {
  private window: BrowserWindow | null = null;
  private state: HUDState = {
    isVisible: true,
    opacity: 0.95,
    isClickThrough: false,
    isContentProtected: false,
  };

  constructor() {
    this.setupIPCHandlers();
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public getState(): HUDState {
    return { ...this.state };
  }

  public createWindow(): BrowserWindow {
    // Hide macOS dock icon for complete stealth
    if (process.platform === 'darwin' && app.dock) {
      try {
        app.dock.hide();
      } catch (err) {
        console.error('Failed to hide macOS dock icon:', err);
      }
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, x: screenX, y: screenY } = primaryDisplay.workArea;

    const windowWidth = 440;
    const windowHeight = 620;
    const posX = screenX + screenWidth - windowWidth - 24;
    const posY = screenY + 24;

    this.window = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: posX,
      y: posY,
      transparent: true,
      frame: false,
      hasShadow: false,
      backgroundColor: '#00000000',
      skipTaskbar: true, // Stealth from Windows Taskbar / Alt-Tab
      focusable: false,  // Anti-blur: never steals focus from interview coding platforms
      alwaysOnTop: true,
      resizable: true,
      minWidth: 320,
      minHeight: 200,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Topmost level guarantees visibility over full-screen apps and video calls
    this.window.setAlwaysOnTop(true, 'screen-saver', 1);
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Screen protection: invokes SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE) on Win32
    // and NSWindowSharingNone on macOS
    try {
      this.window.setContentProtection(true);
      this.state.isContentProtected = true;
    } catch (err) {
      console.error('Failed to set content protection:', err);
      this.state.isContentProtected = false;
    }

    this.window.setOpacity(this.state.opacity);

    // Initial show without stealing focus
    this.window.showInactive();
    this.state.isVisible = true;

    if (process.env.VITE_DEV_SERVER_URL) {
      this.window.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      this.window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.window.webContents.on('did-finish-load', () => {
      this.broadcastState();
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    return this.window;
  }

  public showHUD(): void {
    if (!this.window) return;
    try {
      this.window.setContentProtection(true);
      this.state.isContentProtected = true;
    } catch (err) {
      console.error('Failed to re-assert content protection on showHUD:', err);
    }
    this.window.setAlwaysOnTop(true, 'screen-saver', 1);
    this.window.setFocusable(false);
    this.window.showInactive();
    this.state.isVisible = true;
    this.broadcastState();
  }

  public hideHUD(): void {
    if (!this.window) return;
    this.window.hide();
    this.state.isVisible = false;
    this.broadcastState();
  }

  public toggleVisibility(): void {
    if (!this.window) return;
    if (this.state.isVisible && this.window.isVisible()) {
      this.hideHUD();
    } else {
      this.showHUD();
    }
  }

  public setClickThrough(enabled: boolean): void {
    if (!this.window) return;
    this.state.isClickThrough = enabled;
    this.window.setIgnoreMouseEvents(enabled, { forward: true });
    this.broadcastState();
  }

  public toggleClickThrough(): void {
    this.setClickThrough(!this.state.isClickThrough);
  }

  public setOpacity(level: number): void {
    if (!this.window) return;
    const clamped = Math.min(1.0, Math.max(0.1, Number(level.toFixed(2))));
    this.state.opacity = clamped;
    this.window.setOpacity(clamped);
    this.broadcastState();
  }

  public adjustOpacity(delta: number): void {
    this.setOpacity(this.state.opacity + delta);
  }

  public setDynamicIgnoreMouse(ignore: boolean): void {
    if (!this.window) return;
    // If user explicitly activated full click-through mode, keep ignoring mouse events
    if (this.state.isClickThrough) {
      this.window.setIgnoreMouseEvents(true, { forward: true });
      return;
    }
    this.window.setIgnoreMouseEvents(ignore, { forward: true });
  }

  private broadcastState(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('hud:state-changed', this.state);
    }
  }

  private setupIPCHandlers(): void {
    ipcMain.handle('hud:get-state', () => this.getState());

    ipcMain.handle('hud:toggle-visibility', () => {
      this.toggleVisibility();
      return this.getState();
    });

    ipcMain.handle('hud:set-click-through', (_event, enabled: boolean) => {
      this.setClickThrough(enabled);
      return this.getState();
    });

    ipcMain.handle('hud:toggle-click-through', () => {
      this.toggleClickThrough();
      return this.getState();
    });

    ipcMain.handle('hud:set-opacity', (_event, level: number) => {
      this.setOpacity(level);
      return this.getState();
    });

    ipcMain.handle('hud:adjust-opacity', (_event, delta: number) => {
      this.adjustOpacity(delta);
      return this.getState();
    });

    ipcMain.on('hud:set-dynamic-ignore-mouse', (_event, ignore: boolean) => {
      this.setDynamicIgnoreMouse(ignore);
    });

    ipcMain.handle('screen:capture-silent', async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 },
        });
        if (sources.length > 0) {
          return sources[0].thumbnail.toDataURL();
        }
        throw new Error('No screen sources available for silent capture');
      } catch (err: any) {
        console.error('Silent screen capture error:', err);
        throw err;
      }
    });
  }
}
