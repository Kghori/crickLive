import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ScorecardTab from '@/components/ScorecardTab';
import NewsTab from '@/components/NewsTab';
import PointsTableTab from '@/components/PointsTableTab';
import VenueTab from '@/components/VenueTab';
import StatsTab from '@/components/StatsTab';
import {
  fetchLiveMatches,
  fetchUpcomingMatches,
  fetchMatchScorecard,
  fetchSeriesInfo,
  fetchSeriesNews,
  fetchSeriesPointsTable,
  fetchSeriesVenues,
  fetchSeriesStats,
  type MatchInfo,
  type MatchScorecard,
  type NewsItem,
  type PointsTableRow,
  type VenueInfo,
  type StatItem,
} from '@/services/cricketApi';
import { useSeo } from '@/hooks/use-seo';

type TabKey = 'scorecard' | 'news' | 'points' | 'venues' | 'stats';

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('scorecard');

  const [scorecard, setScorecard] = useState<MatchScorecard[] | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [points, setPoints] = useState<PointsTableRow[] | null>(null);
  const [venues, setVenues] = useState<VenueInfo[] | null>(null);
  const [stats, setStats] = useState<StatItem[] | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const tabTitleMap: Record<TabKey, string> = {
    scorecard: 'Scorecard',
    news: 'News',
    points: 'Points Table',
    venues: 'Venues',
    stats: 'Stats',
  };
  useSeo({
    title: `${tabTitleMap[tab]} | ${match?.teams?.join(' vs ') || 'Match'} | CricLive`,
    description: 'Live cricket score, scorecard, points table, venue, and series stats.',
    canonicalPath: `/match/${id || ''}`,
  });

  useEffect(() => {
    let mounted = true;
    const loadMatch = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [live, upcoming] = await Promise.all([fetchLiveMatches('all'), fetchUpcomingMatches('all')]);
        const found = [...live, ...upcoming].find(m => m.id === id) || null;
        if (!mounted) return;
        setMatch(found);
        if (!found) setError('Match not found.');
      } catch {
        if (mounted) setError('Failed to load match details.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadMatch();
    return () => {
      mounted = false;
    };
  }, [id]);

  const seriesId = useMemo(() => match?.seriesId, [match]);

  useEffect(() => {
    let mounted = true;
    const loadTabData = async () => {
      if (!id || !match) return;
      setTabLoading(true);
      try {
        if (tab === 'scorecard' && scorecard === null) {
          const res = await fetchMatchScorecard(id);
          if (mounted) setScorecard(res);
        }

        if (seriesId) {
          // if ((tab === 'news' || tab === 'points' || tab === 'venues' || tab === 'stats') && !seriesName) {
          //   const info = await fetchSeriesInfo(seriesId);
          //   if (mounted) setSeriesName(info?.name || '');
          // }
          if (tab === 'news' && news === null) {
            const res = await fetchSeriesNews(seriesId);
            if (mounted) setNews(res);
          }
          if (tab === 'points' && points === null) {
            const res = await fetchSeriesPointsTable(seriesId);
            if (mounted) setPoints(res);
          }
          // if (tab === 'venues' && venues === null) {
          //   const res = await fetchSeriesVenues(seriesId);
          //   if (mounted) setVenues(res);
          // }
          if (tab === 'stats' && stats === null) {
            const res = await fetchSeriesStats(seriesId);
            if (mounted) setStats(res);
          }
        }
      } finally {
        if (mounted) setTabLoading(false);
      }
    };
    loadTabData();
    return () => {
      mounted = false;
    };
  }, [id, match, tab, seriesId, scorecard, news, points, venues, stats, seriesName]);

  const onShare = async () => {
    const url = window.location.href;
    const title = match?.name || 'Match Details';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fallback below
      }
    }
    await navigator.clipboard.writeText(url);
  };

  if (loading) return <Loader text="Loading match details..." />;
  if (error || !match) return <ErrorState message={error || 'Match not found'} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">{match.teams.join(' vs ')}</h1>
          <p className="text-sm text-muted-foreground">{seriesName || match.name}</p>
          <p className="text-xs text-muted-foreground">{match.venue}</p>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-foreground hover:bg-secondary"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
        <TabsList className="mb-3 h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="points">Points Table</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {tabLoading && <Loader text="Loading tab data..." />}

        <TabsContent value="scorecard">
          <ScorecardTab data={scorecard || []} />
        </TabsContent>
        <TabsContent value="news">
          <NewsTab data={news || []} />
        </TabsContent>
        <TabsContent value="points">
          <PointsTableTab data={points || []} />
        </TabsContent>
        <TabsContent value="venues">
          <VenueTab data={venues || []} />
        </TabsContent>
        <TabsContent value="stats">
          <StatsTab data={stats || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchDetails;
