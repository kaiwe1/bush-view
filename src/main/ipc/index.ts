import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../shared/ipcChannels';
import {
  getCurrentSummoner,
  getCurrentSummonerMatchHistory,
  getGameById,
  getLoginSession,
  getMatchHistoryByPuuid,
  getRankedStats,
  getSummonerByPuuid,
  lookupAlias,
} from '../api/lcu';
import { getOpggChampionStats } from '../api/opgg';

type IpcError = { error: string };

function getError(error: unknown): IpcError {
  return {
    error: error instanceof Error ? error.message : 'An unknown error occurred',
  };
}

function registerHandler<Args extends unknown[], Result>(
  channel: string,
  handler: (...args: Args) => Promise<Result>,
): void {
  ipcMain.handle(channel, async (_event, ...args: Args) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      return getError(error);
    }
  });
}

export function registerIpcHandlers(): void {
  registerHandler(IPC_CHANNELS.getCurrentSummoner, getCurrentSummoner);
  registerHandler(
    IPC_CHANNELS.getCurrentSummonerMatchHistory,
    getCurrentSummonerMatchHistory,
  );
  registerHandler(IPC_CHANNELS.getGameById, getGameById);
  registerHandler(IPC_CHANNELS.getLoginSession, getLoginSession);
  registerHandler(IPC_CHANNELS.lookupAlias, lookupAlias);
  registerHandler(IPC_CHANNELS.getSummonerByPuuid, getSummonerByPuuid);
  registerHandler(IPC_CHANNELS.getMatchHistoryByPuuid, getMatchHistoryByPuuid);
  registerHandler(IPC_CHANNELS.getRankedStats, getRankedStats);
  registerHandler(
    IPC_CHANNELS.getOpggChampionStats,
    (forceRefresh?: boolean) => getOpggChampionStats(Boolean(forceRefresh)),
  );
}
