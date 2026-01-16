import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useActiveBets } from '@/hooks/useActiveBets';

interface AddBetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 'UFC', 'Soccer', 'Tennis', 'Golf'];
const PICK_TYPES = ['moneyline', 'spread', 'total', 'prop'];

export function AddBetDialog({ open, onOpenChange }: AddBetDialogProps) {
  const { addBet, isAdding } = useActiveBets();
  
  const [formData, setFormData] = useState({
    game_id: '',
    sport: 'NBA',
    home_team: '',
    away_team: '',
    pick: '',
    pick_type: 'moneyline',
    pick_value: '',
    odds: '-110',
    confidence: '70',
    edge: '2.5',
    game_time: new Date(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const gameId = formData.game_id || `${formData.home_team}-${formData.away_team}-${format(formData.game_time, 'yyyyMMdd')}`.toLowerCase().replace(/\s+/g, '-');
    
    addBet({
      game_id: gameId,
      sport: formData.sport,
      home_team: formData.home_team,
      away_team: formData.away_team,
      pick: formData.pick,
      pick_type: formData.pick_type,
      pick_value: formData.pick_value ? parseFloat(formData.pick_value) : null,
      odds: parseInt(formData.odds),
      confidence: parseInt(formData.confidence),
      edge: parseFloat(formData.edge),
      game_time: formData.game_time.toISOString(),
    });
    
    onOpenChange(false);
    setFormData({
      game_id: '',
      sport: 'NBA',
      home_team: '',
      away_team: '',
      pick: '',
      pick_type: 'moneyline',
      pick_value: '',
      odds: '-110',
      confidence: '70',
      edge: '2.5',
      game_time: new Date(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Bet to Track</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) => setFormData({ ...formData, sport: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pick_type">Pick Type</Label>
              <Select
                value={formData.pick_type}
                onValueChange={(value) => setFormData({ ...formData, pick_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PICK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="away_team">Away Team</Label>
              <Input
                id="away_team"
                value={formData.away_team}
                onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
                placeholder="e.g. Lakers"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_team">Home Team</Label>
              <Input
                id="home_team"
                value={formData.home_team}
                onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
                placeholder="e.g. Celtics"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pick">Pick</Label>
              <Input
                id="pick"
                value={formData.pick}
                onChange={(e) => setFormData({ ...formData, pick: e.target.value })}
                placeholder="e.g. Lakers ML or Over 220.5"
                required
              />
            </div>
            {(formData.pick_type === 'spread' || formData.pick_type === 'total') && (
              <div className="space-y-2">
                <Label htmlFor="pick_value">Line Value</Label>
                <Input
                  id="pick_value"
                  type="number"
                  step="0.5"
                  value={formData.pick_value}
                  onChange={(e) => setFormData({ ...formData, pick_value: e.target.value })}
                  placeholder="e.g. -3.5 or 220.5"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odds">Odds</Label>
              <Input
                id="odds"
                type="number"
                value={formData.odds}
                onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                placeholder="-110"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence %</Label>
              <Input
                id="confidence"
                type="number"
                min="1"
                max="100"
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edge">Edge %</Label>
              <Input
                id="edge"
                type="number"
                step="0.1"
                value={formData.edge}
                onChange={(e) => setFormData({ ...formData, edge: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Game Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.game_time && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.game_time ? format(formData.game_time, "PPP p") : "Select date and time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.game_time}
                  onSelect={(date) => date && setFormData({ ...formData, game_time: date })}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Input
                    type="time"
                    value={format(formData.game_time, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(formData.game_time);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setFormData({ ...formData, game_time: newDate });
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Bet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
