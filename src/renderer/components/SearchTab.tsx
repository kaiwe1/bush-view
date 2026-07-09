import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMatchSummary } from '../hooks/useMatchSummary';
import { useSummonerSearch } from '../hooks/useSummonerSearch';
import { MatchResults } from './MatchResults';
import { SearchForm } from './SearchForm';
import { useAppStore } from '../store/useAppStore';

export function SearchTab() {
  const triggerSearch = useAppStore((s) => s.triggerSearch);
  const {
    query,
    setQuery,
    loading,
    error,
    search,
    clear,
    summoner,
    platformId,
    matches,
    rankedStats,
  } = useSummonerSearch();
  const { kdaStats, radarStats, championUsage, recentGames } = useMatchSummary(
    matches?.games.games,
    summoner?.puuid,
  );

  const handlePlayerClick = (gameName: string, tagLine: string) => {
    triggerSearch(gameName, tagLine);
  };

  if (summoner) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={clear}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          返回搜索
        </Button>
        <MatchResults
          summoner={summoner}
          platformId={platformId}
          matches={matches}
          kdaStats={kdaStats}
          radarStats={radarStats}
          championUsage={championUsage}
          recentGames={recentGames}
          rankedStats={rankedStats}
          onPlayerClick={handlePlayerClick}
        />
      </div>
    );
  }

  return (
    <SearchForm
      query={query}
      loading={loading}
      error={error}
      onQueryChange={setQuery}
      onSearch={search}
    />
  );
}
