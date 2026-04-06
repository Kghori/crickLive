import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MatchInfo } from '@/services/cricketApi';

interface MatchCardProps {
  match: MatchInfo;
  variant?: 'live' | 'upcoming';
}

const adLinks = [
  'https://www.profitablecpmratenetwork.com/um9bwb10?key=63afd70cc28620fb8681270e825cfbb8',
  'https://ad2.com',
  'https://ad3.com',
];

const MatchCard = memo(({ match, variant = 'live' }: MatchCardProps) => {
  const navigate = useNavigate();
  const isLive = variant === 'live';
  const team1 = match.teamInfo?.[0];
  const team2 = match.teamInfo?.[1];
  const score1 = match.score?.find(s => s.inning?.includes(match.teams?.[0]));
  const score2 = match.score?.find(s => s.inning?.includes(match.teams?.[1]));

  const handleOpenMatch = () => {
    const targetPath = `/match/${match.id}`;
    const randomAd = adLinks[Math.floor(Math.random() * adLinks.length)];

    if (!randomAd) {
      navigate(targetPath);
      return;
    }

    const adWindow = window.open(randomAd, '_blank', 'noopener,noreferrer');
    if (!adWindow) {
      navigate(targetPath);
      return;
    }

    const poll = window.setInterval(() => {
      if (adWindow.closed) {
        window.clearInterval(poll);
        navigate(targetPath);
      }
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={handleOpenMatch}
      className="group block rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {match.matchType?.toUpperCase()}
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-cricket-live">
            <span className="live-pulse inline-block h-2 w-2 rounded-full bg-cricket-live" />
            LIVE
          </span>
        )}
        {!isLive && (
          <span className="text-xs text-muted-foreground">
            {new Date(match.dateTimeGMT).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-3">
        <TeamRow
          name={match.teams?.[0] || 'TBA'}
          shortName={team1?.shortname}
          img={team1?.img}
          score={score1 ? `${score1.r}/${score1.w}` : undefined}
          overs={score1 ? `(${score1.o} ov)` : undefined}
        />
        <TeamRow
          name={match.teams?.[1] || 'TBA'}
          shortName={team2?.shortname}
          img={team2?.img}
          score={score2 ? `${score2.r}/${score2.w}` : undefined}
          overs={score2 ? `(${score2.o} ov)` : undefined}
        />
      </div>

      {/* Status */}
      <div className="mt-3 border-t pt-3">
        <p className="text-xs font-medium text-primary">{match.status}</p>
        {match.venue && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{match.venue}</p>
        )}
      </div>

      {isLive && match.liveBatters && match.liveBatters.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-xs font-semibold text-foreground">Live Batting (Player Wise)</p>
          <div className="space-y-1.5">
            {match.liveBatters.map((batter, idx) => (
              <div key={`${batter.name}-${idx}`} className="rounded-md bg-secondary/30 px-2 py-1.5 text-xs">
                <span className="truncate text-muted-foreground">
                  {batter.name}
                  {batter.isOut ? '' : ' *'}
                </span>
                <p className="mt-0.5 font-semibold text-foreground">
                  {batter.runs} runs ({batter.balls} balls) - 4s {batter.fours ?? 0}, 6s {batter.sixes ?? 0}, SR{' '}
                  {formatStrikeRate(batter.strikeRate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLive && match.scorecardBatters && match.scorecardBatters.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-xs font-semibold text-foreground">Scorecard (Top Batters)</p>
          <div className="space-y-1.5">
            {match.scorecardBatters.map((batter, idx) => (
              <div key={`${batter.name}-score-${idx}`} className="rounded-md bg-secondary/20 px-2 py-1.5 text-xs">
                <span className="truncate text-muted-foreground">
                  {batter.name}
                  {batter.isOut ? '' : ' *'}
                </span>
                <p className="mt-0.5 font-semibold text-foreground">
                  {batter.runs} runs ({batter.balls} balls) - 4s {batter.fours ?? 0}, 6s {batter.sixes ?? 0}, SR{' '}
                  {formatStrikeRate(batter.strikeRate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
});

MatchCard.displayName = 'MatchCard';

interface TeamRowProps {
  name: string;
  shortName?: string;
  img?: string;
  score?: string;
  overs?: string;
}

const TeamRow = memo(({ name, shortName, img, score, overs }: TeamRowProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      {img ? (
        <img src={img} alt={name} className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
          {(shortName || name).slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-semibold text-foreground">{shortName || name}</span>
    </div>
    {score && (
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">{overs}</span>
      </div>
    )}
  </div>
));

TeamRow.displayName = 'TeamRow';

const formatStrikeRate = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0.0';
  return value.toFixed(1);
};

export default MatchCard;
