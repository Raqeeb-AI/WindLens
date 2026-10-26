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
import { GitBranch, TrendingDown } from 'lucide-react';

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

    // Actual
    const actualItem = vintageData.actuals.find((a) => a.hour_of_day === h);
    if (actualItem) {
      point.actual = actualItem.actual_mw;
    }

    // Each vintage run
    vintageData.vintages.forEach((v) => {
      const match = v.series.find((s) => s.hour_of_day === h);
      if (match) {
        point[`cutoff_${v.cutoff_time}`] = match.forecast_mw;
      }
    });

    return point;
  });

  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-forecast" />
            <h3 className="font-serif text-lg font-bold text-text-primary">
              Forecast Vintage Evolution (Cutoff Sensitivity)
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            How forecasts published at different cutoffs converged toward actual generation for {vintageData.metadata.delivery_date}.
          </p>
        </div>

        {/* Vintage Toggle Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:mt-0">
          {vintageData.vintages.map((v, idx) => {
            const isSelected = selectedCutoffs.includes(v.cutoff_time);
            const color = VINTAGE_COLORS[idx % VINTAGE_COLORS.length];

            return (
              <button
                key={v.cutoff_time}
                onClick={() => toggleCutoff(v.cutoff_time)}
                className={`text-xs px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-colors ${
                  isSelected
                    ? 'bg-surface-subtle border-border-strong text-text-primary font-medium'
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

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D7" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              stroke="#69675F"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
            />
            <YAxis
              stroke="#69675F"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
              labelFormatter={(label) => `Delivery Interval: ${label} UTC`}
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E0D7', borderRadius: '8px', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />

            {/* Actual Generation Line */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Generation (Observed)"
              stroke="#252622"
              strokeWidth={2.8}
              dot={{ r: 2 }}
            />

            {/* Active Vintages */}
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

      {/* Insight Note */}
      <div className="mt-3 text-xs text-text-secondary bg-surface-subtle p-3 rounded flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingDown className="w-4 h-4 text-underforecast flex-shrink-0" />
          <span>
            Notice how forecast error typically diminishes and aligns closer with actual generation as the cutoff moves from early morning (07:00) to evening (22:00).
          </span>
        </div>
      </div>
    </div>
  );
};
