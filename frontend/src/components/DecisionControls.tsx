import React from 'react';
import { CalendarPopover } from './CalendarPopover';
import { Clock, RotateCcw, Info, ArrowRight, ChevronDown } from 'lucide-react';

interface DecisionControlsProps {
  decisionDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  cutoffTime: string;
  onCutoffChange: (cutoff: string) => void;
  deliveryDate: string;
  onReset: () => void;
}

const SUPPORTED_CUTOFFS = [
  { value: '07:00', label: '07:00 · Europe/London' },
  { value: '09:00', label: '09:00 · Europe/London (Default)' },
  { value: '12:00', label: '12:00 · Europe/London' },
  { value: '16:00', label: '16:00 · Europe/London' },
  { value: '22:00', label: '22:00 · Europe/London' },
];

export const DecisionControls: React.FC<DecisionControlsProps> = ({
  decisionDate,
  onDateChange,
  availableDates,
  cutoffTime,
  onCutoffChange,
  deliveryDate,
  onReset,
}) => {
  // Format delivery date nicely: "Fri, 16 Jan 2026"
  const formatDeliveryDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dateStr;
    }
  };

  const isDefault = decisionDate === '2026-01-15' && cutoffTime === '09:00';

  return (
    <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border shadow-card mb-6 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Decision Date Picker */}
          <div>
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
              Decision Date
            </label>
            <CalendarPopover
              selectedDate={decisionDate}
              onSelectDate={onDateChange}
              availableDates={availableDates}
            />
          </div>

          {/* Delivery Arrow + Target */}
          <div className="hidden sm:flex items-center pt-4 text-text-tertiary">
            <ArrowRight className="w-4 h-4 mx-1 text-text-tertiary/60" />
          </div>

          {/* Derived Physical Delivery Day */}
          <div>
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
              Physical Delivery (D+1)
            </label>
            <div className="inline-flex items-center px-3 py-1.5 rounded-md border border-border bg-surface-subtle/50 text-xs font-semibold text-text-primary shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-underforecast pulse-glow mr-2 flex-shrink-0" />
              <span>{formatDeliveryDisplay(deliveryDate)}</span>
            </div>
          </div>

          {/* Cutoff Selector */}
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                Decision Cutoff
              </label>
              <div className="group relative cursor-help">
                <Info className="w-3 h-3 text-text-tertiary hover:text-text-primary transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-52 p-2.5 rounded-lg bg-text-primary text-surface text-[10px] leading-tight shadow-xl z-50 pointer-events-none">
                  09:00 Europe/London is an illustrative procurement modelling assumption, not an official statutory market gate closure.
                </div>
              </div>
            </div>

            <div className="relative inline-flex items-center">
              <Clock className="w-3.5 h-3.5 text-text-tertiary absolute left-2.5 pointer-events-none" />
              <select
                value={cutoffTime}
                onChange={(e) => onCutoffChange(e.target.value)}
                className="bg-surface hover:bg-surface-subtle/80 border border-border text-text-primary text-xs font-semibold rounded-md pl-8 pr-7 py-1.5 focus:ring-2 focus:ring-forecast/30 focus:border-forecast focus:outline-none transition-all appearance-none cursor-pointer shadow-xs"
              >
                {SUPPORTED_CUTOFFS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-text-tertiary absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right Action: Reset Button & Caveat */}
        <div className="flex items-center justify-between lg:justify-end space-x-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
          <span className="text-[11px] text-text-tertiary hidden xl:inline">
            09:00 is an illustrative modelling cutoff.
          </span>
          {!isDefault && (
            <button
              type="button"
              onClick={onReset}
              className="touch-press animate-fade-in-up inline-flex items-center space-x-1.5 text-xs font-medium text-text-secondary hover:text-forecast px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-subtle transition-all active:scale-95 shadow-2xs"
              title="Reset to 15 Jan 2026, 09:00"
            >
              <RotateCcw className="w-3 h-3 text-text-tertiary group-hover:text-forecast" />
              <span>Reset to default</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
