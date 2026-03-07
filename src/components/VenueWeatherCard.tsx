import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Cloud, Wind, Thermometer, Mountain, Plane } from 'lucide-react';
import type { ScrapedVenueWeather } from '@/lib/api/gameData';

interface VenueWeatherCardProps {
  data: ScrapedVenueWeather;
}

export const VenueWeatherCard = ({ data }: VenueWeatherCardProps) => {
  const hasWeather = data.weather || data.temperature || data.wind;
  const hasVenue = data.venue || data.city;
  const hasExtras = data.altitude || data.travelDistance;

  if (!hasWeather && !hasVenue && !hasExtras && !data.notes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Venue & Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.venue && (
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Venue</p>
              <p className="text-sm font-semibold truncate">{data.venue}</p>
              {data.city && <p className="text-xs text-muted-foreground">{data.city}</p>}
            </div>
          )}

          {data.indoor !== undefined && (
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Cloud className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Setting</p>
              <p className="text-sm font-semibold">{data.indoor ? 'Indoor' : 'Outdoor'}</p>
            </div>
          )}

          {data.temperature && (
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Thermometer className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Temp</p>
              <p className="text-sm font-semibold">{data.temperature}</p>
            </div>
          )}

          {data.weather && (
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Cloud className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Weather</p>
              <p className="text-sm font-semibold">{data.weather}</p>
            </div>
          )}

          {data.wind && (
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Wind className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="text-sm font-semibold">{data.wind}</p>
            </div>
          )}

          {data.altitude && (
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Mountain className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Altitude</p>
              <p className="text-sm font-semibold">{data.altitude}</p>
            </div>
          )}

          {data.travelDistance && (
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Plane className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Travel</p>
              <p className="text-sm font-semibold">{data.travelDistance}</p>
            </div>
          )}
        </div>

        {data.notes && (
          <p className="text-xs text-muted-foreground mt-3 bg-muted/20 rounded-lg p-2">{data.notes}</p>
        )}
      </CardContent>
    </Card>
  );
};
