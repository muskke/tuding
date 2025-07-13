const { app, BrowserWindow, globalShortcut, clipboard, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: store.get('windowBounds.x', 100),
    y: store.get('windowBounds.y', 100),
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: true,
    skipTaskbar: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('src/index.html');

  // 保存窗口位置
  mainWindow.on('moved', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  mainWindow.on('resized', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  // 创建系统托盘
  createTray();

  // 注册全局快捷键
  registerGlobalShortcuts();
}

function createTray() {
  // 如果图标文件不存在，跳过托盘创建
  const iconPath = path.join(__dirname, '../assets/icon.png');
  try {
    tray = new Tray(iconPath);
  } catch (error) {
    console.log('托盘图标创建失败，将跳过托盘功能:', error.message);
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示图钉',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: '隐藏图钉',
      click: () => {
        mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('图钉 - 桌面画布工具');
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function registerGlobalShortcuts() {
  // 注册Ctrl+Shift+V全局快捷键来粘贴内容
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      
      // 获取剪贴板内容并发送到渲染进程
      const clipboardContent = getClipboardContent();
      mainWindow.webContents.send('paste-content', clipboardContent);
    }
  });

  // 注册Ctrl+Shift+T来显示/隐藏窗口
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function getClipboardContent() {
  const formats = clipboard.availableFormats();
  
  if (formats.includes('image/png') || formats.includes('image/jpeg')) {
    const image = clipboard.readImage();
    return {
      type: 'image',
      data: image.toDataURL()
    };
  } else if (formats.includes('text/html')) {
    return {
      type: 'html',
      data: clipboard.readHTML()
    };
  } else if (formats.includes('text/plain')) {
    return {
      type: 'text',
      data: clipboard.readText()
    };
  }
  
  return {
    type: 'empty',
    data: ''
  };
}

// IPC 通信处理
ipcMain.handle('get-clipboard-content', () => {
  return getClipboardContent();
});

ipcMain.handle('clear-canvas', () => {
  // 清空存储的画布内容
  store.delete('canvasContent');
  return true;
});

ipcMain.handle('save-canvas-content', (event, content) => {
  store.set('canvasContent', content);
  return true;
});

ipcMain.handle('load-canvas-content', () => {
  return store.get('canvasContent', []);
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.hide(); // 隐藏而不是关闭，这样可以通过托盘重新显示
  }
});

ipcMain.handle('quit-app', () => {
  app.quit();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
});