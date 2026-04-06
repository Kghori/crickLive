import type { VenueInfo } from '@/services/cricketApi';

interface VenueTabProps {
  data: VenueInfo[];
}

const VenueTab = ({ data }: VenueTabProps) => {
  if (!data.length) return <p className="text-sm text-muted-foreground">Venue list not available.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map(venue => (
        <div key={venue.id} className="rounded-lg border bg-card p-3">
          <p className="text-sm font-semibold text-foreground">{venue.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[venue.city, venue.country].filter(Boolean).join(', ') || 'Location unavailable'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default VenueTab;
