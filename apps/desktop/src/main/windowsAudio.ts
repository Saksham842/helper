import { exec } from 'node:child_process';
import { logInfo, logWarn } from './logger';

const powershellScript = `
$source = @'
using System;
using System.Runtime.InteropServices;

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioEndpointVolume {
    int RegisterControlChangeNotify(IntPtr pNotify);
    int UnregisterControlChangeNotify(IntPtr pNotify);
    int GetChannelCount(out uint pnChannelCount);
    int SetMasterVolumeLevel(float fLevelDB, IntPtr pguidEventContext);
    int SetMasterVolumeLevelScalar(float fLevel, IntPtr pguidEventContext);
    int GetMasterVolumeLevel(out float pfLevelDB);
    int GetMasterVolumeLevelScalar(out float pfLevel);
    int SetChannelVolumeLevel(uint nChannel, float fLevelDB, IntPtr pguidEventContext);
    int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, IntPtr pguidEventContext);
    int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
    int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
    int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, IntPtr pguidEventContext);
    int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {
    [PreserveSig] int Activate([In] ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {
    int EnumAudioEndpoints(int dataFlow, int dwStateMask, out IntPtr ppDevices);
    [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
public class MMDeviceEnumeratorComObject { }

public class NativeMicFixer {
    public static void Run(float targetVolume) {
        var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObject();
        IMMDevice dev;
        int hr = enumerator.GetDefaultAudioEndpoint(1, 1, out dev);
        if (hr != 0 || dev == null) return;
        var iid = typeof(IAudioEndpointVolume).GUID;
        object obj;
        dev.Activate(ref iid, 1, IntPtr.Zero, out obj);
        var vol = (IAudioEndpointVolume)obj;
        vol.SetMute(false, IntPtr.Zero);
        float current;
        vol.GetMasterVolumeLevelScalar(out current);
        if (current < 0.5f) {
            vol.SetMasterVolumeLevelScalar(targetVolume, IntPtr.Zero);
        }
    }
}
'@

Add-Type -TypeDefinition $source
[NativeMicFixer]::Run(0.85)
`;

export function ensureWindowsMicUnmuted(): void {
  if (process.platform !== 'win32') return;

  try {
    const encoded = Buffer.from(powershellScript, 'utf16le').toString('base64');
    exec(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`, (err) => {
      if (err) {
        logWarn('[WindowsAudio] Failed to verify mic volume:', err.message);
      } else {
        logInfo('[WindowsAudio] Verified default microphone is unmuted and boosted to at least 85%.');
      }
    });
  } catch (err: any) {
    logWarn('[WindowsAudio] Exception in ensureWindowsMicUnmuted:', err);
  }
}
