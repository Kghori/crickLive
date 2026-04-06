import axios from 'axios';
import { getCache, getCacheStale, setCache } from '@/utils/cache';

const RAPID_API_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
const RAPID_API_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';
const BASE_URL = `https://${RAPID_API_HOST}`;

const CACHE_TTL_LIVE = 45 * 1000; // 45 seconds
const CACHE_TTL_UPCOMING = 10 * 60 * 1000; // 10 minutes
const CACHE_TTL_NEWS = 10 * 60 * 1000;

export interface MatchInfo {
  id: string;
  name: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo?: Array<{
    name: string;
    shortname: string;
    img: string;
  }>;
  score?: Array<{
    r: number;
    w: number;
    o: number;
    inning: string;
  }>;
  matchType: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
  liveBatters?: BatterInfo[];
  scorecardBatters?: BatterInfo[];
  seriesId?: number;
  teamIds?: number[];
  venueId?: number;
}

export interface BatterInfo {
  name: string;
  runs: number;
  balls: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  isOut?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  source_id?: string;
}

export interface SeriesInfo {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface MatchScorecard {
  inningsId: number;
  batters: BatterInfo[];
}

export interface PointsTableRow {
  team: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  nrr: string;
}

export interface VenueInfo {
  id: number;
  name: string;
  city?: string;
  country?: string;
}

export interface StatItem {
  name: string;
  value: string;
  team?: string;
}

export type RegionFilter = 'all' | 'indian' | 'worldwide';

interface RawTeam {
  teamId?: number;
  teamName?: string;
  teamSName?: string;
  imageId?: number;
}

interface RawInningScore {
  runs?: number;
  wickets?: number;
  overs?: number;
}

interface RawMatch {
  matchInfo?: {
    matchId?: number;
    seriesName?: string;
    seriesId?: number;
    matchDesc?: string;
    matchFormat?: string;
    startDate?: string;
    state?: string;
    stateTitle?: string;
    status?: string;
    team1?: RawTeam;
    team2?: RawTeam;
    venueInfo?: {
      id?: number;
      ground?: string;
      city?: string;
    };
  };
  matchScore?: {
    team1Score?: Record<string, RawInningScore>;
    team2Score?: Record<string, RawInningScore>;
  };
}

interface LeanbackResponse {
  miniscore?: {
    batsmanstriker?: {
      name?: string;
      runs?: number;
      balls?: number;
      fours?: number;
      sixes?: number;
      strkrate?: string;
      outdec?: string;
    };
    batsmannonstriker?: {
      name?: string;
      runs?: number;
      balls?: number;
      fours?: number;
      sixes?: number;
      strkrate?: string;
      outdec?: string;
    };
  };
}

interface ScorecardResponse {
  scorecard?: Array<{
    inningsid?: number;
    batsman?: Array<{
      name?: string;
      runs?: number;
      balls?: number;
      fours?: number;
      sixes?: number;
      strkrate?: string;
      outdec?: string;
    }>;
  }>;
}

const rapidHeaders = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': RAPID_API_HOST,
  'x-rapidapi-key': RAPID_API_KEY,
};

const isQuotaExceededError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  const message = String(error.response?.data?.message || error.message || '').toLowerCase();
  return error.response?.status === 429 || message.includes('monthly quota') || message.includes('exceeded');
};

const quotaErrorMessage =
  'API monthly quota exceeded on current RapidAPI plan. Please upgrade plan or use a new API key.';

const imageUrl = (imageId?: number) =>
  imageId ? `https://static.cricbuzz.com/a/img/v1/40x40/i1/c${imageId}/i.jpg` : '';

const inningsToScore = (teamName: string, innings: Record<string, RawInningScore> | undefined) => {
  if (!innings) return [];
  return Object.values(innings)
    .filter(i => typeof i?.runs === 'number')
    .map((i, idx) => ({
      r: i.runs ?? 0,
      w: i.wickets ?? 0,
      o: i.overs ?? 0,
      inning: `${teamName} ${idx + 1}`,
    }));
};

const parseDate = (ms?: string) => {
  if (!ms) return '';
  const value = Number(ms);
  if (Number.isNaN(value)) return '';
  return new Date(value).toISOString();
};

const isIndianOrIpl = (match: MatchInfo) => {
  const haystack = [
    match.name,
    match.venue,
    ...(match.teams || []),
    ...(match.teamInfo?.map(t => t.name) || []),
  ]
    .join(' ')
    .toLowerCase();

  return (
    haystack.includes('india') ||
    haystack.includes('indian premier league') ||
    haystack.includes('ipl') ||
    match.teamInfo?.some(t => t.shortname?.toLowerCase() === 'ind') ||
    false
  );
};

