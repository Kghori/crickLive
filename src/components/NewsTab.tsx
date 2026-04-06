import type { NewsItem } from '@/services/cricketApi';

interface NewsTabProps {
  data: NewsItem[];
}

const NewsTab = ({ data }: NewsTabProps) => {
  if (!data.length) return <p className="text-sm text-muted-foreground">No series news available.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map(item => (
        <article key={item.id} className="rounded-lg border bg-card p-4">
          <h3 className="text-sm min-h-10 font-semibold text-foreground">{item.title}</h3>
          {item.description && <p className="mt-1 min-h-20  text-xs text-muted-foreground">{item.description}</p>}
          <time className="mt-2 block text-xxl text-primary">
            {new Date(item.pubDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </article>
      ))}
    </div>
  );
};

export default NewsTab;
