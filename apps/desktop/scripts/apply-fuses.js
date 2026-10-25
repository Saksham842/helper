/**
 * Electron Fuse Hardening Hook — applied by electron-builder afterPack
 *
 * Fuses applied:
 *   - RunAsNode: false           — prevents `ELECTRON_RUN_AS_NODE=1` abuse
 *   - EnableNodeCliInspectArguments: false — disables --inspect debugging of packed binary
 *   - OnlyLoadAppFromAsar: true  — enforces ASAR-only app loading (tamper protection)
 */
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');
const path = require('path');

exports.default = async function afterPack(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  const productName = packager.appInfo.productName;

  let executableName;
  if (electronPlatformName === 'win32') {
    executableName = `${productName}.exe`;
  } else if (electronPlatformName === 'darwin') {
    executableName = `${productName}.app`;
  } else {
    executableName = productName;
  }

  const executablePath = path.join(appOutDir, executableName);

  console.log(`[Fuses] Applying Electron security fuses to: ${executablePath}`);

  await flipFuses(executablePath, {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
  });

  console.log('[Fuses] ✓ RunAsNode=false');
  console.log('[Fuses] ✓ EnableNodeCliInspectArguments=false');
  console.log('[Fuses] ✓ OnlyLoadAppFromAsar=true');
  console.log('[Fuses] All security fuses applied successfully.');
};