const applyRegion = (matches: MatchInfo[], region: RegionFilter) => {
  if (region === 'all') return matches;
  if (region === 'indian') return matches.filter(isIndianOrIpl);
  return matches.filter(m => !isIndianOrIpl(m));
};

const extractMatches = (payload: unknown): RawMatch[] => {
  if (!payload || typeof payload !== 'object') return [];
  const typeMatches = (payload as { typeMatches?: unknown[] }).typeMatches;
  if (!Array.isArray(typeMatches)) return [];

  return typeMatches.flatMap(typeMatch => {
    const seriesMatches = (typeMatch as { seriesMatches?: unknown[] }).seriesMatches;
    if (!Array.isArray(seriesMatches)) return [];
    return seriesMatches.flatMap(series => {
      const seriesAdWrapper = (series as { seriesAdWrapper?: { matches?: RawMatch[] } }).seriesAdWrapper;
      return Array.isArray(seriesAdWrapper?.matches) ? seriesAdWrapper.matches : [];
    });
  });
};

const toMatchInfo = (raw: RawMatch): MatchInfo | null => {
  const info = raw.matchInfo;
  if (!info?.matchId || !info?.team1 || !info?.team2) return null;

  const team1Name = info.team1.teamName || 'Team 1';
  const team2Name = info.team2.teamName || 'Team 2';
  const venue = [info.venueInfo?.ground, info.venueInfo?.city].filter(Boolean).join(', ');
  const score = [
    ...inningsToScore(team1Name, raw.matchScore?.team1Score),
    ...inningsToScore(team2Name, raw.matchScore?.team2Score),
  ];

  return {
    id: String(info.matchId),
    name: `${info.seriesName || ''} - ${info.matchDesc || ''}`.trim(),
    status: info.status || info.state || 'Live',
    venue,
    date: parseDate(info.startDate),
    dateTimeGMT: parseDate(info.startDate),
    teams: [team1Name, team2Name],
    teamInfo: [
      {
        name: team1Name,
        shortname: info.team1.teamSName || team1Name.slice(0, 3).toUpperCase(),
        img: imageUrl(info.team1.imageId),
      },
      {
        name: team2Name,
        shortname: info.team2.teamSName || team2Name.slice(0, 3).toUpperCase(),
        img: imageUrl(info.team2.imageId),
      },
    ],
    score,
    matchType: info.matchFormat || 'T20',
    matchStarted: info.state !== 'Preview',
    matchEnded: info.state === 'Complete',
    seriesId: info.seriesId,
    venueId: info.venueInfo?.id,
    teamIds: [info.team1.teamId, info.team2.teamId].filter((id): id is number => typeof id === 'number'),
  };
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const parseLiveBatters = (data: LeanbackResponse): BatterInfo[] => {
  const striker = data.miniscore?.batsmanstriker;
  const nonStriker = data.miniscore?.batsmannonstriker;
  const arr = [striker, nonStriker].filter(Boolean);
  return arr.map(b => ({
    name: b?.name || 'Unknown',
    runs: toNumber(b?.runs),
    balls: toNumber(b?.balls),
    fours: toNumber(b?.fours),
    sixes: toNumber(b?.sixes),
    strikeRate: toNumber(b?.strkrate),
    isOut: !!b?.outdec,
  }));
};

async function fetchLeanbackBatters(matchId: string): Promise<BatterInfo[]> {
  try {
    const { data } = await axios.get<LeanbackResponse>(`${BASE_URL}/mcenter/v1/${matchId}/leanback`, {
      headers: rapidHeaders,
    });
    return parseLiveBatters(data);
  } catch {
    return [];
  }
}

const parseScorecardBatters = (data: ScorecardResponse): BatterInfo[] => {
  const innings = Array.isArray(data.scorecard) ? data.scorecard[0] : undefined;
  const batters = Array.isArray(innings?.batsman) ? innings.batsman : [];

  return batters
    .filter(b => (b.runs ?? 0) > 0 || (b.balls ?? 0) > 0 || (b.outdec || '').toLowerCase() === 'batting')
    .map(b => ({
      name: b.name || 'Unknown',
      runs: toNumber(b.runs),
      balls: toNumber(b.balls),
      fours: toNumber(b.fours),
      sixes: toNumber(b.sixes),
      strikeRate: toNumber(b.strkrate),
      isOut: (b.outdec || '').toLowerCase() !== 'batting',
    }))
    .slice(0, 6);
};

async function fetchScorecardBatters(matchId: string): Promise<BatterInfo[]> {
  try {
    const { data } = await axios.get<ScorecardResponse>(`${BASE_URL}/mcenter/v1/${matchId}/hscard`, {
      headers: rapidHeaders,
    });
    return parseScorecardBatters(data);
  } catch {
    return [];
  }
}

export async function fetchLiveMatches(region: RegionFilter = 'indian'): Promise<MatchInfo[]> {
  const cacheKey = `live_matches_${region}`;
  const cached = getCache<MatchInfo[]>(cacheKey);
  if (cached) return cached;

  if (!RAPID_API_KEY) {
    throw new Error('Missing VITE_RAPIDAPI_KEY. Add it to your .env file.');
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/matches/v1/live`, { headers: rapidHeaders });
    const matches = extractMatches(data)
      .map(toMatchInfo)
      .filter((m): m is MatchInfo => !!m);
    const scoped = applyRegion(matches, region);
    // Keep home-page API usage low to avoid exhausting monthly quota.
    setCache(cacheKey, scoped, CACHE_TTL_LIVE);
    return scoped;
  } catch (error) {
    const stale = getCacheStale<MatchInfo[]>(cacheKey);
    if (stale && stale.length > 0) return stale;
    if (isQuotaExceededError(error)) throw new Error(quotaErrorMessage);
    console.error('Failed to fetch live matches:', error);
    throw error;
  }
}

export async function fetchUpcomingMatches(region: RegionFilter = 'indian'): Promise<MatchInfo[]> {
  const cacheKey = `upcoming_matches_${region}`;
  const cached = getCache<MatchInfo[]>(cacheKey);
  if (cached) return cached;

  if (!RAPID_API_KEY) {
    throw new Error('Missing VITE_RAPIDAPI_KEY. Add it to your .env file.');
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/matches/v1/upcoming`, { headers: rapidHeaders });
    const matches = extractMatches(data)
      .map(toMatchInfo)
      .filter((m): m is MatchInfo => !!m);
    const scoped = applyRegion(matches, region);
    setCache(cacheKey, scoped, CACHE_TTL_UPCOMING);
    return scoped;
  } catch (error) {
    const stale = getCacheStale<MatchInfo[]>(cacheKey);
    if (stale && stale.length > 0) return stale;
    if (isQuotaExceededError(error)) throw new Error(quotaErrorMessage);
    console.error('Failed to fetch upcoming matches:', error);
    throw error;
  }
}

