import { useState, useEffect, useCallback } from 'react';
import { fetchLiveMatches, type MatchInfo } from '@/services/cricketApi';
import MatchCard from '@/components/MatchCard';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { Activity, LayoutGrid, Table as TableIcon, Search } from 'lucide-react';
import { useSeo } from '@/hooks/use-seo';

const LiveScore = () => {
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [scope, setScope] = useState<'all' | 'indian' | 'worldwide'>('indian');
  useSeo({
    title: 'Live Cricket Scores | CricLive',
    description: 'Live cricket scores, IPL updates, match status, scorecards, and quick filters.',
    canonicalPath: '/',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveMatches(scope);
      setMatches(data);
    } catch {
      setError('Failed to fetch live scores. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [load]);

  if (loading && matches.length === 0) return <Loader text="Fetching live scores..." />;
  if (error && matches.length === 0) return <ErrorState message={error} onRetry={load} />;

  const q = query.trim().toLowerCase();
  const filteredMatches =
    q.length === 0
      ? matches
      : matches.filter(m => {
          const haystack = [
            m.name,
            m.matchType,
            m.status,
            m.venue,
            ...(m.teams || []),
            ...(m.teamInfo?.map(t => `${t.name} ${t.shortname}`) || []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Live Scores</h1>
          {loading && <span className="text-xs text-muted-foreground">(updating...)</span>}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <select
            value={scope}
            onChange={e => setScope(e.target.value as 'all' | 'indian' | 'worldwide')}
            className="h-10 rounded-lg border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
            aria-label="Region filter"
          >
            <option value="indian">Indian + IPL</option>
            <option value="all">All Matches</option>
            <option value="worldwide">Worldwide</option>
          </select>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search team, match, venue..."
              className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40"
              aria-label="Search live matches"
            />
          </div>

          <div className="flex items-center rounded-lg border bg-card p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${
                view === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${
                view === 'table'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              aria-label="Table view"
              aria-pressed={view === 'table'}
              title="Table view"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {matches.length === 0 ? 'No live matches for selected filter' : 'No matches found for your search'}
          </p>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMatches.map(m => (
                <MatchCard key={m.id} match={m} variant="live" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-secondary/40 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map(m => {
                    const score1 = m.score?.find(s => s.inning?.includes(m.teams?.[0]));
                    const score2 = m.score?.find(s => s.inning?.includes(m.teams?.[1]));
                    const scoreText = [score1, score2]
                      .filter(Boolean)
                      .map(s => `${s!.r}/${s!.w} (${s!.o} ov)`)
                      .join(' • ');

                    return (
                      <tr key={m.id} className="border-b last:border-b-0 hover:bg-secondary/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{m.teams?.join(' vs ') || m.name}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{m.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {m.matchType?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {scoreText || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cricket-live">
                              <span className="live-pulse inline-block h-2 w-2 rounded-full bg-cricket-live" />
                              LIVE
                            </span>
                            <span className="truncate text-xs font-medium text-primary">{m.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.venue || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LiveScore;
