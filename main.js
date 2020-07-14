const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  shell,
} = require('electron');

let win = null;

function onAppReady() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    // width: 700,
    // height: 400,
    // show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  //  win.loadURL(`file://${__dirname}/index.html`);
  win.loadFile('index.html');
  win.once('closed', () => {
    win = null;
  });
  // win.on('blur', () => {
  //   console.log('blurred');
  //   win.hide();
  // });
  globalShortcut.register('CommandOrControl+Alt+P', () => {
    // for some reason the user can zoom out but not in so for now we'll reinitialize this every time they invoke the popup
    win.webContents.setZoomFactor(1);
    win.show();
  });
  ipcMain.on('dismiss', () => {
    app.hide();
  });
  win.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });
  win.once('ready-to-show', () => {
    win.webContents.setZoomFactor(1);
    win.show();
  });
  win.webContents.openDevTools();
}
app.allowRendererProcessReuse = false;
app.once('ready', onAppReady);
app.once('window-all-closed', () => {
  app.quit();
});
app.dock.hide();
