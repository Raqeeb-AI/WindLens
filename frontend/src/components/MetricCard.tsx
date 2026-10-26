import React from 'react';
import { Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'neutral' | 'over' | 'under' | 'success' | 'warning';
  };
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  tooltip
}) => {
  const getBadgeStyle = () => {
    switch (badge?.variant) {
      case 'over':
        return 'bg-overforecast/10 text-overforecast border-overforecast/20';
      case 'under':
        return 'bg-underforecast/10 text-underforecast border-underforecast/20';
      case 'success':
        return 'bg-underforecast/10 text-underforecast border-underforecast/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-surface-subtle text-text-secondary border-border';
    }
  };

  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
          <span className="font-medium tracking-wide uppercase">{title}</span>
          {tooltip && (
            <div className="group relative cursor-help">
              <Info className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-text-primary text-white text-[11px] rounded shadow-lg z-50">
                {tooltip}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl sm:text-3xl font-bold font-serif tabular-nums text-text-primary">
            {value}
          </span>
          {unit && <span className="text-sm font-medium text-text-tertiary">{unit}</span>}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-surface-subtle flex items-center justify-between">
        {subtitle && <span className="text-xs text-text-secondary">{subtitle}</span>}
        {badge && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeStyle()}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};
