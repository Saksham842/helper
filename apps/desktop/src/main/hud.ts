import { app, BrowserWindow, screen, ipcMain, desktopCapturer } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { HUDState } from '@ghostpilot/shared';
import { logInfo, logWarn, logError } from './logger';

export class HUDWindowManager {
  private window: BrowserWindow | null = null;
  private state: HUDState = {
    isVisible: true,
    opacity: 0.95,
    isClickThrough: false,
    isContentProtected: false,
  };

  private isAutoRecovering: boolean = false;

  constructor() {
    this.setupIPCHandlers();
  }

  public isRecovering(): boolean {
    return this.isAutoRecovering;
  }

  public getWindow(): BrowserWindow | null {
    if (!this.window || this.window.isDestroyed() || this.window.webContents?.isCrashed()) {
      return null;
    }
    return this.window;
  }

  public getState(): HUDState {
    return { ...this.state };
  }

  public createWindow(): BrowserWindow {
    this.isAutoRecovering = false;
    // Hide macOS dock icon for complete stealth
    if (process.platform === 'darwin' && app.dock) {
      try {
        app.dock.hide();
      } catch (err) {
        logError('Failed to hide macOS dock icon:', err);
      }
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, x: screenX, y: screenY } = primaryDisplay.workArea;

    const windowWidth = 460;
    const windowHeight = 680;
    const posX = screenX + screenWidth - windowWidth - 24;
    const posY = screenY + 24;

    logInfo(`[HUD] Creating BrowserWindow at x=${posX}, y=${posY}, size=${windowWidth}x${windowHeight}`);

    this.window = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: posX,
      y: posY,
      show: false,
      backgroundColor: '#0a0f1d',
      frame: false,
      hasShadow: true,
      skipTaskbar: true,
      focusable: true,
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

    if (process.platform === 'darwin') {
      this.window.setAlwaysOnTop(true, 'screen-saver', 1);
      this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } else {
      this.window.setAlwaysOnTop(true, 'screen-saver');
    }

    this.window.setOpacity(this.state.opacity);

    const applySafeDisplay = () => {
      if (!this.window || this.window.isDestroyed()) return;
      if (!this.window.isVisible()) {
        logInfo('[HUD] Displaying HUD overlay window.');
        this.window.show();
        this.window.moveTop();
        this.state.isVisible = true;
      }
      try {
        this.window.setContentProtection(true);
        this.state.isContentProtected = true;
        logInfo('[HUD] Content protection (WDA_EXCLUDEFROMCAPTURE) applied.');
      } catch (err) {
        logError('[HUD] Failed to set content protection:', err);
      }
      this.broadcastState();
    };

    this.window.once('ready-to-show', () => {
      logInfo('[HUD] ready-to-show event fired.');
      applySafeDisplay();
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      logInfo('[HUD] Loading from Dev Server URL:', process.env.VITE_DEV_SERVER_URL);
      this.window.loadURL(process.env.VITE_DEV_SERVER_URL).catch((err) => {
        logError('[HUD] Failed to loadURL from VITE_DEV_SERVER_URL:', err);
      });
    } else {
      // Production index.html candidates
      const candidatePaths = [
        path.join(app.getAppPath(), 'dist', 'index.html'),
        path.resolve(__dirname, '../../dist/index.html'),
        path.resolve(__dirname, '../renderer/index.html'),
        path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
      ];

      let targetHtmlPath: string | null = null;
      for (const p of candidatePaths) {
        try {
          if (fs.existsSync(p)) {
            targetHtmlPath = p;
            break;
          }
        } catch {}
      }

      if (!targetHtmlPath) {
        targetHtmlPath = candidatePaths[0];
        logWarn(`[HUD] Could not verify candidate path with fs.existsSync, falling back to: ${targetHtmlPath}`);
      }

      logInfo(`[HUD] Loading renderer index.html from resolved path: ${targetHtmlPath}`);
      this.window.loadFile(targetHtmlPath).catch((err) => {
        logError(`[HUD] Failed to loadFile (${targetHtmlPath}):`, err);
      });
    }

    this.window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      logInfo(`[Renderer Console] [lvl:${level}] ${message} (${sourceId}:${line})`);
    });

    this.window.webContents.on('render-process-gone', (_event, details) => {
      logError(`[Renderer] render-process-gone: reason=${details.reason}, exitCode=${details.exitCode}`);
      this.isAutoRecovering = true;
      try {
        if (this.window && !this.window.isDestroyed()) {
          this.window.destroy();
        }
      } catch {}
      this.window = null;
      logInfo('[HUD] Window destroyed following render crash. Auto-recovering window in 500ms...');
      setTimeout(() => {
        this.createWindow();
      }, 500);
    });

    this.window.webContents.on('did-finish-load', () => {
      logInfo('[HUD] webContents did-finish-load successfully.');
      applySafeDisplay();
    });

    this.window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      logError(`[HUD] webContents did-fail-load: code=${errorCode}, desc=${errorDescription}, url=${validatedURL}`);
    });

    this.window.on('closed', () => {
      logInfo('[HUD] BrowserWindow closed event received.');
      this.window = null;
    });

    return this.window;
  }

  public showHUD(): void {
    if (!this.window || this.window.isDestroyed() || this.window.webContents?.isCrashed()) {
      logInfo('[HUD] showHUD called but window is null, destroyed, or crashed. Re-creating window.');
      if (this.window && !this.window.isDestroyed()) {
        try { this.window.destroy(); } catch {}
      }
      this.window = null;
      this.createWindow();
      return;
    }
    if (process.platform === 'darwin') {
      this.window.setAlwaysOnTop(true, 'screen-saver', 1);
    } else {
      this.window.setAlwaysOnTop(true, 'screen-saver');
    }
    this.window.show();
    this.window.moveTop();
    this.state.isVisible = true;
    try {
      this.window.setContentProtection(true);
      this.state.isContentProtected = true;
    } catch (err) {
      logError('[HUD] Failed to re-assert content protection on showHUD:', err);
    }
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
        const cursorPoint = screen.getCursorScreenPoint();
        const activeDisplay = screen.getDisplayNearestPoint(cursorPoint);
        const allDisplays = screen.getAllDisplays();
        const activeIndex = allDisplays.findIndex((d) => d.id === activeDisplay.id);

        const captureWidth = Math.min(1920, activeDisplay.bounds.width || 1920);
        const captureHeight = Math.min(1080, activeDisplay.bounds.height || 1080);

        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: captureWidth, height: captureHeight },
        });

        if (sources.length === 0) {
          throw new Error('No screen sources available for silent capture');
        }

        // Target the display where the candidate is actively working
        let selectedSource = sources[0];
        if (activeIndex >= 0 && sources[activeIndex]) {
          selectedSource = sources[activeIndex];
        }

        if (selectedSource.thumbnail.isEmpty()) {
          logWarn('[HUD] Screen capture thumbnail was empty, searching fallback screen');
          for (const s of sources) {
            if (!s.thumbnail.isEmpty()) {
              selectedSource = s;
              break;
            }
          }
        }

        // High-quality JPEG drastically reduces Groq base64 token footprint and prevents 429 rate limit
        const jpegBuffer = selectedSource.thumbnail.toJPEG(85);
        if (jpegBuffer && jpegBuffer.length > 0) {
          return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`;
        }

        return selectedSource.thumbnail.toDataURL();
      } catch (err: any) {
        logError('Silent screen capture error:', err);
        throw err;
      }
    });
  }
}
