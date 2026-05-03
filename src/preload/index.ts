// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getCurrentSummoner: () => ipcRenderer.invoke('get-current-summoner'),
  getCurrentSummonerMatchHistory: () => ipcRenderer.invoke('get-current-summoner-match-history'),
  getLoginSession: () => ipcRenderer.invoke('get-login-session'),
  lookupAlias: (gameName: string, tagLine: string) =>
    ipcRenderer.invoke('lookup-alias', gameName, tagLine),
  getSummonerByPuuid: (puuid: string) => ipcRenderer.invoke('get-summoner-by-puuid', puuid),
  getMatchHistoryByPuuid: (puuid: string) => ipcRenderer.invoke('get-match-history-by-puuid', puuid),
  getGameById: (gameId: number) => ipcRenderer.invoke('get-game-by-id', gameId),
  getRankedStats: (puuid: string) => ipcRenderer.invoke('get-ranked-stats', puuid),
});
