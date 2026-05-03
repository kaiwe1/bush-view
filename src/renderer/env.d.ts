import type { SummonerInfo, MatchInfo, AliasLookup, RankedStats } from '../shared/types';

declare global {
  interface Window {
    electronAPI: {
      getCurrentSummoner: () => Promise<SummonerInfo | { error: string }>;
      getCurrentSummonerMatchHistory: () => Promise<MatchInfo | { error: string }>;
      getLoginSession: () => Promise<{ idToken: string } | { error: string }>;
      lookupAlias: (gameName: string, tagLine: string) => Promise<AliasLookup | { error: string }>;
      getSummonerByPuuid: (puuid: string) => Promise<SummonerInfo | { error: string }>;
      getMatchHistoryByPuuid: (puuid: string) => Promise<MatchInfo | { error: string }>;
      getGameById: (gameId: number) => Promise<import('../../shared/types').Game | { error: string }>;
      getRankedStats: (puuid: string) => Promise<RankedStats | { error: string }>;
    };
  }
}
