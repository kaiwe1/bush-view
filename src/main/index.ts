import { app, BrowserWindow, ipcMain, Menu, protocol } from 'electron';

import path from 'node:path';
import started from 'electron-squirrel-startup';
import { getCurrentSummoner, getCurrentSummonerMatchHistory, getGameById, getLoginSession, lookupAlias, getSummonerByPuuid, getMatchHistoryByPuuid, getRankedStats } from './api/lcu';
import { getOrDownloadImage } from './imageCache';


// IPC handlers
ipcMain.handle('get-current-summoner', async () => {
  try {
    return await getCurrentSummoner();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
});

ipcMain.handle('get-current-summoner-match-history', async () => {
  try {
    return await getCurrentSummonerMatchHistory();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
});

ipcMain.handle('get-game-by-id', async (_event, gameId: number) => {
  try {
    return await getGameById(gameId);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
});

ipcMain.handle('get-login-session', async () => {
  try {
    return await getLoginSession();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
});

ipcMain.handle('lookup-alias', async (_event, gameName: string, tagLine: string) => {
  try {
    return await lookupAlias(gameName, tagLine);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
});

ipcMain.handle('get-summoner-by-puuid', async (_event, puuid: string) => {
  try {
    return await getSummonerByPuuid(puuid);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
});

ipcMain.handle('get-match-history-by-puuid', async (_event, puuid: string) => {
  try {
    return await getMatchHistoryByPuuid(puuid);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
});

ipcMain.handle('get-ranked-stats', async (_event, puuid: string) => {
  try {
    return await getRankedStats(puuid);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
});

// Register custom scheme (must be called before app.ready).
protocol.registerSchemesAsPrivileged([
  { scheme: 'cached-cdragon', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // 如果应用没有被打包（即处于开发环境），则打开 DevTools
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Remove default menu bar in production, keep in dev mode
  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }

  // Register protocol handler (must be after app.ready).
  protocol.handle('cached-cdragon', async (request) => {
    try {
      const { data, mimeType } = await getOrDownloadImage(request.url);
      return new Response(data, {
        status: 200,
        headers: {
          'content-type': mimeType,
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      return new Response('', { status: 404 });
    }
  });

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
