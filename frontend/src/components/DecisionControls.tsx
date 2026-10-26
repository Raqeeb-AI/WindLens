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
  { label: '07:00 (Early Morning)', value: '07:00' },
  { label: '09:00 (Default Assumption)', value: '09:00' },
  { label: '12:00 (Midday Gate)', value: '12:00' },
  { label: '16:00 (Afternoon)', value: '16:00' },
  { label: '22:00 (Night Cutoff)', value: '22:00' },
];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-end">
        {/* Decision Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-forecast" />
              1. Procurement Decision Date (Day D)
            </span>
          </label>
          <div className="relative">
            <select
              value={decisionDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d} (Decision) → Delivery: {new Date(new Date(d).getTime() + 86400000).toISOString().slice(0, 10)}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1.5 text-xs text-text-tertiary">
            Physical Delivery Target: <strong className="text-text-primary font-medium">{deliveryDate}</strong> (00:00–23:00 UTC)
          </p>
        </div>

        {/* Cutoff Selector */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-forecast" />
              2. Procurement Decision Cutoff (Europe/London)
            </span>
          </label>
          <select
            value={cutoffTime}
            onChange={(e) => onCutoffChange(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring"
          >
            {PRESET_CUTOFFS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-text-tertiary">
            Cutoff boundary timestamp: <span className="font-mono">{decisionDate}T{cutoffTime}:00Z</span>
          </p>
        </div>

        {/* Quick Date Presets */}
        <div>
          <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Recommended Case Studies (Jan 2026)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Jan 15 (Typical)', date: '2026-01-15' },
              { label: 'Jan 05 (High Wind)', date: '2026-01-05' },
              { label: 'Jan 19 (Low Wind)', date: '2026-01-19' },
              { label: 'Jan 28 (Volatile)', date: '2026-01-28' },
            ].map((p) => (
              <button
                key={p.date}
                onClick={() => onDateChange(p.date)}
                className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${
                  decisionDate === p.date
                    ? 'bg-forecast/10 text-forecast border-forecast/30 font-medium'
                    : 'bg-surface-subtle text-text-secondary border-border hover:text-text-primary hover:border-border-strong'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assumption Disclosure Banner */}
      <div className="mt-4 pt-3.5 border-t border-border/60 flex items-start space-x-2 text-xs text-text-secondary bg-surface-subtle/60 p-2.5 rounded">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-text-primary">Cutoff Assumption Notice:</strong> The default cutoff of D-1 at 09:00 Europe/London is an illustrative procurement modeling assumption, not a confirmed market-wide gate closure. Any forecast published after {cutoffTime} is strictly excluded by the selection rule.
        </p>
      </div>
    </div>
  );
};
