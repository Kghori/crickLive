import type { MatchScorecard } from '@/services/cricketApi';
import HighPerformanceAd from '@/components/ads/HighPerformanceAd';
import PopunderAd from '@/components/ads/PopunderAd';

interface ScorecardTabProps {
  data: MatchScorecard[];
}

const formatSR = (v?: number) => (typeof v === 'number' && !Number.isNaN(v) ? v.toFixed(1) : '0.0');

const ScorecardTab = ({ data }: ScorecardTabProps) => {
  if (!data.length) return <p className="text-sm text-muted-foreground">Scorecard not available yet.</p>;

  return (
    <div className="space-y-4">
      <PopunderAd />
      <div className="flex justify-center">
        <HighPerformanceAd className="rounded-xl " />
      </div>

      {data.map(inning => (
        <div key={inning.inningsId} className="rounded-lg border bg-card p-3">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Innings {inning.inningsId}</h3>
          <div className="space-y-2">
            {inning.batters.slice(0, 8).map((b, idx) => (
              <div key={`${b.name}-${idx}`} className="rounded-md bg-secondary/20 px-2 py-2 text-xs">
                <p className="font-medium text-foreground">
                  {b.name}
                  {b.isOut ? '' : ' *'}
                </p>
                <p className="text-muted-foreground">
                  {b.runs}({b.balls}) | 4s {b.fours ?? 0}, 6s {b.sixes ?? 0}, SR {formatSR(b.strikeRate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScorecardTab;
