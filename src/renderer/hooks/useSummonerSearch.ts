import { useCallback, useEffect, useRef, useState } from 'react';
import type { MatchInfo, RankedStats, SummonerInfo } from '../../shared/types';
import type { PlatformId } from '../../shared/platforms';
import { enrichRecentMatchHistory } from '../matchData';
import { useAppStore } from '../store/useAppStore';
import { parseRiotId } from '../utils';

interface SummonerSearchResult {
  summoner: SummonerInfo | null;
  platformId: PlatformId | null;
  matches: MatchInfo | null;
  rankedStats: RankedStats | null;
}

const EMPTY_RESULT: SummonerSearchResult = {
  summoner: null,
  platformId: null,
  matches: null,
  rankedStats: null,
};

export function useSummonerSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummonerSearchResult>(EMPTY_RESULT);
  const [error, setError] = useState<string | null>(null);

  const searchTarget = useAppStore((s) => s.searchTarget);
  const lastTimestamp = useRef(0);
  const requestIdRef = useRef(0);

  // 清空搜索结果和状态
  const clear = useCallback(() => {
    requestIdRef.current += 1;
    setResult(EMPTY_RESULT);
    setError(null);
    setQuery('');
    setLoading(false);
  }, []);

  // 搜索召唤师信息
  const search = useCallback(async (name: string) => {
    const riotId = parseRiotId(name);
    if (!riotId) {
      setError('请输入正确的 Riot ID 格式（如 游戏ID#000）');
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setResult(EMPTY_RESULT);

    try {
      const aliasData = await window.electronAPI.lookupAlias(riotId.gameName, riotId.tagLine);
      if (requestIdRef.current !== requestId) return;

      if ('error' in aliasData) {
        setError(aliasData.error);
        return;
      }

      const [summonerData, matchData, rankedData] = await Promise.all([
        window.electronAPI.getSummonerByPuuid(aliasData.puuid),
        window.electronAPI.getMatchHistoryByPuuid(aliasData.puuid),
        window.electronAPI.getRankedStats(aliasData.puuid),
      ]);
      if (requestIdRef.current !== requestId) return;

      if ('error' in summonerData) {
        setError(summonerData.error);
        return;
      }

      const nextResult: SummonerSearchResult = {
        summoner: summonerData,
        platformId: null,
        matches: null,
        rankedStats: rankedData && !('error' in rankedData) ? rankedData : null,
      };

      if (matchData && !('error' in matchData)) {
        const enrichedMatches = await enrichRecentMatchHistory(matchData);
        if (requestIdRef.current !== requestId) return;
        nextResult.matches = enrichedMatches;
        nextResult.platformId = matchData.platformId;
      }

      setResult(nextResult);
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : '搜索失败');
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  // 监听来自全局 store 的搜索目标变化，如果有新的搜索目标且时间戳不同于上次搜索，则触发搜索
  useEffect(() => {
    if (searchTarget && searchTarget.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = searchTarget.timestamp;
      const name = `${searchTarget.gameName}#${searchTarget.tagLine}`;
      setQuery(name);
      search(name);
    }
  }, [searchTarget, search]);

  return {
    query,
    setQuery,
    loading,
    error,
    search,
    clear,
    ...result,
  };
}
