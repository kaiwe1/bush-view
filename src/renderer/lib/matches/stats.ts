import type { Game } from '../../../shared/types';
import { findPlayerParticipant } from './participants';

export interface KdaStats {
  kills: number;
  deaths: number;
  assists: number;
  kda: string;
  games: number;
  wins: number;
  winRate: string;
}

export interface RadarStats {
  kda: number;
  dpm: number;
  gpm: number;
  vspm: number;
  kp: number;
  dtpm: number;
}

export const RADAR_CAPS: Record<keyof RadarStats, number> = {
  kda: 6,
  dpm: 1000,
  gpm: 500,
  vspm: 2.5,
  kp: 100,
  dtpm: 1500,
};

export interface ChampionUsage {
  championId: number;
  count: number;
  winCount: number;
  totalGames: number;
}

export function calculateRadarStats(games: Game[], puuid: string): RadarStats | null {
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDamage = 0;
  let totalGold = 0;
  let totalVision = 0;
  let totalTeamKills = 0;
  let totalDamageTaken = 0;
  let totalDuration = 0;
  let gameCount = 0;

  for (const game of games) {
    const p = findPlayerParticipant(game, puuid);
    if (!p) continue;

    const durationMin = game.gameDuration / 60;

    totalKills += p.stats.kills;
    totalDeaths += p.stats.deaths;
    totalAssists += p.stats.assists;
    totalDamage += p.stats.totalDamageDealtToChampions;
    totalGold += p.stats.goldEarned;
    totalVision += p.stats.visionScore;
    totalDamageTaken += p.stats.totalDamageTaken;
    totalDuration += durationMin;

    const teamKills = game.participants
      .filter((pp) => pp.teamId === p.teamId)
      .reduce((sum, pp) => sum + pp.stats.kills, 0);
    totalTeamKills += teamKills;

    gameCount++;
  }

  if (gameCount === 0) return null;

  const kda = totalDeaths === 0
    ? totalKills + totalAssists
    : (totalKills + totalAssists) / totalDeaths;

  return {
    kda,
    dpm: totalDamage / totalDuration,
    gpm: totalGold / totalDuration,
    vspm: totalVision / totalDuration,
    kp: totalTeamKills === 0 ? 0 : ((totalKills + totalAssists) / totalTeamKills) * 100,
    dtpm: totalDamageTaken / totalDuration,
  };
}

export function calculateKDA(games: Game[], puuid: string): KdaStats {
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let wins = 0;
  let gameCount = 0;

  for (const game of games) {
    const p = findPlayerParticipant(game, puuid);
    if (p) {
      kills += p.stats.kills;
      deaths += p.stats.deaths;
      assists += p.stats.assists;
      if (p.stats.win) wins++;
      gameCount++;
    }
  }

  const kda =
    deaths === 0
      ? (kills + assists).toString()
      : ((kills + assists) / deaths).toFixed(2);

  const winRate = gameCount === 0 ? '0' : ((wins / gameCount) * 100).toFixed(0);

  return { kills, deaths, assists, kda, games: gameCount, wins, winRate };
}

export function getChampionUsage(games: Game[], puuid: string): ChampionUsage[] {
  const map = new Map<number, { count: number; winCount: number }>();

  for (const game of games) {
    const p = findPlayerParticipant(game, puuid);
    if (!p) continue;

    const entry = map.get(p.championId) || { count: 0, winCount: 0 };
    entry.count++;
    if (p.stats.win) entry.winCount++;
    map.set(p.championId, entry);
  }

  return Array.from(map.entries())
    .map(([championId, data]) => ({
      championId,
      count: data.count,
      winCount: data.winCount,
      totalGames: data.count,
    }))
    .sort((a, b) => b.count - a.count);
}
