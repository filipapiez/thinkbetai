import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings2, Check, Bell, Palette, Database } from 'lucide-react';
import { toast } from 'sonner';

interface SportConfig {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  available: boolean;
  requiresUpgrade: boolean;
}

const SPORTS_CONFIG: SportConfig[] = [
  { id: 'nba', name: 'NBA Basketball', shortName: 'NBA', leagueId: 'NBA', available: true, requiresUpgrade: false },
  { id: 'nfl', name: 'NFL Football', shortName: 'NFL', leagueId: 'NFL', available: true, requiresUpgrade: false },
  { id: 'nhl', name: 'NHL Hockey', shortName: 'NHL', leagueId: 'NHL', available: true, requiresUpgrade: false },
  { id: 'ncaab', name: 'College Basketball', shortName: 'NCAAB', leagueId: 'NCAAB', available: true, requiresUpgrade: false },
  { id: 'ncaaf', name: 'College Football', shortName: 'NCAAF', leagueId: 'NCAAF', available: true, requiresUpgrade: false },
  { id: 'mlb', name: 'MLB Baseball', shortName: 'MLB', leagueId: 'MLB', available: true, requiresUpgrade: false },
];

const STORAGE_KEY = 'betting-sports-preferences';

const SettingsPage = () => {
  // Note: localStorage stores user preferences (sport selections) - not sensitive data
  const [enabledSports, setEnabledSports] = useState<Set<string>>(() => {
    const defaultSports = new Set(SPORTS_CONFIG.filter(s => s.available).map(s => s.id));
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate: must be an array of strings that match known sport IDs
        if (Array.isArray(parsed)) {
          const validSportIds = SPORTS_CONFIG.map(s => s.id);
          const validatedSports = parsed.filter(
            (item): item is string => typeof item === 'string' && validSportIds.includes(item)
          );
          return new Set(validatedSports);
        }
      }
    } catch {
      // Invalid data - clear and use defaults
      localStorage.removeItem(STORAGE_KEY);
    }
    return defaultSports;
  });

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabledSports]));
  }, [enabledSports]);

  const toggleSport = (sportId: string) => {
    const sport = SPORTS_CONFIG.find(s => s.id === sportId);
    if (sport?.requiresUpgrade) {
      toast.error('This sport requires an API subscription upgrade');
      return;
    }
    
    setEnabledSports(prev => {
      const next = new Set(prev);
      if (next.has(sportId)) {
        next.delete(sportId);
      } else {
        next.add(sportId);
      }
      return next;
    });
  };

  const enableAll = () => {
    setEnabledSports(new Set(SPORTS_CONFIG.filter(s => s.available).map(s => s.id)));
    toast.success('All available sports enabled');
  };

  const disableAll = () => {
    setEnabledSports(new Set());
    toast.info('All sports disabled');
  };

  const availableSports = SPORTS_CONFIG.filter(s => s.available);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Configure your sports preferences and app settings
            </p>
          </div>

          {/* Sports Preferences */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Sports Data Sources
                  </CardTitle>
                  <CardDescription>
                    Choose which sports to fetch live odds data for
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={enableAll}>
                    Enable All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={disableAll}>
                    Disable All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Available Sports */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Available Sports ({availableSports.length})
                </h3>
                <div className="grid gap-3">
                  {availableSports.map(sport => (
                    <div 
                      key={sport.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{sport.shortName}</Badge>
                        <span className="font-medium">{sport.name}</span>
                      </div>
                      <Switch
                        checked={enabledSports.has(sport.id)}
                        onCheckedChange={() => toggleSport(sport.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you want to be notified about betting opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about GOOD bet opportunities
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the app looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for the interface
                  </p>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsPage;
