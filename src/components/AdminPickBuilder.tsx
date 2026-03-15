import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPick {
  id: string;
  pick_type: string;
  sport: string;
  home_team: string | null;
  away_team: string | null;
  player_name: string | null;
  prop_type: string | null;
  line: number | null;
  direction: string | null;
  pick: string;
  odds: number | null;
  confidence: number | null;
  notes: string | null;
  game_date: string | null;
  result: string | null;
  created_at: string;
}

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'UFC', 'Soccer'];
const PICK_TYPES = [
  { value: 'game', label: 'Game (Moneyline/Spread)' },
  { value: 'over_under', label: 'Over/Under (Totals)' },
  { value: 'player_prop', label: 'Player Prop' },
];
const PROP_TYPES = ['Points', 'Rebounds', 'Assists', 'Threes', 'Strikeouts', 'Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Goals', 'Saves', 'Hits', 'RBIs'];
const DIRECTIONS = ['Over', 'Under'];

export function AdminPickBuilder() {
  const [picks, setPicks] = useState<AdminPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [pickType, setPickType] = useState('game');
  const [sport, setSport] = useState('NBA');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [propType, setPropType] = useState('');
  const [line, setLine] = useState('');
  const [direction, setDirection] = useState('');
  const [pick, setPick] = useState('');
  const [odds, setOdds] = useState('-110');
  const [confidence, setConfidence] = useState('70');
  const [notes, setNotes] = useState('');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchPicks();
  }, []);

  const fetchPicks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('admin_picks')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPicks(data as AdminPick[]);
    if (error) toast.error('Failed to load picks');
    setIsLoading(false);
  };

  const resetForm = () => {
    setHomeTeam('');
    setAwayTeam('');
    setPlayerName('');
    setPropType('');
    setLine('');
    setDirection('');
    setPick('');
    setOdds('-110');
    setConfidence('70');
    setNotes('');
    setGameDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pick.trim()) { toast.error('Pick is required'); return; }
    setIsSubmitting(true);

    const payload: Record<string, unknown> = {
      pick_type: pickType,
      sport,
      pick: pick.trim(),
      odds: odds ? parseInt(odds) : -110,
      confidence: confidence ? parseInt(confidence) : 70,
      notes: notes.trim() || null,
      game_date: gameDate || null,
    };

    if (pickType === 'game' || pickType === 'over_under') {
      payload.home_team = homeTeam.trim() || null;
      payload.away_team = awayTeam.trim() || null;
    }
    if (pickType === 'over_under') {
      payload.line = line ? parseFloat(line) : null;
      payload.direction = direction || null;
    }
    if (pickType === 'player_prop') {
      payload.player_name = playerName.trim() || null;
      payload.prop_type = propType || null;
      payload.line = line ? parseFloat(line) : null;
      payload.direction = direction || null;
      payload.home_team = homeTeam.trim() || null;
      payload.away_team = awayTeam.trim() || null;
    }

    const { error } = await supabase.from('admin_picks').insert(payload as any);
    if (error) {
      toast.error('Failed to create pick');
      console.error(error);
    } else {
      toast.success('Pick created!');
      resetForm();
      fetchPicks();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('admin_picks').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Pick deleted'); fetchPicks(); }
  };

  const handleSetResult = async (id: string, result: string) => {
    const { error } = await supabase.from('admin_picks').update({ result }).eq('id', id);
    if (error) toast.error('Failed to update result');
    else { toast.success(`Marked as ${result}`); fetchPicks(); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Create Pick Form */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Build a Pick
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Pick Type</label>
                <Select value={pickType} onValueChange={setPickType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PICK_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Sport</label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPORTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Game Date</label>
                <Input type="date" value={gameDate} onChange={e => setGameDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Home Team</label>
                <Input placeholder="e.g. Lakers" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Away Team</label>
                <Input placeholder="e.g. Celtics" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} />
              </div>
            </div>

            {pickType === 'player_prop' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Player Name</label>
                  <Input placeholder="e.g. LeBron James" value={playerName} onChange={e => setPlayerName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Prop Type</label>
                  <Select value={propType} onValueChange={setPropType}>
                    <SelectTrigger><SelectValue placeholder="Select prop" /></SelectTrigger>
                    <SelectContent>
                      {PROP_TYPES.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(pickType === 'over_under' || pickType === 'player_prop') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Line</label>
                  <Input type="number" step="0.5" placeholder="e.g. 215.5" value={line} onChange={e => setLine(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Direction</label>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger><SelectValue placeholder="Over / Under" /></SelectTrigger>
                    <SelectContent>
                      {DIRECTIONS.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Pick (your call)</label>
                <Input placeholder="e.g. Lakers -3.5, Over 215.5" value={pick} onChange={e => setPick(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Odds</label>
                <Input type="number" placeholder="-110" value={odds} onChange={e => setOdds(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Confidence %</label>
                <Input type="number" min="0" max="100" placeholder="70" value={confidence} onChange={e => setConfidence(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Notes</label>
              <Input placeholder="Any reasoning or context..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <Button type="submit" disabled={isSubmitting || !pick.trim()}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Pick
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Picks List */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Your Picks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Matchup / Player</TableHead>
                    <TableHead>Pick</TableHead>
                    <TableHead>Odds</TableHead>
                    <TableHead>Conf.</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {picks.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {p.game_date ? formatDate(p.game_date) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {p.pick_type === 'over_under' ? 'O/U' : p.pick_type === 'player_prop' ? 'Prop' : 'Game'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{p.sport}</TableCell>
                      <TableCell className="text-sm">
                        {p.pick_type === 'player_prop' ? (
                          <div>
                            <span className="font-medium">{p.player_name}</span>
                            {p.prop_type && <span className="text-muted-foreground"> — {p.prop_type}</span>}
                            {p.home_team && p.away_team && (
                              <div className="text-xs text-muted-foreground">{p.away_team} @ {p.home_team}</div>
                            )}
                          </div>
                        ) : (
                          <span>{p.away_team && p.home_team ? `${p.away_team} @ ${p.home_team}` : '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.direction && p.line != null ? `${p.direction} ${p.line}` : p.pick}
                        {p.direction && p.line != null && p.pick !== `${p.direction} ${p.line}` && (
                          <div className="text-xs text-muted-foreground">{p.pick}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{p.odds && p.odds > 0 ? `+${p.odds}` : p.odds}</TableCell>
                      <TableCell className="text-sm">{p.confidence}%</TableCell>
                      <TableCell>
                        {p.result ? (
                          <Badge
                            variant={p.result === 'win' ? 'default' : p.result === 'loss' ? 'destructive' : 'secondary'}
                            className={p.result === 'win' ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
                          >
                            {p.result.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!p.result && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-500" onClick={() => handleSetResult(p.id, 'win')} title="Mark Win">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleSetResult(p.id, 'loss')} title="Mark Loss">
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => handleSetResult(p.id, 'push')} title="Mark Push">
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(p.id)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {picks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No picks yet — create your first one above
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
