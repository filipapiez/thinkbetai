import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type LedgerRow = {
  id: string;
  date: string;
  published_at: string | null;
  sport: string;
  home_team: string;
  away_team: string;
  pick: string;
  odds: number;
  opening_odds: number | null;
  pick_odds: number | null;
  bookmaker: string | null;
  market_type: string | null;
  line: number | null;
  closing_odds: number | null;
  closing_line: number | null;
  closing_bookmaker: string | null;
  clv_percent: number | null;
  expected_value: number | null;
  confidence: number;
  edge: number;
  result: string;
  created_at: string;
  source_event_id: string | null;
};

const csvEscape = (value: string | number | null | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const formatOdds = (odds?: number | null) => {
  if (typeof odds !== "number" || Number.isNaN(odds)) return "Pending";
  return odds > 0 ? `+${odds}` : String(odds);
};

const formatPercent = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "Pending";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

export const PublicBetLedger = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-track-record-ledger"],
    queryFn: async () => {
      const allRows: LedgerRow[] = [];
      const batchSize = 1000;
      let from = 0;

      while (true) {
        const { data: rows, error } = await supabase
          .from("historical_bets")
          .select("id, date, published_at, sport, home_team, away_team, pick, odds, opening_odds, pick_odds, bookmaker, market_type, line, closing_odds, closing_line, closing_bookmaker, clv_percent, expected_value, confidence, edge, result, created_at, source_event_id")
          .in("result", ["win", "loss"])
          .order("date", { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!rows || rows.length === 0) break;

        allRows.push(...(rows as LedgerRow[]));

        if (rows.length < batchSize) break;
        from += batchSize;
      }

      return allRows;
    },
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(() => data ?? [], [data]);
  const displayRows = useMemo(() => rows.slice(0, 50), [rows]);
  const csv = useMemo(() => {
    const header = [
      "published_at",
      "date",
      "sport",
      "matchup",
      "pick",
      "market",
      "line",
      "bookmaker",
      "opening_odds",
      "pick_odds",
      "closing_bookmaker",
      "closing_line",
      "closing_odds",
      "clv_percent",
      "expected_value_percent",
      "confidence",
      "edge",
      "result",
      "source_event_id",
      "recorded_at",
    ];
    const body = rows.map((row) => [
      row.published_at,
      row.date,
      row.sport,
      `${row.away_team} at ${row.home_team}`,
      row.pick,
      row.market_type,
      row.line,
      row.bookmaker,
      row.opening_odds ?? row.odds,
      row.pick_odds ?? row.odds,
      row.closing_bookmaker,
      row.closing_line,
      row.closing_odds,
      row.clv_percent,
      row.expected_value,
      row.confidence,
      row.edge,
      row.result,
      row.source_event_id,
      row.created_at,
    ]);
    return [header, ...body].map((line) => line.map(csvEscape).join(",")).join("\n");
  }, [rows]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "thinkbetai-public-pick-ledger.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mt-6 border-primary/20">
      <CardContent className="p-6 md:p-8">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Public Pick Ledger</h2>
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Event-level rows make the record easier to inspect than a headline percentage. The table shows the latest settled records and the CSV export includes every public row returned by the database.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={downloadCsv} disabled={rows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export full CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-border bg-muted/20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            The public ledger could not be loaded. No substitute rows are shown because unavailable proof should not be replaced with sample data.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            No settled ledger rows were returned by the public dataset.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead className="min-w-52">Matchup</TableHead>
                  <TableHead>Pick</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Pick Price</TableHead>
                  <TableHead>Close</TableHead>
                  <TableHead>CLV</TableHead>
                  <TableHead>Edge</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(row.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{row.sport}</TableCell>
                    <TableCell>{row.away_team} at {row.home_team}</TableCell>
                    <TableCell>{row.pick}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.bookmaker || "Tracked"}</TableCell>
                    <TableCell>{formatOdds(row.pick_odds ?? row.odds)}</TableCell>
                    <TableCell>
                      <div className="whitespace-nowrap">{formatOdds(row.closing_odds)}</div>
                      {row.closing_bookmaker && (
                        <div className="text-xs text-muted-foreground">{row.closing_bookmaker}</div>
                      )}
                    </TableCell>
                    <TableCell className={row.clv_percent && row.clv_percent > 0 ? "text-emerald-400" : row.clv_percent && row.clv_percent < 0 ? "text-rose-400" : undefined}>
                      {formatPercent(row.clv_percent)}
                    </TableCell>
                    <TableCell>{Number(row.edge).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={row.result === "win" ? "border-emerald-500/40 text-emerald-400" : "border-rose-500/40 text-rose-400"}>
                        {row.result.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Showing the latest {displayRows.length} of {rows.length} settled public rows. CLV appears after the closing-line capture job has run for a pick.
        </p>
      </CardContent>
    </Card>
  );
};
