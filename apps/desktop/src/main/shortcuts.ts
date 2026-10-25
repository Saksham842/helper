import { globalShortcut, app } from 'electron';
import type { HUDWindowManager } from './hud';

export function registerGlobalShortcuts(hudManager: HUDWindowManager): void {
  const registerSafe = (accelerator: string, callback: () => void) => {
    try {
      globalShortcut.register(accelerator, callback);
    } catch (err) {
      console.warn(`[Shortcuts] Failed to register global shortcut ${accelerator}:`, err);
    }
  };

  // 1. Primary: Cmd/Ctrl + \ (toggle HUD)
  registerSafe('CommandOrControl+\\', () => {
    hudManager.toggleVisibility();
  });

  // Alias: Cmd/Ctrl + Shift + V (toggle HUD)
  registerSafe('CommandOrControl+Shift+V', () => {
    hudManager.toggleVisibility();
  });

  // 2. Cmd/Ctrl + Shift + M (toggle mouse capture / click-through mode)
  registerSafe('CommandOrControl+Shift+M', () => {
    hudManager.toggleClickThrough();
  });

  // 3. Cmd/Ctrl + Shift + Q (quick crash-hide panic)
  registerSafe('CommandOrControl+Shift+Q', () => {
    hudManager.hideHUD();
  });

  // 4. Cmd/Ctrl + Shift + H (silent screen capture & vision coding solver)
  registerSafe('CommandOrControl+Shift+H', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'ask_ai');
    }
  });

  // 5. Cmd/Ctrl + Enter (manual trigger question answer)
  registerSafe('CommandOrControl+Return', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'manual_ask');
    }
  });

  // 6. Opacity adjustment shortcuts
  registerSafe('CommandOrControl+Shift+Up', () => {
    hudManager.adjustOpacity(0.1);
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'scroll_up');
    }
  });

  registerSafe('CommandOrControl+Shift+Down', () => {
    hudManager.adjustOpacity(-0.1);
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'scroll_down');
    }
  });

  // 7. Dedicated scrolling shortcuts
  registerSafe('CommandOrControl+Shift+J', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'scroll_down');
    }
  });

  registerSafe('CommandOrControl+Shift+K', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'scroll_up');
    }
  });

  // Unregister all global shortcuts cleanly on application quit
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
