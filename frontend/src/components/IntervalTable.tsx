import React, { useState } from 'react';
import type { DecisionInterval } from '../types/api';
import { Download, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface IntervalTableProps {
  intervals: DecisionInterval[];
  deliveryDate: string;
}

export const IntervalTable: React.FC<IntervalTableProps> = ({ intervals, deliveryDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const exportCsv = (e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = [
      'delivery_start_utc',
      'hour_of_day',
      'forecast_mw',
      'actual_mw',
      'error_mw',
      'error_direction',
      'publish_time_utc',
    ];
    const rows = intervals.map((i) => [
      i.start_time,
      i.hour_of_day,
      i.forecast_mw,
      i.actual_mw,
      i.error_mw,
      i.error_direction,
      i.publish_time,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `windlens_hourly_${deliveryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden mb-6 transition-all">
      {/* Collapsible Disclosure Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="touch-press w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-subtle/50 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-text-tertiary transition-transform duration-200" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-tertiary transition-transform duration-200" />
          )}
          <span className="text-xs font-semibold text-text-primary">
            View hourly values ({intervals.length} intervals)
          </span>
          <span className="text-[11px] text-text-tertiary hidden sm:inline">
            · Physical delivery on {deliveryDate}
          </span>
        </div>

        {isOpen && (
          <button
            type="button"
            onClick={exportCsv}
            className={`touch-press inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
              isDownloaded
                ? 'bg-underforecast/10 text-underforecast border-underforecast/30'
                : 'bg-surface hover:bg-surface-subtle border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {isDownloaded ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-underforecast" />
                <span>Downloaded CSV</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5 text-text-tertiary" />
                <span>Export CSV</span>
              </>
            )}
          </button>
        )}
      </button>

      {/* Expanded Table Content */}
      {isOpen && (
        <div className="animate-fade-in-up border-t border-border overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle/60 text-text-secondary border-b border-border text-[11px] font-semibold">
                <th className="py-2.5 px-4">Delivery Time (UTC)</th>
                <th className="py-2.5 px-4 text-right">Forecast (MW)</th>
                <th className="py-2.5 px-4 text-right">Actual (MW)</th>
                <th className="py-2.5 px-4 text-right">Signed Error (MW)</th>
                <th className="py-2.5 px-4 text-center">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-subtle">
              {intervals.map((item) => {
                const isOver = item.error_direction === 'OVERFORECAST';
                const isUnder = item.error_direction === 'UNDERFORECAST';

                return (
                  <tr key={item.start_time} className="hover:bg-surface-subtle/40 transition-colors">
                    <td className="py-2 px-4 font-medium text-text-primary whitespace-nowrap">
                      {String(item.hour_of_day).padStart(2, '0')}:00 – {String((item.hour_of_day + 1) % 24).padStart(2, '0')}:00
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-text-primary whitespace-nowrap font-medium">
                      {item.forecast_mw?.toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-text-primary whitespace-nowrap">
                      {item.actual_mw?.toLocaleString()}
                    </td>
                    <td
                      className={`py-2 px-4 text-right tabular-nums font-semibold whitespace-nowrap ${
                        isOver
                          ? 'text-overforecast'
                          : isUnder
                          ? 'text-underforecast'
                          : 'text-text-primary'
                      }`}
                    >
                      {item.error_mw > 0 ? `+${item.error_mw.toLocaleString()}` : item.error_mw.toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          isOver
                            ? 'bg-overforecast/10 text-overforecast border-overforecast/20'
                            : isUnder
                            ? 'bg-underforecast/10 text-underforecast border-underforecast/20'
                            : 'bg-surface-subtle text-text-secondary border-border'
                        }`}
                      >
                        {isOver ? 'Over-forecast' : isUnder ? 'Under-forecast' : 'Exact'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
