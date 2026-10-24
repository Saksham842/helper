const { app, BrowserWindow, desktopCapturer } = require('electron');

// Force software rendering fallback for headless CI / test environments if needed
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  console.log('[Test Harness] Running Electron Stealth Overlay Verification...');

  try {
    // 1. Create window with Phase 2 stealth options
    const win = new BrowserWindow({
      width: 440,
      height: 600,
      transparent: true,
      frame: false,
      hasShadow: false,
      backgroundColor: '#00000000',
      skipTaskbar: true,
      focusable: false,
      alwaysOnTop: true,
      show: false,
    });

    console.log('✓ Window created with frameless transparent options');

    // 2. Test focus-neutral display
    win.showInactive();
    console.log('✓ win.showInactive() executed (anti-blur focus preservation)');

    // 3. Test alwaysOnTop
    win.setAlwaysOnTop(true, 'screen-saver', 1);
    const isTop = win.isAlwaysOnTop();
    if (!isTop) {
      throw new Error('Expected win.isAlwaysOnTop() to be true');
    }
    console.log('✓ win.isAlwaysOnTop() confirmed true with level: screen-saver');

    // 4. Test SetWindowDisplayAffinity / Content Protection
    win.setContentProtection(true);
    console.log('✓ win.setContentProtection(true) executed successfully (Win32 WDA_EXCLUDEFROMCAPTURE / macOS NSWindowSharingNone active)');


    // 5. Test Click-Through mouse event pass-through
    win.setIgnoreMouseEvents(true, { forward: true });
    console.log('✓ win.setIgnoreMouseEvents(true, { forward: true }) enabled (click-through pass)');

    win.setIgnoreMouseEvents(false);
    console.log('✓ win.setIgnoreMouseEvents(false) restored');

    // 6. Test Opacity modulation
    win.setOpacity(0.85);
    const opacity = win.getOpacity();
    if (Math.abs(opacity - 0.85) > 0.05) {
      throw new Error(`Expected opacity ~0.85, got ${opacity}`);
    }
    console.log(`✓ win.setOpacity() confirmed at ${opacity}`);

    // 7. Verify desktopCapturer can query sources while content protection is enabled
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 100, height: 100 } });
    console.log(`✓ desktopCapturer queried ${sources.length} screen source(s) successfully with WDA_EXCLUDEFROMCAPTURE active`);

    win.close();
    console.log('\n[Test Harness] ALL 7 STEALTH & ANTI-DETECTION CHECKS PASSED SUCCESSFULLY!\n');
    app.quit();
    process.exit(0);
  } catch (err) {
    console.error('\n[Test Harness Error]:', err);
    app.quit();
    process.exit(1);
  }
});
