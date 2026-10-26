import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import type { VintageResponse } from '../types/api';
import { GitBranch, ChevronDown, ChevronUp, TrendingDown } from 'lucide-react';

interface VintageFanChartProps {
  vintageData: VintageResponse;
}

const VINTAGE_COLORS = [
  '#A96E13', // 07:00 (Amber)
  '#D95635', // 09:00 (Vermilion - Default)
  '#267568', // 12:00 (Teal)
  '#4E6B7A', // 16:00 (Slate blue)
  '#7A4B76', // 22:00 (Plum)
];

export const VintageFanChart: React.FC<VintageFanChartProps> = ({ vintageData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCutoffs, setSelectedCutoffs] = useState<string[]>(
    vintageData.vintages.map((v) => v.cutoff_time)
  );

  const toggleCutoff = (cutoff: string) => {
    if (selectedCutoffs.includes(cutoff)) {
      if (selectedCutoffs.length > 1) {
        setSelectedCutoffs(selectedCutoffs.filter((c) => c !== cutoff));
      }
    } else {
      setSelectedCutoffs([...selectedCutoffs, cutoff]);
    }
  };

  // Build unified chart points across hours 0..23
  const chartPoints = Array.from({ length: 24 }, (_, h) => {
    const point: any = {
      hourLabel: `${String(h).padStart(2, '0')}:00`,
    };

    const actualItem = vintageData.actuals.find((a) => a.hour_of_day === h);
    if (actualItem) {
      point.actual = actualItem.actual_mw;
    }

    vintageData.vintages.forEach((v) => {
      const match = v.series.find((s) => s.hour_of_day === h);
      if (match) {
        point[`cutoff_${v.cutoff_time}`] = match.forecast_mw;
      }
    });

    return point;
  });

  return (
    <div className="bg-surface rounded-xl border border-border shadow-card mb-6 overflow-hidden">
      {/* Header with Collapsible Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="touch-press w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-surface-subtle/50 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-forecast/10 border border-forecast/20 flex items-center justify-center text-forecast flex-shrink-0">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif text-base font-bold text-text-primary">
                Forecast Revision History & Cutoff Sensitivity
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-subtle text-text-tertiary border border-border font-semibold">
                Secondary Analysis
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Inspect how the wind forecast changed across earlier and later publication cutoffs for {vintageData.metadata.delivery_date}.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium text-text-secondary">
          <span>{isOpen ? 'Collapse view' : 'Expand view'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="animate-fade-in-up p-4 sm:p-5 pt-0 border-t border-border/60">
          {/* Controls: Active Vintage Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 mb-3 border-b border-surface-subtle">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Toggle Cutoff Runs:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {vintageData.vintages.map((v, idx) => {
                const isSelected = selectedCutoffs.includes(v.cutoff_time);
                const color = VINTAGE_COLORS[idx % VINTAGE_COLORS.length];

                return (
                  <button
                    key={v.cutoff_time}
                    type="button"
                    onClick={() => toggleCutoff(v.cutoff_time)}
                    className={`touch-press text-xs px-2.5 py-1 rounded-md border flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-surface-subtle border-border-strong text-text-primary font-medium shadow-2xs'
                        : 'bg-background border-border text-text-tertiary line-through opacity-60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span>Cutoff {v.cutoff_time}</span>
                    <span className="text-[10px] text-text-tertiary ml-1 font-mono">
                      (MAE: {v.mae_mw} MW)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D7" vertical={false} />
                <XAxis
                  dataKey="hourLabel"
                  stroke="#69675F"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E0D7' }}
                  label={{ value: 'Delivery Interval (UTC)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#69675F' }}
                />
                <YAxis
                  stroke="#69675F"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E0D7' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#69675F' }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
                  labelFormatter={(label) => `Delivery Interval: ${label} UTC`}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E0D7', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />

                {/* Actual Generation Reference Line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Observed Actual (FUELHH WIND)"
                  stroke="#252622"
                  strokeWidth={2.8}
                  dot={{ r: 2 }}
                />

                {/* Selected Cutoff Vintage Runs */}
                {vintageData.vintages.map((v, idx) => {
                  if (!selectedCutoffs.includes(v.cutoff_time)) return null;
                  const color = VINTAGE_COLORS[idx % VINTAGE_COLORS.length];
                  const isDefault = v.cutoff_time === '09:00';

                  return (
                    <Line
                      key={v.cutoff_time}
                      type="monotone"
                      dataKey={`cutoff_${v.cutoff_time}`}
                      name={`Cutoff ${v.cutoff_time}${isDefault ? ' (Default)' : ''}`}
                      stroke={color}
                      strokeWidth={isDefault ? 2.5 : 1.5}
                      strokeDasharray={isDefault ? undefined : '3 3'}
                      dot={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Practical Insight Callout */}
          <div className="mt-3 text-xs text-text-secondary bg-surface-subtle p-3 rounded-md flex items-center justify-between border border-border">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-underforecast flex-shrink-0" />
              <span>
                <strong>Procurement Takeaway:</strong> As cutoff time advances closer to physical delivery (from 07:00 to 22:00), forecast revisions typically reduce MAE and track generation ramps more closely.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