export async function fetchNews(): Promise<NewsItem[]> {
  const cached = getCache<NewsItem[]>('news');
  if (cached) return cached;

  // News endpoint is not currently integrated in this RapidAPI migration.
  setCache('news', [], CACHE_TTL_NEWS);
  return [];
}

export async function fetchMatchScorecard(matchId: string): Promise<MatchScorecard[]> {
  const cacheKey = `match_scorecard_${matchId}`;
  const cached = getCache<MatchScorecard[]>(cacheKey);
  if (cached) return cached;

  let data: ScorecardResponse;
  try {
    const res = await axios.get<ScorecardResponse>(`${BASE_URL}/mcenter/v1/${matchId}/hscard`, {
      headers: rapidHeaders,
    });
    data = res.data;
  } catch (error) {
    const stale = getCacheStale<MatchScorecard[]>(cacheKey);
    if (stale) return stale;
    if (isQuotaExceededError(error)) throw new Error(quotaErrorMessage);
    throw error;
  }

  const scorecards =
    data.scorecard?.map((inning, index) => ({
      inningsId: inning.inningsid ?? index + 1,
      batters: (inning.batsman || [])
        .filter(b => (b.runs ?? 0) > 0 || (b.balls ?? 0) > 0 || Boolean(b.outdec))
        .map(b => ({
          name: b.name || 'Unknown',
          runs: toNumber(b.runs),
          balls: toNumber(b.balls),
          fours: toNumber(b.fours),
          sixes: toNumber(b.sixes),
          strikeRate: toNumber(b.strkrate),
          isOut: (b.outdec || '').toLowerCase() !== 'batting',
        })),
    })) || [];

  setCache(cacheKey, scorecards, CACHE_TTL_LIVE);
  return scorecards;
}

