import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface DecisionControlsProps {
  decisionDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  cutoffTime: string;
  onCutoffChange: (cutoff: string) => void;
  deliveryDate: string;
}

const PRESET_CUTOFFS = [
  { label: '07:00 (Early Morning Run)', value: '07:00' },
  { label: '09:00 (Default Assumption)', value: '09:00' },
  { label: '12:00 (Midday Gate)', value: '12:00' },
  { label: '16:00 (Afternoon Run)', value: '16:00' },
  { label: '22:00 (Evening Cutoff)', value: '22:00' },
];

const CASE_STUDIES = [
  { label: 'Jan 15 (Mid-Month Typical)', date: '2026-01-15', description: 'Moderate wind with steady ramp' },
  { label: 'Jan 05 (High Wind / Storm)', date: '2026-01-05', description: 'Peak generation near 16 GW' },
  { label: 'Jan 19 (Low Wind / Anticyclonic)', date: '2026-01-19', description: 'Low generation under 4 GW' },
  { label: 'Jan 28 (Volatile Ramp)', date: '2026-01-28', description: 'Rapid weather front transition' },
];

function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

export const DecisionControls: React.FC<DecisionControlsProps> = ({
  decisionDate,
  onDateChange,
  availableDates,
  cutoffTime,
  onCutoffChange,
  deliveryDate,
}) => {
  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Decision Date & Target Delivery Date (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Decision Date Selector */}
            <div>
              <label
                htmlFor="decision-date-select"
                className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5"
              >
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-forecast" />
                  Decision Date (Day D)
                </span>
              </label>
              <select
                id="decision-date-select"
                value={decisionDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {formatDisplayDate(d)} ({d})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Physical Delivery Target Display */}
            <div>
              <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Physical Delivery Day (D+1)
              </span>
              <div className="bg-surface-subtle border border-border rounded-md px-3 py-2 text-sm flex items-center justify-between">
                <span className="font-semibold text-text-primary">
                  {formatDisplayDate(deliveryDate)}
                </span>
                <span className="text-[11px] text-text-tertiary font-mono">
                  24h (00:00–23:00 UTC)
                </span>
              </div>
            </div>
          </div>

          {/* Subordinated Case Studies */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-text-tertiary block mb-1.5">
              Case study quick-select:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CASE_STUDIES.map((cs) => (
                <button
                  key={cs.date}
                  type="button"
                  onClick={() => onDateChange(cs.date)}
                  title={cs.description}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    decisionDate === cs.date
                      ? 'bg-forecast/10 text-forecast border-forecast/40 font-semibold'
                      : 'bg-surface-subtle text-text-secondary border-border hover:text-text-primary hover:border-border-strong'
                  }`}
                >
                  {cs.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cutoff Selector & Boundary Details (5 cols) */}
        <div className="lg:col-span-5 space-y-3 lg:border-l lg:border-border/60 lg:pl-5">
          <div>
            <label
              htmlFor="cutoff-time-select"
              className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5"
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-forecast" />
                  Decision Cutoff Time
                </span>
                <span className="text-[11px] font-normal normal-case text-text-tertiary">
                  Europe/London (GMT)
                </span>
              </span>
            </label>
            <select
              id="cutoff-time-select"
              value={cutoffTime}
              onChange={(e) => onCutoffChange(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring cursor-pointer"
            >
              {PRESET_CUTOFFS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-text-tertiary bg-surface-subtle/80 px-2.5 py-1.5 rounded border border-border/70 flex items-center justify-between">
            <span>Cutoff boundary:</span>
            <span className="font-mono text-text-secondary font-medium">
              {decisionDate}T{cutoffTime}:00Z
            </span>
          </div>
        </div>
      </div>

      {/* Cutoff Assumption Disclaimer Banner */}
      <div className="mt-4 pt-3.5 border-t border-border/60 flex items-start space-x-2 text-xs text-text-secondary bg-surface-subtle/40 p-2.5 rounded">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-text-primary">Cutoff Policy:</strong> The default cutoff of D-1 at 09:00 Europe/London is an illustrative modeling assumption for procurement demonstration. The selection rule deterministically excludes any forecast published after {cutoffTime}.
        </p>
      </div>
    </div>
  );
};
