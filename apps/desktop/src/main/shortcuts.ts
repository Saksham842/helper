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

  // 5. Cmd/Ctrl + Shift + L (launch/toggle Live Copilot Mode)
  registerSafe('CommandOrControl+Shift+L', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'toggle_live_copilot');
    }
  });

  // 6. Cmd/Ctrl + Enter (manual trigger question answer)
  registerSafe('CommandOrControl+Return', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'manual_ask');
    }
  });

  // 7. Dedicated Vertical Content Scrolling (Ctrl/Cmd + Up / Down & PageUp / PageDown)
  registerSafe('CommandOrControl+Up', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'scroll_up');
    }
  });

  registerSafe('PageUp', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'scroll_up');
    }
  });

  registerSafe('CommandOrControl+Down', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'scroll_down');
    }
  });

  registerSafe('PageDown', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'scroll_down');
    }
  });

  // 8. Cmd/Ctrl + Shift + X (Clear live chat timeline and reset rolling memory)
  registerSafe('CommandOrControl+Shift+X', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'clear_chat');
    }
  });

  // 9. Cmd/Ctrl + Shift + F (Follow-up code context bridge into Live Copilot)
  registerSafe('CommandOrControl+Shift+F', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'followup_bridge');
    }
  });

  // 10. Dedicated HUD Opacity Adjustment (Ctrl/Cmd + Shift + Up / Down in 10% steps)
  registerSafe('CommandOrControl+Shift+Up', () => {
    hudManager.adjustOpacity(0.1);
  });

  registerSafe('CommandOrControl+Shift+Down', () => {
    hudManager.adjustOpacity(-0.1);
  });

  // Unregister all global shortcuts cleanly on application quit
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