export async function fetchSeriesInfo(seriesId: number): Promise<SeriesInfo | null> {
  const cacheKey = `series_info_${seriesId}`;
  const cached = getCache<SeriesInfo | null>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${BASE_URL}/series/v1/${seriesId}`, { headers: rapidHeaders });
    const info = data?.seriesInfo || data?.series || data;
    const mapped: SeriesInfo = {
      id: seriesId,
      name: info?.name || info?.seriesName || `Series ${seriesId}`,
      startDate: info?.startDate || info?.startDt,
      endDate: info?.endDate || info?.endDt,
      status: info?.status,
    };
    setCache(cacheKey, mapped, CACHE_TTL_UPCOMING);
    return mapped;
  } catch {
    return null;
  }
}

export async function fetchSeriesNews(seriesId: number): Promise<NewsItem[]> {
  const cacheKey = `series_news_${seriesId}`;
  const cached = getCache<NewsItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${BASE_URL}/news/v1/series/${seriesId}`, { headers: rapidHeaders });
    const list = Array.isArray(data?.storyList) ? data.storyList : [];
    const parsed: NewsItem[] = list
      .map((item: { story?: { id?: number; hline?: string; intro?: string; pubTime?: string } }) => item.story)
      .filter(Boolean)
      .map((story: { id?: number; hline?: string; intro?: string; pubTime?: string }) => ({
        id: String(story.id || Math.random()),
        title: story.hline || 'Cricket News',
        description: story.intro || '',
        pubDate: story.pubTime ? new Date(Number(story.pubTime)).toISOString() : new Date().toISOString(),
      }));
    setCache(cacheKey, parsed, CACHE_TTL_UPCOMING);
    return parsed;
  } catch {
    return [];
  }
}

export async function fetchSeriesPointsTable(seriesId: number): Promise<PointsTableRow[]> {
  const cacheKey = `series_points_${seriesId}`;
  const cached = getCache<PointsTableRow[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${BASE_URL}/stats/v1/series/${seriesId}/points-table`, {
      headers: rapidHeaders,
    });
    const table = Array.isArray(data?.pointsTable) ? data.pointsTable : [];
    const rows: PointsTableRow[] = table.flatMap(
      (group: { pointsTableInfo?: Array<{ teamFullName?: string; matchesPlayed?: number; matchesWon?: number; matchesLost?: number; points?: number; nrr?: string }> }) =>
        (group.pointsTableInfo || []).map(row => ({
          team: row.teamFullName || 'Team',
          played: toNumber(row.matchesPlayed),
          won: toNumber(row.matchesWon),
          lost: toNumber(row.matchesLost),
          points: toNumber(row.points),
          nrr: row.nrr || '-',
        }))
    );
    setCache(cacheKey, rows, CACHE_TTL_UPCOMING);
    return rows;
  } catch {
    return [];
  }
}

export async function fetchSeriesVenues(seriesId: number): Promise<VenueInfo[]> {
  const cacheKey = `series_venues_${seriesId}`;
  const cached = getCache<VenueInfo[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${BASE_URL}/series/v1/${seriesId}/venues`, { headers: rapidHeaders });
    const venues = Array.isArray(data?.venueInfo) ? data.venueInfo : [];
    const parsed: VenueInfo[] = venues.map((v: { id?: number; ground?: string; city?: string; country?: string }) => ({
      id: toNumber(v.id),
      name: v.ground || 'Venue',
      city: v.city,
      country: v.country,
    }));
    setCache(cacheKey, parsed, CACHE_TTL_UPCOMING);
    return parsed;
  } catch {
    return [];
  }
}

export async function fetchSeriesStats(seriesId: number): Promise<StatItem[]> {
  const cacheKey = `series_stats_${seriesId}`;
  const cached = getCache<StatItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const [base, mostRuns] = await Promise.all([
      axios.get(`${BASE_URL}/stats/v1/series/${seriesId}`, { headers: rapidHeaders }),
      axios.get(`${BASE_URL}/stats/v1/series/${seriesId}?statsType=mostRuns`, { headers: rapidHeaders }),
    ]);

    const values: StatItem[] = [];
    const categories = Array.isArray(base.data?.types) ? base.data.types : [];
    categories.forEach((c: { header?: string; value?: string }) => {
      if (c?.header && c?.value) values.push({ name: c.header, value: String(c.value) });
    });

    const runStats = Array.isArray(mostRuns.data?.stats) ? mostRuns.data.stats : [];
    runStats.slice(0, 5).forEach((s: { name?: string; value?: string; teamName?: string }) => {
      values.push({ name: s.name || 'Player', value: String(s.value || ''), team: s.teamName });
    });

    setCache(cacheKey, values, CACHE_TTL_UPCOMING);
    return values;
  } catch {
    return [];
  }
}

export async function getUserIp(): Promise<string> {
  try {
    const { data } = await axios.get('https://api64.ipify.org?format=json');
    return data.ip;
  } catch {
    return '';
  }
}
