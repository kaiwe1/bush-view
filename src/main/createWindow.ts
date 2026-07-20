import { BrowserWindow } from 'electron';
import path from 'node:path';

export const appIcon = path.join(__dirname, '../../assets/icon.png');

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  return mainWindow;
}
