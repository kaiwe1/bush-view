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
import type { SummonerInfo, MatchInfo, Game, RankedStats } from '../../shared/types';
import {
  getProfileIconUrl,
  getPlatformName,
  getChampionIconUrl,
  getSummonerSpellIconUrl,
  getItemIconUrl,
  getPerkStyleIconUrl,
  getPerkIconUrl,
  getGamePlayers,
  formatDuration,
  formatGameMode,
  findPlayerParticipant,
  formatTierDivision,
  formatQueueType,
  getRankEmblemUrl,
  type KdaStats,
  type ChampionUsage,
  type RadarStats,
  type GamePlayer,
} from '../utils';
import { RadarChart } from './RadarChart';

const RANKED_QUEUES = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'] as const;


interface MatchResultsProps {
  summoner: SummonerInfo;
  platformId: string | null;
  matches: MatchInfo | null;
  kdaStats: KdaStats | null;
  radarStats: RadarStats | null;
  championUsage: ChampionUsage[];
  recentGames: Game[];
  rankedStats: RankedStats | null;
}

export function MatchResults({
  summoner,
  platformId,
  matches,
  kdaStats,
  radarStats,
  championUsage,
  recentGames,
  rankedStats,
}: MatchResultsProps) {
  return (
    <div className="space-y-6">
      {/* Summoner Card */}
      <Card>
        <CardContent className="flex items-center gap-6 pt-6">
          {/* 左侧：召唤师基本信息 */}
          <div className="flex items-center gap-4">
            <img
              src={getProfileIconUrl(summoner.profileIconId)}
              alt="头像"
              className="w-20 h-20 rounded-full border-2 border-amber-400 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-semibold tracking-tight">
                {summoner.gameName}
                <span className="text-muted-foreground font-normal">
                  #{summoner.tagLine}
                </span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">Lv.{summoner.summonerLevel}</Badge>
                {platformId && <Badge>{getPlatformName(platformId)}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 max-w-48 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{
                      width: `${(summoner.xpSinceLastLevel / (summoner.xpSinceLastLevel + summoner.xpUntilNextLevel)) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {summoner.xpSinceLastLevel.toLocaleString()} / {(summoner.xpSinceLastLevel + summoner.xpUntilNextLevel).toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>

          {/* 右侧：排位段位 */}
          {rankedStats && (
            <div className="ml-auto flex items-center gap-3">
              {RANKED_QUEUES.map((queue) => {
                const entry = rankedStats.queueMap[queue];
                return (
                  <div
                    key={queue}
                    className="rounded-lg border bg-muted/30 px-4 py-3 min-w-[160px]"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {entry?.tier ? (
                        <img
                          src={getRankEmblemUrl(entry.tier)}
                          alt={entry.tier}
                          className="w-8 h-8"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted" />
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {formatQueueType(queue)}
                        </p>
                        <p className="text-base font-bold">
                          {entry?.tier
                            ? formatTierDivision(entry.tier, entry.division)
                            : '未定级'}
                        </p>
                      </div>
                    </div>
                    {entry?.tier ? (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{entry.leaguePoints} LP</span>
                        <span className="text-green-600">{entry.wins}胜</span>
                        {entry.losses > 0 ? (
                          <>
                            <span className="text-red-500">{entry.losses}负</span>
                            {entry.wins + entry.losses > 0 && (
                              <span>
                                胜率 {((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(0)}%
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-red-500">-</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">暂无数据</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KDA + 六边形雷达图 */}
      {kdaStats && (
        <Card>
          <CardHeader>
            <CardTitle>近期 KDA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 flex-wrap">
              {/* 左侧：数字统计 */}
              <div className="flex items-center gap-6">
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
                    className={`text-2xl font-bold tabular-nums ${parseFloat(kdaStats.kda) >= 3
                        ? 'text-green-500'
                        : parseFloat(kdaStats.kda) >= 2
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }`}
                  >
                    {kdaStats.kda}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">胜率</p>
                  <p
                    className={`text-2xl font-bold tabular-nums ${
                      parseInt(kdaStats.winRate) >= 60
                        ? 'text-green-500'
                        : parseInt(kdaStats.winRate) >= 45
                          ? 'text-amber-500'
                          : 'text-red-500'
                    }`}
                  >
                    {kdaStats.winRate}%
                  </p>
                </div>
              </div>

              {/* 右侧：六边形雷达图 */}
              {radarStats && (
                <div className="ml-auto flex-shrink-0">
                  <RadarChart stats={radarStats} size={240} />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              统计范围：最近 {matches?.games?.gameCount ?? kdaStats.games} 场
            </p>
          </CardContent>
        </Card>
      )}

      {/* 英雄使用情况 */}
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
                    src={getChampionIconUrl(champ.championId)}
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

      {/* 最近游戏 */}
      {recentGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>近期对局</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">结果</TableHead>
                  <TableHead>模式</TableHead>
                  <TableHead className="w-[340px]">战绩详情</TableHead>
                  <TableHead className="w-[280px]">玩家</TableHead>
                  <TableHead>时间</TableHead>
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
                  const stats = participant?.stats;
                  const primaryStyle = stats?.perkPrimaryStyle ?? 0; // 主系符文 ID
                  const subStyle = stats?.perkSubStyle ?? 0; // 副系符文 ID
                  console.log('stats', stats);
                  console.log('participant', participant);
                  return (
                    <TableRow key={game.gameId}>
                      <TableCell>
                        <span className={win ? 'text-blue-500 font-semibold' : 'text-red-500 font-semibold'}>
                          {win ? '胜利' : '失败'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{formatGameMode(game)}</TableCell>
                      <TableCell>
                        {participant && stats ? (
                          <div className="flex items-center gap-2">
                            {/* 英雄头像 */}
                            <img
                              src={getChampionIconUrl(participant.championId)}
                              alt=""
                              className="w-10 h-10 rounded-full flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {/* 召唤师技能 */}
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <img
                                src={getSummonerSpellIconUrl(participant.spell1Id) ?? undefined}
                                alt=""
                                className="w-4 h-4 rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <img
                                src={getSummonerSpellIconUrl(participant.spell2Id) ?? undefined}
                                alt=""
                                className="w-4 h-4 rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            {/* 装备 */}
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <div className="flex gap-0.5">
                                {[stats.item0, stats.item1, stats.item2, stats.item3].map((itemId, i) => {
                                  const url = getItemIconUrl(itemId);
                                  return (
                                    <div key={i} className="w-5 h-5 rounded bg-muted flex-shrink-0">
                                      {url ? (
                                        <img
                                          src={url}
                                          alt=""
                                          className="w-5 h-5 rounded"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-5 h-5 rounded border border-dashed border-muted-foreground/30" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex gap-0.5">
                                {[stats.item4, stats.item5, stats.item6].map((itemId, i) => {
                                  const url = getItemIconUrl(itemId);
                                  return (
                                    <div key={i} className="w-5 h-5 rounded bg-muted flex-shrink-0">
                                      {url ? (
                                        <img
                                          src={url}
                                          alt=""
                                          className="w-5 h-5 rounded"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-5 h-5 rounded border border-dashed border-muted-foreground/30" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {/* 符文 */}
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {(() => {
                                if (primaryStyle === 0 || subStyle === 0) return null;
                                const keystoneUrl = getPerkIconUrl(stats.perk0, primaryStyle);
                                const primaryUrl = getPerkStyleIconUrl(primaryStyle);
                                const subUrl = getPerkStyleIconUrl(subStyle);
                                return (
                                  <>
                                    <img
                                      src={keystoneUrl ?? ''}
                                      alt=""
                                      className="w-5 h-5 rounded-full bg-muted"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                    <img
                                      src={primaryUrl ?? ''}
                                      alt=""
                                      className="w-4 h-4 rounded-full bg-muted"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                    <img
                                      src={subUrl ?? ''}
                                      alt=""
                                      className="w-4 h-4 rounded-full bg-muted"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </>
                                );
                              })()}
                            </div>
                            {/* KDA */}
                            <div className="font-mono text-xs tabular-nums text-center flex-shrink-0 ml-1 leading-tight">
                              <div>
                                <span className="font-semibold">{stats.kills}</span>
                                <span className="text-muted-foreground"> / </span>
                                <span className="text-red-500 font-semibold">{stats.deaths}</span>
                                <span className="text-muted-foreground"> / </span>
                                <span className="font-semibold">{stats.assists}</span>
                              </div>
                              <div className="text-muted-foreground text-[10px]">
                                {stats.deaths === 0
                                  ? 'Perfect'
                                  : ((stats.kills + stats.assists) / stats.deaths).toFixed(1)} KDA
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const players = getGamePlayers(game);
                          const blue = players.filter((p) => p.teamId === 100);
                          const red = players.filter((p) => p.teamId === 200);
                          const renderTeam = (team: GamePlayer[]) => (
                            <div className="flex flex-col gap-0.5">
                              {team.map((p, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <img
                                    src={getChampionIconUrl(p.championId)}
                                    alt=""
                                    className="w-4 h-4 rounded-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <span className="text-xs truncate max-w-[100px]">
                                    {p.gameName}
                                    <span className="text-muted-foreground">#{p.tagLine}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                          return (
                            <div className="flex gap-3">
                              <div>{renderTeam(blue)}</div>
                              <div>{renderTeam(red)}</div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {game.gameCreationDate
                          ? new Date(game.gameCreationDate).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDuration(game.gameDuration)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {game.gameVersion?.split('.').slice(0, 2).join('.')}
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
