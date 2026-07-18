import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

interface SearchFormProps {
  query: string;
  loading: boolean;
  error: string | null;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
}

export function SearchForm({
  query,
  loading,
  error,
  onQueryChange,
  onSearch,
}: SearchFormProps) {
  const isSearchDisabled = loading || query.trim().length === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSearchDisabled) {
      onSearch(query);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center pb-24">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-7 space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">战绩查询</h1>
          <p className="text-sm text-muted-foreground">
            输入 Riot ID，查看近20场对局表现
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex h-14 items-center gap-2 rounded-full border bg-background px-4 shadow-sm transition-shadow focus-within:shadow-md"
        >
          <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="游戏ID#标签"
              className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={isSearchDisabled}
            aria-label="搜索"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        {error && (
          <div className="mx-auto mt-3 max-w-xl rounded-md bg-destructive/10 px-4 py-2 text-left text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
