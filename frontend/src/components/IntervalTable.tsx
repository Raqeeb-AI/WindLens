import React, { useState } from 'react';
import type { DecisionInterval } from '../types/api';
import { Download, ArrowUpDown } from 'lucide-react';

interface IntervalTableProps {
  intervals: DecisionInterval[];
  deliveryDate: string;
}

export const IntervalTable: React.FC<IntervalTableProps> = ({ intervals, deliveryDate }) => {
  const [sortField, setSortField] = useState<keyof DecisionInterval>('hour_of_day');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: keyof DecisionInterval) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedIntervals = [...intervals].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const exportCsv = () => {
    const headers = [
      'delivery_start_utc',
      'hour_of_day',
      'forecast_mw',
      'actual_mw',
      'error_mw',
      'abs_error_mw',
      'percentage_error',
      'direction',
      'publish_time_utc',
      'age_at_cutoff_hours',
      'lead_time_hours',
      'baseline_mw'
    ];
    const rows = intervals.map((i) => [
      i.start_time,
      i.hour_of_day,
      i.forecast_mw,
      i.actual_mw,
      i.error_mw,
      i.abs_error_mw,
      i.percentage_error ?? '',
      i.error_direction,
      i.publish_time,
      i.age_at_cutoff_hours,
      i.lead_time_hours,
      i.baseline_mw ?? ''
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `windlens_intervals_${deliveryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden mb-8">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-text-primary">
            Hourly Interval Audit & Reconciliation Table
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Full 24-hour delivery interval breakdown for <strong className="text-text-primary">{deliveryDate}</strong>.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="inline-flex items-center px-3 py-1.5 rounded border border-border text-xs font-medium bg-surface-subtle hover:bg-border transition-colors text-text-secondary hover:text-text-primary"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-text-tertiary" />
          Export Delivery Day CSV
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-subtle text-text-secondary border-b border-border uppercase font-semibold tracking-wider text-[11px]">
              <th className="py-2.5 px-3 cursor-pointer hover:text-text-primary" onClick={() => handleSort('hour_of_day')}>
                <div className="flex items-center space-x-1">
                  <span>Interval (UTC)</span>
                  <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary" onClick={() => handleSort('forecast_mw')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Forecast (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary" onClick={() => handleSort('actual_mw')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Actual (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary" onClick={() => handleSort('error_mw')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Error (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Direction</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary" onClick={() => handleSort('lead_time_hours')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Lead Time</span>
                  <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Age at Cutoff</th>
              <th className="py-2.5 px-3">Selected Publish Run</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-subtle">
            {sortedIntervals.map((item) => {
              const isOver = item.error_direction === 'OVERFORECAST';
              const isUnder = item.error_direction === 'UNDERFORECAST';

              return (
                <tr key={item.start_time} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-text-primary whitespace-nowrap">
                    {String(item.hour_of_day).padStart(2, '0')}:00 – {String((item.hour_of_day + 1) % 24).padStart(2, '0')}:00
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium text-text-primary whitespace-nowrap">
                    {item.forecast_mw.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-text-primary whitespace-nowrap">
                    {item.actual_mw.toLocaleString()}
                  </td>
                  <td className={`py-2.5 px-3 text-right tabular-nums font-semibold whitespace-nowrap ${
                    isOver ? 'text-overforecast' : isUnder ? 'text-underforecast' : 'text-text-primary'
                  }`}>
                    {item.error_mw > 0 ? `+${item.error_mw.toFixed(1)}` : item.error_mw.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      isOver
                        ? 'bg-overforecast/10 text-overforecast border-overforecast/20'
                        : isUnder
                        ? 'bg-underforecast/10 text-underforecast border-underforecast/20'
                        : 'bg-surface-subtle text-text-secondary border-border'
                    }`}>
                      {item.error_direction}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-text-secondary whitespace-nowrap">
                    {item.lead_time_hours.toFixed(1)}h
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-text-tertiary whitespace-nowrap">
                    {item.age_at_cutoff_hours.toFixed(1)}h old
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-text-tertiary whitespace-nowrap">
                    {item.publish_time.replace('T', ' ').replace('Z', ' UTC')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
