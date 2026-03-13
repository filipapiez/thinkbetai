import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTeamLogo } from '@/hooks/useTeamLogo';
import { isCombatSportForLogos, isIndividualSportForLogos } from '@/lib/teamLogos';

interface TeamLogoProps {
  teamName: string;
  abbreviation: string;
  sport: string;
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
}

// Generate a consistent color from team name for fallback styling
function getTeamColor(teamName: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 45%, 25%)`,
    text: `hsl(${hue}, 60%, 75%)`,
  };
}

export const TeamLogo = ({
  teamName,
  abbreviation,
  sport,
  className,
  showBorder = false,
  borderColor,
}: TeamLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { logoUrl, loading } = useTeamLogo(teamName, sport);
  const isIndividual = isIndividualSportForLogos(sport);
  const showImage = logoUrl && !imageError && !isIndividual;
  
  const teamColor = getTeamColor(teamName);

  return (
    <div
      className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0",
        showBorder && borderColor,
        className
      )}
      style={!showImage ? { background: `linear-gradient(135deg, ${teamColor.bg}, hsl(var(--muted)))` } : undefined}
    >
      {showImage ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-base font-bold tracking-tight"
                style={{ color: teamColor.text }}
              >
                {abbreviation}
              </span>
            </div>
          )}
          <img
            src={logoUrl}
            alt={`${teamName} logo`}
            width={40}
            height={40}
            className={cn(
              "w-10 h-10 object-contain transition-opacity duration-200",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </>
      ) : (
        <span
          className="text-base font-bold tracking-tight drop-shadow-sm"
          style={{ color: teamColor.text }}
        >
          {abbreviation}
        </span>
      )}
    </div>
  );
};
