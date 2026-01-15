import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, TrendingUp, Filter, Trophy, X, Activity } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { platformStats } from "@/lib/mockData";

interface HistoricalBet {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  odds: string;
  result: "W" | "L";
  date: Date;
  confidence: number;
  edge: number;
}

// Generate mock historical bets data
const generateHistoricalBets = (): HistoricalBet[] => {
  const sports = ["NBA", "NFL", "MLB", "NHL", "NCAAB", "NCAAF", "UFC", "Soccer"];
  const teams: Record<string, string[]> = {
    NBA: ["Lakers", "Celtics", "Warriors", "Bucks", "Heat", "76ers", "Nuggets", "Suns"],
    NFL: ["Chiefs", "Eagles", "Bills", "49ers", "Cowboys", "Ravens", "Lions", "Dolphins"],
    MLB: ["Yankees", "Dodgers", "Braves", "Astros", "Padres", "Phillies", "Mets", "Rangers"],
    NHL: ["Bruins", "Panthers", "Oilers", "Stars", "Rangers", "Avalanche", "Hurricanes", "Devils"],
    NCAAB: ["Duke", "Kansas", "Kentucky", "UNC", "Gonzaga", "UCLA", "UConn", "Purdue"],
    NCAAF: ["Alabama", "Georgia", "Ohio State", "Michigan", "Texas", "USC", "Oregon", "Clemson"],
    UFC: ["Fighter A", "Fighter B", "Fighter C", "Fighter D", "Fighter E", "Fighter F"],
    Soccer: ["Man City", "Arsenal", "Liverpool", "Chelsea", "Real Madrid", "Barcelona", "Bayern", "PSG"],
  };

  const bets: HistoricalBet[] = [];
  const now = new Date();

  // Generate 100 historical bets over the last 90 days
  for (let i = 0; i < 100; i++) {
    const sport = sports[Math.floor(Math.random() * sports.length)];
    const sportTeams = teams[sport];
    const homeIdx = Math.floor(Math.random() * sportTeams.length);
    let awayIdx = Math.floor(Math.random() * sportTeams.length);
    while (awayIdx === homeIdx) {
      awayIdx = Math.floor(Math.random() * sportTeams.length);
    }

    const isWin = Math.random() < 0.67; // ~67% win rate for qualified bets
    const daysAgo = Math.floor(Math.random() * 90);
    const confidence = 65 + Math.floor(Math.random() * 25);
    const edge = 3 + Math.floor(Math.random() * 8);

    bets.push({
      id: `bet-${i}`,
      sport,
      homeTeam: sportTeams[homeIdx],
      awayTeam: sportTeams[awayIdx],
      pick: Math.random() > 0.5 ? sportTeams[homeIdx] : sportTeams[awayIdx],
      odds: Math.random() > 0.5 ? `-${110 + Math.floor(Math.random() * 40)}` : `+${100 + Math.floor(Math.random() * 50)}`,
      result: isWin ? "W" : "L",
      date: subDays(now, daysAgo),
      confidence,
      edge,
    });
  }

  return bets.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const historicalBets = generateHistoricalBets();

const HistoricalBets = () => {
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const sports = useMemo(() => {
    const uniqueSports = [...new Set(historicalBets.map((bet) => bet.sport))];
    return uniqueSports.sort();
  }, []);

  const filteredBets = useMemo(() => {
    return historicalBets.filter((bet) => {
      // Sport filter
      if (sportFilter !== "all" && bet.sport !== sportFilter) return false;

      // Result filter
      if (resultFilter !== "all" && bet.result !== resultFilter) return false;

      // Date range filter
      if (dateRange?.from && isBefore(bet.date, startOfDay(dateRange.from))) return false;
      if (dateRange?.to && isAfter(bet.date, endOfDay(dateRange.to))) return false;

      return true;
    });
  }, [sportFilter, resultFilter, dateRange]);

  const stats = useMemo(() => {
    const wins = filteredBets.filter((b) => b.result === "W").length;
    const losses = filteredBets.filter((b) => b.result === "L").length;
    const total = filteredBets.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";

    return { wins, losses, total, winRate };
  }, [filteredBets]);

  const clearFilters = () => {
    setSportFilter("all");
    setResultFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters = sportFilter !== "all" || resultFilter !== "all" || dateRange?.from;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Historical Qualified Bets</h1>
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Track all qualified bets with verified results. Our AI system maintains a {platformStats.qualifiedWinRate}% win rate on qualified picks.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Bets</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.wins}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.winRate}%</p>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="glass" className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Sport Filter */}
              <div className="w-full sm:w-auto">
                <label className="text-sm text-muted-foreground mb-1 block">Sport</label>
                <Select value={sportFilter} onValueChange={setSportFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
                    <SelectValue placeholder="All Sports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {sports.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Result Filter */}
              <div className="w-full sm:w-auto">
                <label className="text-sm text-muted-foreground mb-1 block">Result</label>
                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
                    <SelectValue placeholder="All Results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="W">Wins Only</SelectItem>
                    <SelectItem value="L">Losses Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="w-full sm:w-auto">
                <label className="text-sm text-muted-foreground mb-1 block">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[280px] justify-start text-left font-normal bg-background/50",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bets Table */}
        <Card variant="glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Matchup</TableHead>
                    <TableHead>Pick</TableHead>
                    <TableHead>Odds</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Edge</TableHead>
                    <TableHead className="text-center">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No bets found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBets.map((bet) => (
                      <TableRow key={bet.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell className="text-muted-foreground">
                          {format(bet.date, "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {bet.sport}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {bet.awayTeam} @ {bet.homeTeam}
                        </TableCell>
                        <TableCell className="text-primary font-medium">{bet.pick}</TableCell>
                        <TableCell className="font-mono">{bet.odds}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${bet.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{bet.confidence}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-emerald-400">+{bet.edge}%</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "font-bold",
                              bet.result === "W"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            )}
                          >
                            {bet.result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Overall Stats Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Platform Win Rate: <span className="font-bold text-primary">{platformStats.qualifiedWinRate}%</span>
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HistoricalBets;
