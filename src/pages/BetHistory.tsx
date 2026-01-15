import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isWithinInterval, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Filter, TrendingUp, Trophy, X, Loader2, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface HistoricalBet {
  id: string;
  date: string;
  sport: string;
  home_team: string;
  away_team: string;
  pick: string;
  odds: number;
  result: "win" | "loss";
  confidence: number;
  edge: number;
}

const BetHistory = () => {
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { data: historicalBets = [], isLoading } = useQuery({
    queryKey: ["historical-bets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historical_bets")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as HistoricalBet[];
    },
  });

  const filteredBets = useMemo(() => {
    return historicalBets.filter((bet) => {
      if (sportFilter !== "all" && bet.sport !== sportFilter) return false;
      if (resultFilter !== "all" && bet.result !== resultFilter) return false;

      if (dateFrom || dateTo) {
        const betDate = parseISO(bet.date);
        if (dateFrom && dateTo) {
          if (!isWithinInterval(betDate, { start: dateFrom, end: dateTo })) return false;
        } else if (dateFrom && betDate < dateFrom) {
          return false;
        } else if (dateTo && betDate > dateTo) {
          return false;
        }
      }

      return true;
    });
  }, [historicalBets, sportFilter, resultFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const wins = filteredBets.filter((b) => b.result === "win").length;
    const losses = filteredBets.filter((b) => b.result === "loss").length;
    const total = filteredBets.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";
    return { wins, losses, total, winRate };
  }, [filteredBets]);

  // Get unique sports from the data
  const availableSports = useMemo(() => {
    const sports = new Set(historicalBets.map((b) => b.sport));
    return Array.from(sports).sort();
  }, [historicalBets]);

  // Calculate sport-by-sport breakdown
  const sportBreakdown = useMemo(() => {
    const breakdown: Record<string, { wins: number; losses: number; total: number; winRate: number }> = {};
    
    historicalBets.forEach((bet) => {
      if (!breakdown[bet.sport]) {
        breakdown[bet.sport] = { wins: 0, losses: 0, total: 0, winRate: 0 };
      }
      breakdown[bet.sport].total++;
      if (bet.result === "win") {
        breakdown[bet.sport].wins++;
      } else {
        breakdown[bet.sport].losses++;
      }
    });

    // Calculate win rates
    Object.keys(breakdown).forEach((sport) => {
      const { wins, total } = breakdown[sport];
      breakdown[sport].winRate = total > 0 ? (wins / total) * 100 : 0;
    });

    // Sort by win rate descending
    return Object.entries(breakdown)
      .sort(([, a], [, b]) => b.winRate - a.winRate)
      .map(([sport, data]) => ({ sport, ...data }));
  }, [historicalBets]);

  const clearFilters = () => {
    setSportFilter("all");
    setResultFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = sportFilter !== "all" || resultFilter !== "all" || dateFrom || dateTo;

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Historical Qualified Bets</h1>
          <p className="text-muted-foreground">
            Complete record of all AI-qualified betting picks with verified results
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${stats.winRate}%`}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Total Bets</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Wins</div>
              <p className="text-2xl font-bold text-green-500">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.wins}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Losses</div>
              <p className="text-2xl font-bold text-red-500">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.losses}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sport-by-Sport Breakdown */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance by Sport
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {sportBreakdown.map(({ sport, wins, losses, total, winRate }) => (
                  <div
                    key={sport}
                    className="p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors cursor-pointer"
                    onClick={() => setSportFilter(sport)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary font-semibold">
                        {sport}
                      </Badge>
                      <span className={cn(
                        "text-lg font-bold",
                        winRate >= 65 ? "text-green-500" : winRate >= 55 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {winRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={winRate} 
                      className="h-2 mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{wins}W - {losses}L</span>
                      <span>{total} bets</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="w-[150px] bg-background border-border">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {availableSports.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-[150px] bg-background border-border">
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="win">Wins Only</SelectItem>
                  <SelectItem value="loss">Losses Only</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal bg-background border-border",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal bg-background border-border",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead className="text-muted-foreground">Sport</TableHead>
                      <TableHead className="text-muted-foreground">Matchup</TableHead>
                      <TableHead className="text-muted-foreground">Pick</TableHead>
                      <TableHead className="text-muted-foreground">Odds</TableHead>
                      <TableHead className="text-muted-foreground">Confidence</TableHead>
                      <TableHead className="text-muted-foreground">Edge</TableHead>
                      <TableHead className="text-muted-foreground">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBets.map((bet) => (
                      <TableRow key={bet.id} className="border-border">
                        <TableCell className="text-foreground">
                          {format(parseISO(bet.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                            {bet.sport}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {bet.away_team} @ {bet.home_team}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{bet.pick}</TableCell>
                        <TableCell className="text-foreground">{formatOdds(bet.odds)}</TableCell>
                        <TableCell>
                          <span className="text-primary font-medium">{bet.confidence}%</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-500">+{bet.edge}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              bet.result === "win"
                                ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            )}
                          >
                            {bet.result === "win" ? "W" : "L"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {!isLoading && filteredBets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No bets match your filters. Try adjusting your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default BetHistory;