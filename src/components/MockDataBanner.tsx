import { AlertTriangle, Info } from 'lucide-react';

export const MockDataBanner = () => {
  return (
    <div className="bg-warning/10 border-b border-warning/20">
      <div className="container py-2 flex items-center justify-center gap-2 text-xs text-warning">
        <AlertTriangle className="h-3 w-3" />
        <span className="font-medium">Mock Data Mode</span>
        <span className="hidden sm:inline text-warning/70">— Add API keys to connect live data sources</span>
      </div>
    </div>
  );
};

export const DataTimestamp = ({ timestamp }: { timestamp: string }) => {
  const date = new Date(timestamp);
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Info className="h-3 w-3" />
      <span>Data last updated: {date.toLocaleString()}</span>
    </div>
  );
};
