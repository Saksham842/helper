import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  onAuthTokenReceived: (callback: (payload: { token: string; userId?: string; email?: string }) => void) => () => void;
  getAppVersion: () => Promise<string>;
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
};

contextBridge.exposeInMainWorld('electronAPI', api);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
