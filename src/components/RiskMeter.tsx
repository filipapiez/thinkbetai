import { RiskAssessment, OddsData } from '@/lib/mockData';
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RiskMeterProps {
  risk: RiskAssessment;
  odds?: OddsData;
  compact?: boolean;
}

// Calculate volatility based on line movement and other factors
const calculateVolatility = (risk: RiskAssessment, odds?: OddsData): { 
  level: 'Low' | 'Medium' | 'High'; 
  adjustedReasons: string[];
  lineMovementMagnitude: number;
  lineMovementCause?: string;
} => {
  let lineMovementMagnitude = 0;
  let lineMovementCause: string | undefined;
  
  if (odds?.lineMovement) {
    lineMovementMagnitude = Math.abs(odds.lineMovement.current.home - odds.lineMovement.opening.home);
    
    // Determine cause of line movement
    if (lineMovementMagnitude >= 15) {
      lineMovementCause = 'Sharp money or news-driven';
    } else if (lineMovementMagnitude >= 10) {
      lineMovementCause = 'Moderate public action';
    } else if (lineMovementMagnitude >= 5) {
      lineMovementCause = 'Early market adjustment';
    }
  }
  
  // Key rule: Meaningful line movement cannot be labeled "Low Volatility"
  let adjustedLevel = risk.level;
  const adjustedReasons = [...risk.reasons];
  
  if (lineMovementMagnitude >= 15 && risk.level === 'Low') {
    adjustedLevel = 'High';
    adjustedReasons.unshift(`Sharp line movement (${lineMovementMagnitude} cents)`);
  } else if (lineMovementMagnitude >= 10 && risk.level === 'Low') {
    adjustedLevel = 'Medium';
    adjustedReasons.unshift(`Moderate line movement (${lineMovementMagnitude} cents)`);
  } else if (lineMovementMagnitude >= 5 && risk.level === 'Low') {
    adjustedLevel = 'Medium';
    adjustedReasons.unshift(`Line has moved since open`);
  }
  
  // Check for injury uncertainty contradictions
  const hasInjuryUncertainty = risk.reasons.some(r => 
    r.toLowerCase().includes('questionable') || 
    r.toLowerCase().includes('uncertain')
  );
  
  if (hasInjuryUncertainty && adjustedLevel === 'Low') {
    adjustedLevel = 'Medium';
    if (!adjustedReasons.some(r => r.includes('injury'))) {
      adjustedReasons.push('Injury uncertainty factor');
    }
  }
  
  return {
    level: adjustedLevel,
    adjustedReasons,
    lineMovementMagnitude,
    lineMovementCause,
  };
};

export const RiskMeter = ({ risk, odds, compact = false }: RiskMeterProps) => {
  const { level, adjustedReasons, lineMovementMagnitude, lineMovementCause } = calculateVolatility(risk, odds);
  
  const getConfig = () => {
    switch (level) {
      case 'Low':
        return {
          icon: CheckCircle,
          gradient: 'risk-low',
          textColor: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          percentage: 25,
          description: 'Stable lines, clear signals',
        };
      case 'Medium':
        return {
          icon: AlertCircle,
          gradient: 'risk-medium',
          textColor: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          percentage: 55,
          description: 'Moderate movement/uncertainty',
        };
      case 'High':
        return {
          icon: AlertTriangle,
          gradient: 'risk-high',
          textColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          percentage: 85,
          description: 'Sharp swings/conflicting indicators',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border`}>
        <Icon className={`h-4 w-4 ${config.textColor}`} />
        <span className={`text-sm font-semibold ${config.textColor}`}>{level} Volatility</span>
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
        <div className="text-right">
          <span className={`text-lg font-bold ${config.textColor}`}>{level}</span>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
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

      {/* Line Movement Badge (if applicable) */}
      {lineMovementMagnitude >= 5 && lineMovementCause && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant={lineMovementMagnitude >= 15 ? 'destructive' : 'warning'} className="text-xs">
            {lineMovementMagnitude >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {lineMovementMagnitude}¢ movement
          </Badge>
          <span className="text-xs text-muted-foreground">{lineMovementCause}</span>
        </div>
      )}

      {/* Reasons */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Contributing Factors:</h4>
        <ul className="space-y-1.5">
          {adjustedReasons.map((reason, index) => (
            <li key={index} className="text-sm flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${config.gradient} shrink-0`} />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Volatility Scale Explanation */}
      <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <p>Volatility based on: line movement • injury/news uncertainty • performance variance • market disagreement</p>
      </div>
    </div>
  );
};
