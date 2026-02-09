import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getTeamLogoUrl, sportSupportsLogos, isCombatSportForLogos, isIndividualSportForLogos } from '@/lib/teamLogos';

interface TeamLogoProps {
  teamName: string;
  abbreviation: string;
  sport: string;
  className?: string;
  showBorder?: boolean;
  borderColor?: string; // For combat sports corner colors
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
  
  const logoUrl = getTeamLogoUrl(teamName, sport);
  const hasLogo = logoUrl && sportSupportsLogos(sport) && !isIndividualSportForLogos(sport);
  const isCombat = isCombatSportForLogos(sport);
  
  // Show logo if available, otherwise show abbreviation
  const showImage = hasLogo && !imageError;
  
  return (
    <div
      className={cn(
        "w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden",
        showBorder && borderColor,
        className
      )}
    >
      {showImage ? (
        <>
          {/* Skeleton while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-muted-foreground">
                {abbreviation}
              </span>
            </div>
          )}
          <img
            src={logoUrl}
            alt={`${teamName} logo`}
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
        <span className="text-xl font-bold">
          {abbreviation}
        </span>
      )}
    </div>
  );
};
