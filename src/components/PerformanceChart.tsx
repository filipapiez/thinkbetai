import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp, Target, Award } from 'lucide-react';
import { platformStats, PerformanceData } from '@/lib/mockData';

interface PerformanceChartProps {
  data: PerformanceData[];
  title?: string;
}

export const PerformanceChart = ({ data, title = "Prediction Performance" }: PerformanceChartProps) => {
  // Calculate accuracy from data
  const accurateCount = data.filter(d => Math.abs(d.predicted - d.actual) < 10).length;
  const accuracy = Math.round((accurateCount / data.length) * 100);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>
              Predicted vs actual outcomes over time
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{platformStats.winRate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">{platformStats.streakCurrent}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[40, 80]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === 'predicted' ? 'Predicted' : 'Actual']}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--primary))" 
                fill="url(#predictedGradient)"
                strokeWidth={2}
                name="Predicted Win %"
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#10b981" 
                fill="url(#actualGradient)"
                strokeWidth={2}
                name="Actual Result"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Predictions</span>
            </div>
            <p className="text-xl font-bold">{platformStats.totalPredictions.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-muted-foreground">Correct</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{platformStats.correctPredictions.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-muted-foreground">Best Streak</span>
            </div>
            <p className="text-xl font-bold text-amber-400">{platformStats.streakBest}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
