import { app, BrowserWindow, Menu } from 'electron';
import started from 'electron-squirrel-startup';

import { appIcon, createMainWindow } from './createWindow';
import { registerIpcHandlers } from './ipc';
import {
  registerCachedCdragonRequestHandler,
  registerCachedCdragonSchemePrivileges,
} from './protocols/cachedCdragon';

// 声明 cached-cdragon:// 协议，以便在渲染进程中使用。
registerCachedCdragonSchemePrivileges();

// 主进程注册方法。
registerIpcHandlers();

// 处理 Windows Squirrel 安装、更新和卸载事件。
if (started) {
  app.quit();
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock?.setIcon(appIcon);
  }

  // 在打包后的应用中，禁用默认菜单栏。
  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }

  registerCachedCdragonRequestHandler();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
