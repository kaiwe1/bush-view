import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SummonerInfo, MatchInfo, Game } from '../../shared/types';
import {
  getProfileIconUrl,
  getPlatformName,
  formatDuration,
  formatGameMode,
  findPlayerParticipant,
  type KdaStats,
  type ChampionUsage,
} from '../utils';

interface MatchResultsProps {
  summoner: SummonerInfo;
  platformId: string | null;
  matches: MatchInfo | null;
  kdaStats: KdaStats | null;
  championUsage: ChampionUsage[];
  recentGames: Game[];
}

export function MatchResults({
  summoner,
  platformId,
  matches,
  kdaStats,
  championUsage,
  recentGames,
}: MatchResultsProps) {
  return (
    <div className="space-y-6">
      {/* Summoner Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <img
            src={getProfileIconUrl(summoner.profileIconId)}
            alt="头像"
            className="w-20 h-20 rounded-full border-2 border-amber-400"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-2xl">
              {summoner.gameName}
              <span className="text-muted-foreground font-normal">
                #{summoner.tagLine}
              </span>
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">Lv.{summoner.summonerLevel}</Badge>
              {platformId && <Badge>{getPlatformName(platformId)}</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            召唤师 ID: {summoner.summonerId}
          </p>
        </CardContent>
      </Card>

      {/* KDA */}
      {kdaStats && (
        <Card>
          <CardHeader>
            <CardTitle>近期 KDA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">击杀</p>
                <p className="text-xl font-bold tabular-nums">{kdaStats.kills}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">死亡</p>
                <p className="text-xl font-bold text-red-500 tabular-nums">
                  {kdaStats.deaths}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">助攻</p>
                <p className="text-xl font-bold tabular-nums">{kdaStats.assists}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">KDA</p>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    parseFloat(kdaStats.kda) >= 3
                      ? 'text-green-500'
                      : parseFloat(kdaStats.kda) >= 2
                        ? 'text-amber-500'
                        : 'text-red-500'
                  }`}
                >
                  {kdaStats.kda}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              统计范围：最近 {matches?.games?.gameCount ?? kdaStats.games} 场（成功匹配 {kdaStats.games} 场）
            </p>
          </CardContent>
        </Card>
      )}

      {/* Champion Usage */}
      {championUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>常用英雄</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {championUsage.slice(0, 8).map((champ) => (
                <div
                  key={champ.championId}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50"
                >
                  <img
                    src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.championId}.png`}
                    alt={`英雄 ${champ.championId}`}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">英雄 #{champ.championId}</p>
                    <p className="text-xs text-muted-foreground">
                      {champ.count} 场 | 胜率{' '}
                      {((champ.winCount / champ.totalGames) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近 {recentGames.length} 场游戏</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">结果</TableHead>
                  <TableHead>模式</TableHead>
                  <TableHead>K / D / A</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead className="text-right">版本</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentGames.map((game) => {
                  const participant = summoner?.puuid
                    ? findPlayerParticipant(game, summoner.puuid)
                    : null;
                  const win = participant?.stats.win;
                  return (
                    <TableRow key={game.gameId}>
                      <TableCell>
                        <Badge variant={win ? 'default' : 'destructive'}>
                          {win ? '胜利' : '失败'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatGameMode(game)}</TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {participant ? (
                          <>
                            <span>{participant.stats.kills}</span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-red-500">
                              {participant.stats.deaths}
                            </span>
                            <span className="text-muted-foreground"> / </span>
                            <span>{participant.stats.assists}</span>
                          </>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDuration(game.gameDuration)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {game.gameVersion}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
