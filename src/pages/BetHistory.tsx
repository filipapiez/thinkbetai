import { useState, useMemo } from "react";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Filter, TrendingUp, Trophy, X } from "lucide-react";
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

interface HistoricalBet {
  id: string;
  date: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  odds: number;
  result: "win" | "loss";
  confidence: number;
  edge: number;
}

const generateHistoricalBets = (): HistoricalBet[] => {
  const sports = ["NBA", "NFL", "MLB", "NCAAB", "NCAAF"];
  const teams: Record<string, string[]> = {
    NBA: ["Lakers", "Celtics", "Warriors", "Bucks", "Heat", "Nuggets", "Suns", "76ers"],
    NFL: ["Chiefs", "Eagles", "49ers", "Bills", "Cowboys", "Ravens", "Lions", "Dolphins"],
    MLB: ["Yankees", "Dodgers", "Astros", "Braves", "Mets", "Phillies", "Rangers", "Orioles"],
    NCAAB: ["Duke", "Kansas", "UConn", "Gonzaga", "Kentucky", "North Carolina", "Houston", "Purdue"],
    NCAAF: ["Georgia", "Michigan", "Alabama", "Ohio State", "Texas", "USC", "Clemson", "Florida State"],
  };

  // Sport-specific win rates for more realistic data
  const sportWinRates: Record<string, number> = {
    NBA: 0.68,
    NFL: 0.65,
    MLB: 0.59,
    NCAAB: 0.63,
    NCAAF: 0.61,
  };

  const bets: HistoricalBet[] = [];

  for (let i = 0; i < 150; i++) {
    const sport = sports[Math.floor(Math.random() * sports.length)];
    const sportTeams = teams[sport];
    const homeIdx = Math.floor(Math.random() * sportTeams.length);
    let awayIdx = Math.floor(Math.random() * sportTeams.length);
    while (awayIdx === homeIdx) {
      awayIdx = Math.floor(Math.random() * sportTeams.length);
    }

    const isMoneyline = Math.random() > 0.5;
    const pickTeam = Math.random() > 0.5 ? sportTeams[homeIdx] : sportTeams[awayIdx];
    const spread = Math.floor(Math.random() * 14) - 7;
    const pick = isMoneyline ? `${pickTeam} ML` : `${pickTeam} ${spread > 0 ? "+" : ""}${spread}`;

    const winRate = sportWinRates[sport];
    const isWin = Math.random() < winRate;
    const confidence = Math.floor(Math.random() * 25) + 65;
    const edge = parseFloat((Math.random() * 8 + 2).toFixed(1));
    const odds = isMoneyline
      ? Math.random() > 0.5
        ? Math.floor(Math.random() * 150) + 100
        : -(Math.floor(Math.random() * 150) + 100)
      : Math.random() > 0.5
      ? Math.floor(Math.random() * 30) + 100
      : -(Math.floor(Math.random() * 30) + 100);

    bets.push({
      id: `bet-${i}`,
      date: format(subDays(new Date(), Math.floor(Math.random() * 180)), "yyyy-MM-dd"),
      sport,
      homeTeam: sportTeams[homeIdx],
      awayTeam: sportTeams[awayIdx],
      pick,
      odds,
      result: isWin ? "win" : "loss",
      confidence,
      edge,
    });
  }

  return bets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const historicalBets = generateHistoricalBets();

const BetHistory = () => {
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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
  }, [sportFilter, resultFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const wins = filteredBets.filter((b) => b.result === "win").length;
    const losses = filteredBets.filter((b) => b.result === "loss").length;
    const total = filteredBets.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";
    return { wins, losses, total, winRate };
  }, [filteredBets]);

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
            Complete record of all AI-qualified betting picks with performance tracking
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
              <p className="text-2xl font-bold text-primary">{stats.winRate}%</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Total Bets</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Wins</div>
              <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Losses</div>
              <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
            </CardContent>
          </Card>
        </div>

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
                  <SelectItem value="NBA">NBA</SelectItem>
                  <SelectItem value="NFL">NFL</SelectItem>
                  <SelectItem value="MLB">MLB</SelectItem>
                  <SelectItem value="NCAAB">NCAAB</SelectItem>
                  <SelectItem value="NCAAF">NCAAF</SelectItem>
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
                        {bet.awayTeam} @ {bet.homeTeam}
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
            {filteredBets.length === 0 && (
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
