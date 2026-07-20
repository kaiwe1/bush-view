// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipcChannels';

// 向渲染进程暴露一个名为 electronAPI 的全局对象，提供与主进程通信的接口。
contextBridge.exposeInMainWorld('electronAPI', {
  getCurrentSummoner: () => ipcRenderer.invoke(IPC_CHANNELS.getCurrentSummoner),
  getCurrentSummonerMatchHistory: () =>
    ipcRenderer.invoke(IPC_CHANNELS.getCurrentSummonerMatchHistory),
  getLoginSession: () => ipcRenderer.invoke(IPC_CHANNELS.getLoginSession),
  lookupAlias: (gameName: string, tagLine: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.lookupAlias, gameName, tagLine),
  getSummonerByPuuid: (puuid: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.getSummonerByPuuid, puuid),
  getMatchHistoryByPuuid: (puuid: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.getMatchHistoryByPuuid, puuid),
  getGameById: (gameId: number) => ipcRenderer.invoke(IPC_CHANNELS.getGameById, gameId),
  getRankedStats: (puuid: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.getRankedStats, puuid),
  getOpggChampionStats: (forceRefresh?: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.getOpggChampionStats, forceRefresh),
});
