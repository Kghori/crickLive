import { useState, useEffect, useCallback } from 'react';
import { fetchUpcomingMatches, type MatchInfo } from '@/services/cricketApi';
import MatchCard from '@/components/MatchCard';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { Calendar } from 'lucide-react';
import { useSeo } from '@/hooks/use-seo';

const Upcoming = () => {
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useSeo({
    title: 'Upcoming Cricket Matches | CricLive',
    description: 'Upcoming India and IPL cricket matches with fixtures, venue, and start time.',
    canonicalPath: '/upcoming',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUpcomingMatches('indian');
      setMatches(data);
    } catch {
      setError('Failed to fetch upcoming matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader text="Loading upcoming matches..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Upcoming Matches</h1>
      </div>
      {matches.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-muted-foreground">No upcoming matches found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map(m => (
            <MatchCard key={m.id} match={m} variant="upcoming" />
          ))}
        </div>
      )}
    </div>
  );
};

export default Upcoming;
