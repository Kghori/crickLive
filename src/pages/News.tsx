import { useState, useEffect, useCallback } from 'react';
import { fetchNews, getUserIp, type NewsItem } from '@/services/cricketApi';
import Loader from '@/components/Loader';
import ErrorState from '@/components/ErrorState';
import { Newspaper, ShieldX } from 'lucide-react';
import { useSeo } from '@/hooks/use-seo';

const ALLOWED_IP = '2409:40c1:102f:754b:9519:7c92:9703:79fe';

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  useSeo({
    title: 'Cricket News | CricLive',
    description: 'Latest cricket news, match reports, and series updates.',
    canonicalPath: '/news',
  });

  const checkAccess = useCallback(async () => {
    const ip = await getUserIp();
    setAuthorized(ip === ALLOWED_IP);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNews();
      setNews(data);
    } catch {
      setError('Failed to fetch news.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess().then(() => load());
  }, [checkAccess, load]);

  if (authorized === null || (loading && news.length === 0)) {
    return <Loader text="Verifying access..." />;
  }

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <ShieldX className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          You are not authorized to view this page. This section is restricted to specific IP addresses.
        </p>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Newspaper className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Cricket News</h1>
      </div>
      <div className="space-y-4">
        {news.map((item, i) => (
          <article
            key={item.id || i}
            className="rounded-xl border bg-card p-5 transition-all hover:border-primary/30"
          >
            <h3 className="mb-2 text-base font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            <time className="mt-3 block text-xs text-muted-foreground">
              {new Date(item.pubDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </article>
        ))}
      </div>
    </div>
  );
};

export default News;
