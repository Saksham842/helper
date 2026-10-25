import { contextBridge, ipcRenderer } from 'electron';
import type { HUDState } from '@parakeet/shared';

export interface ElectronAPI {
  onAuthTokenReceived: (callback: (payload: { token: string; userId?: string; email?: string }) => void) => () => void;
  getAppVersion: () => Promise<string>;
  getUserDataPath: () => Promise<string>;
  getHUDState: () => Promise<HUDState>;
  toggleHUDVisibility: () => Promise<HUDState>;
  setHUDClickThrough: (enabled: boolean) => Promise<HUDState>;
  toggleHUDClickThrough: () => Promise<HUDState>;
  setHUDOpacity: (level: number) => Promise<HUDState>;
  adjustHUDOpacity: (delta: number) => Promise<HUDState>;
  setDynamicIgnoreMouse: (ignore: boolean) => void;
  onHUDStateChange: (callback: (state: HUDState) => void) => () => void;
  onHotkeyPressed: (callback: (action: string) => void) => () => void;
  captureSilentScreenshot: () => Promise<string>;
}

const api: ElectronAPI = {
  onAuthTokenReceived: (callback) => {
    const subscription = (_event: any, payload: any) => callback(payload);
    ipcRenderer.on('auth:token-received', subscription);
    return () => {
      ipcRenderer.removeListener('auth:token-received', subscription);
    };
  },
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getUserDataPath: () => ipcRenderer.invoke('app:get-user-data-path'),
  getHUDState: () => ipcRenderer.invoke('hud:get-state'),
  toggleHUDVisibility: () => ipcRenderer.invoke('hud:toggle-visibility'),
  setHUDClickThrough: (enabled: boolean) => ipcRenderer.invoke('hud:set-click-through', enabled),
  toggleHUDClickThrough: () => ipcRenderer.invoke('hud:toggle-click-through'),
  setHUDOpacity: (level: number) => ipcRenderer.invoke('hud:set-opacity', level),
  adjustHUDOpacity: (delta: number) => ipcRenderer.invoke('hud:adjust-opacity', delta),
  setDynamicIgnoreMouse: (ignore: boolean) => ipcRenderer.send('hud:set-dynamic-ignore-mouse', ignore),
  onHUDStateChange: (callback) => {
    const subscription = (_event: any, state: HUDState) => callback(state);
    ipcRenderer.on('hud:state-changed', subscription);
    return () => {
      ipcRenderer.removeListener('hud:state-changed', subscription);
    };
  },
  onHotkeyPressed: (callback) => {
    const subscription = (_event: any, action: string) => callback(action);
    ipcRenderer.on('hotkey:action', subscription);
    return () => {
      ipcRenderer.removeListener('hotkey:action', subscription);
    };
  },
  captureSilentScreenshot: () => ipcRenderer.invoke('screen:capture-silent'),
};

contextBridge.exposeInMainWorld('electronAPI', api);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
