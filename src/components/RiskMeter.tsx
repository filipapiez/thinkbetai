import { RiskAssessment } from '@/lib/mockData';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface RiskMeterProps {
  risk: RiskAssessment;
  compact?: boolean;
}

export const RiskMeter = ({ risk, compact = false }: RiskMeterProps) => {
  const getConfig = () => {
    switch (risk.level) {
      case 'Low':
        return {
          icon: CheckCircle,
          gradient: 'risk-low',
          textColor: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          percentage: 25,
        };
      case 'Medium':
        return {
          icon: AlertCircle,
          gradient: 'risk-medium',
          textColor: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          percentage: 55,
        };
      case 'High':
        return {
          icon: AlertTriangle,
          gradient: 'risk-high',
          textColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          percentage: 85,
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border`}>
        <Icon className={`h-4 w-4 ${config.textColor}`} />
        <span className={`text-sm font-semibold ${config.textColor}`}>{risk.level} Volatility</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.textColor}`} />
          <h3 className="font-semibold">Risk / Volatility</h3>
        </div>
        <span className={`text-lg font-bold ${config.textColor}`}>{risk.level}</span>
      </div>

      {/* Meter Bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
        <div 
          className={`absolute inset-y-0 left-0 ${config.gradient} rounded-full transition-all duration-500`}
          style={{ width: `${config.percentage}%` }}
        />
        <div className="absolute inset-0 flex">
          <div className="w-1/3 border-r border-background/30" />
          <div className="w-1/3 border-r border-background/30" />
          <div className="w-1/3" />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-4">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>

      {/* Reasons */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Contributing Factors:</h4>
        <ul className="space-y-1.5">
          {risk.reasons.map((reason, index) => (
            <li key={index} className="text-sm flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${config.gradient} shrink-0`} />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
