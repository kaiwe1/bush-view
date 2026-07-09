import { useMemo } from 'react';
import type { Game, SummonerInfo } from '../../shared/types';
import {
  calculateKDA,
  calculateRadarStats,
  getChampionUsage,
} from '../utils';
import { RECENT_MATCH_LIMIT } from '../matchData';

/**
 * 返回给定比赛列表和召唤师 PUUID 的统计数据，包括 KDA、雷达图数据、英雄使用情况和最近比赛列表。
 */
export function useMatchSummary(games: Game[] | undefined, puuid: SummonerInfo['puuid'] | undefined) {
  const kdaStats = useMemo(() => {
    if (!games || !puuid) return null;
    return calculateKDA(games, puuid);
  }, [games, puuid]);

  const radarStats = useMemo(() => {
    if (!games || !puuid) return null;
    return calculateRadarStats(games, puuid);
  }, [games, puuid]);

  const championUsage = useMemo(() => {
    if (!games || !puuid) return [];
    return getChampionUsage(games, puuid);
  }, [games, puuid]);

  const recentGames = useMemo(() => {
    if (!games) return [];
    return games.slice(0, RECENT_MATCH_LIMIT);
  }, [games]);

  return { kdaStats, radarStats, championUsage, recentGames };
}
