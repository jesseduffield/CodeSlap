const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  shell,
  Menu,
} = require('electron');

let win = null;

// need to use the menu for this. See https://github.com/electron/electron/issues/2640
const menu = Menu.buildFromTemplate([
  {
    label: 'Menu',
    submenu: [
      {
        label: 'Exit',
        click() {
          app.quit();
        },
      },
    ],
  },
]);
Menu.setApplicationMenu(menu);
// Menu.setApplicationMenu(null);
const hideWindow = () => Menu.sendActionToFirstResponder('hide:');

let hasFocus = true;

function onAppReady() {
  win = new BrowserWindow({
    width: 700,
    height: 400,
    // show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    transparent: true,
  });
  win.loadFile('index.html');
  win.once('closed', () => {
    win = null;
  });
  win.on('blur', () => {
    hasFocus = false;
  });
  win.on('focus', () => {
    hasFocus = true;
  });
  // CommandOrControl+Alt+P
  globalShortcut.register('Shift+Tab', () => {
    // for some reason the user can zoom out but not in so for now we'll reinitialize this every time they invoke the popup

    win.webContents.setZoomFactor(1);
    if (hasFocus) {
      hideWindow();
    } else {
      win.show();
    }
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
