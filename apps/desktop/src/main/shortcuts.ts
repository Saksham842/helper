import { globalShortcut, app } from 'electron';
import type { HUDWindowManager } from './hud';

export function registerGlobalShortcuts(hudManager: HUDWindowManager): void {
  // CommandOrControl+Shift+V: Toggle HUD Visibility without stealing focus
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    hudManager.toggleVisibility();
  });

  // CommandOrControl+Shift+M: Toggle Click-Through Mode
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    hudManager.toggleClickThrough();
  });

  // CommandOrControl+Shift+Up: Increase Opacity
  globalShortcut.register('CommandOrControl+Shift+Up', () => {
    hudManager.adjustOpacity(0.1);
  });

  // CommandOrControl+Shift+Down: Decrease Opacity
  globalShortcut.register('CommandOrControl+Shift+Down', () => {
    hudManager.adjustOpacity(-0.1);
  });

  // CommandOrControl+Shift+H: Trigger Silent Screen Capture / Ask AI
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    const win = hudManager.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('hotkey:action', 'ask_ai');
    }
  });

  // Unregister all global shortcuts cleanly on application quit
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
