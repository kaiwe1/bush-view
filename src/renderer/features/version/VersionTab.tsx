import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import type {
  OpggChampionPositionKey,
  OpggChampionStats,
  OpggChampionTierRow,
} from '../../../shared/types';

export function VersionTab() {
  const [data, setData] = useState<OpggChampionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePositionKey, setActivePositionKey] = useState<OpggChampionPositionKey>('top');

  const loadStats = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.getOpggChampionStats(forceRefresh);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取 OP.GG 数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const activePosition =
    data?.positions.find((position) => position.key === activePositionKey) ?? data?.positions[0];
  const champions = activePosition?.champions ?? [];
  const displayedLastUpdated = activePosition?.lastUpdated ?? data?.lastUpdated;
  const displayedSamples = activePosition?.totalSamples ?? data?.totalSamples;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <CardTitle>版本数据</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{data?.region ?? '全球'}</Badge>
            <Badge variant="secondary">{data?.tier ?? '翡翠+'}</Badge>
            <Badge variant="secondary">{data?.queueType ?? '单双排'}</Badge>
            {data?.patch && <Badge variant="outline">版本 {data.patch}</Badge>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>来源：OP.GG</span>
            {displayedLastUpdated && <span>更新时间：{displayedLastUpdated}</span>}
            {displayedSamples && <span>样本：{formatNumber(displayedSamples)} 场</span>}
            {data?.fetchedAt && <span>获取：{formatFetchedAt(data.fetchedAt)}</span>}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadStats(true)}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          刷新
        </Button>
      </CardHeader>

      <CardContent>
        {loading && !data && <LoadingState />}
        {!loading && error && !data && <ErrorState error={error} onRetry={() => void loadStats(true)} />}
        {!loading && !error && data && champions.length === 0 && <EmptyState />}
        {data && data.positions.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {data.positions.map((position) => (
              <Button
                key={position.key}
                variant={position.key === activePositionKey ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setActivePositionKey(position.key)}
              >
                {position.name}
              </Button>
            ))}
          </div>
        )}
        {data && champions.length > 0 && (
          <Table className="min-w-[1060px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead className="min-w-[190px]">英雄</TableHead>
                <TableHead className="w-24">位置</TableHead>
                <TableHead className="w-20">强度</TableHead>
                <TableHead className="w-24">胜率</TableHead>
                <TableHead className="w-24">登场率</TableHead>
                <TableHead className="w-24">禁用率</TableHead>
                <TableHead className="min-w-[220px]">劣势对位</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {champions.map((champion) => (
                <TableRow key={`${champion.rank}-${champion.championName}-${champion.position ?? 'all'}`}>
                  {/* 排名 */}
                  <TableCell className="font-medium text-muted-foreground">{champion.rank}</TableCell>
                  {/* 英雄头像与名称 */}
                  <TableCell>
                    <div className="flex min-w-[160px] items-center gap-3">
                      {champion.imageUrl ? (
                        <img
                          src={champion.imageUrl}
                          alt={champion.championName}
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                          <Database className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{champion.championName}</span>
                    </div>
                  </TableCell>
                  {/* 位置 */}
                  <TableCell>{champion.position ?? '-'}</TableCell>
                  <TableCell>{champion.tier ?? '-'}</TableCell>
                  <TableCell>{formatPercent(champion.winRate)}</TableCell>
                  <TableCell>{formatPercent(champion.pickRate)}</TableCell>
                  <TableCell>{formatPercent(champion.banRate)}</TableCell>
                  <TableCell>
                    <WeakAgainstList champion={champion} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {error && data && (
          <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>刷新失败：{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeakAgainstList({ champion }: { champion: OpggChampionTierRow }) {
  if (champion.weakAgainst.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex min-w-[190px] flex-wrap gap-2">
      {champion.weakAgainst.map((counter) => (
        <div
          key={`${champion.championName}-${counter.championName}`}
          className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
          title={
            counter.winRateAgainst === undefined
              ? counter.championName
              : `${counter.championName} · ${formatPercent(counter.winRateAgainst)}`
          }
        >
          {counter.imageUrl && (
            <img
              src={counter.imageUrl}
              alt={counter.championName}
              className="h-5 w-5 rounded object-cover"
            />
          )}
          <span className="max-w-[76px] truncate">{counter.championName}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <RefreshCw className="h-8 w-8 animate-spin opacity-50" />
      <span>正在获取 OP.GG 版本数据...</span>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div>
        <p className="font-medium">获取 OP.GG 数据失败</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw />
        重试
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Database className="h-8 w-8 opacity-50" />
      <span>暂无版本数据</span>
    </div>
  );
}

function formatPercent(value?: number): string {
  if (value === undefined) return '-';
  return `${value.toFixed(2)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatFetchedAt(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}
