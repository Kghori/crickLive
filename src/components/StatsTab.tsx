import type { StatItem } from '@/services/cricketApi';
import HighPerformanceAd from '@/components/ads/HighPerformanceAd';
import PopunderAd from '@/components/ads/PopunderAd';

interface StatsTabProps {
  data: StatItem[];
}

const StatsTab = ({ data }: StatsTabProps) => {
  if (!data.length) return <p className="text-sm text-muted-foreground">Stats not available.</p>;

  return (
    <div className="space-y-4">
      <PopunderAd />
      <div className="flex justify-center">
        <HighPerformanceAd className="rounded-xl   p-3" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((stat, idx) => (
          <div key={`${stat.name}-${idx}`} className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">{stat.name}</p>
            <p className="mt-1 text-base font-semibold text-foreground">{stat.value}</p>
            {stat.team && <p className="text-xs text-muted-foreground">{stat.team}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsTab;
