const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 460,
    height: 680,
    show: false,
    transparent: true,
    webPreferences: {
      preload: path.resolve(__dirname, '../apps/desktop/dist-electron/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const targetPath = path.resolve(__dirname, '../apps/desktop/dist/index.html');
  console.log('Loading path:', targetPath, 'exists:', fs.existsSync(targetPath));

  await win.loadFile(targetPath);
  await new Promise(r => setTimeout(r, 600));

  const metrics = await win.webContents.executeJavaScript(`
    (() => {
      const root = document.getElementById('root');
      return {
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        htmlH: document.documentElement.offsetHeight,
        bodyH: document.body.offsetHeight,
        rootH: root ? root.offsetHeight : null,
        rootChildCount: root ? root.children.length : 0,
        innerHTML: document.body.innerHTML.slice(0, 300)
      };
    })()
  `);

  console.log('RESULT:', JSON.stringify(metrics, null, 2));

  const image = await win.webContents.capturePage();
  const pngPath = path.resolve(__dirname, 'rendered_test.png');
  fs.writeFileSync(pngPath, image.toPNG());
  console.log('Image size:', image.getSize(), 'Bytes:', image.toPNG().length);

  app.quit();
});
