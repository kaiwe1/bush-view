import type { SummonerInfo, MatchInfo, AliasLookup } from '../shared/types';

declare global {
  interface Window {
    electronAPI: {
      getCurrentSummoner: () => Promise<SummonerInfo | { error: string }>;
      getMatchHistory: () => Promise<MatchInfo | { error: string }>;
      getLoginSession: () => Promise<{ idToken: string } | { error: string }>;
      lookupAlias: (gameName: string, tagLine: string) => Promise<AliasLookup | { error: string }>;
      getSummonerByPuuid: (puuid: string) => Promise<SummonerInfo | { error: string }>;
      getMatchHistoryByPuuid: (puuid: string) => Promise<MatchInfo | { error: string }>;
    };
  }
}
