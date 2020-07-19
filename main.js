const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  shell,
  Menu,
} = require('electron');
const { createMenu } = require('./src/menu');
const { setupConfigDir } = require('./src/storage');

let win = null;

menu = createMenu();
Menu.setApplicationMenu(menu);
// need to use the menu for this. See https://github.com/electron/electron/issues/2640
const hideWindow = () => Menu.sendActionToFirstResponder('hide:');

let hasFocus = true;

setupConfigDir();

function onAppReady() {
  win = new BrowserWindow({
    width: 700,
    height: 400,
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
  globalShortcut.register('Shift+Tab', () => {
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
    win.show();
  });
}
app.allowRendererProcessReuse = false;
app.once('ready', onAppReady);
app.once('window-all-closed', () => {
  app.quit();
});
app.dock.hide();
