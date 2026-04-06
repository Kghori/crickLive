import type { PointsTableRow } from '@/services/cricketApi';
import HighPerformanceAd from '@/components/ads/HighPerformanceAd';
import PopunderAd from '@/components/ads/PopunderAd';

interface PointsTableTabProps {
  data: PointsTableRow[];
}

const PointsTableTab = ({ data }: PointsTableTabProps) => {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground">Points table not available.</p>;
  }

  return (
    <div className="space-y-4">
      <PopunderAd />
      <div className="flex justify-center">
        <HighPerformanceAd className="rounded-xl  " />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b bg-secondary/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">P</th>
              <th className="px-3 py-2">W</th>
              <th className="px-3 py-2">L</th>
              <th className="px-3 py-2">Pts</th>
              <th className="px-3 py-2">NRR</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={`${row.team}-${idx}`} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-medium text-foreground">{row.team}</td>
                <td className="px-3 py-2">{row.played}</td>
                <td className="px-3 py-2">{row.won}</td>
                <td className="px-3 py-2">{row.lost}</td>
                <td className="px-3 py-2 font-semibold text-primary">{row.points}</td>
                <td className="px-3 py-2">{row.nrr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PointsTableTab;
