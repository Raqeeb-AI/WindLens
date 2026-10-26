import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import type { DailyBreakdownItem } from '../types/api';

interface DailyErrorChartProps {
  data: DailyBreakdownItem[];
  cutoffTime: string;
}

export const DailyErrorChart: React.FC<DailyErrorChartProps> = ({ data, cutoffTime }) => {
  const chartData = data.map((d) => ({
    dateLabel: d.decision_date.slice(5), // "01-15"
    fullDate: d.decision_date,
    deliveryDate: d.delivery_date,
    mae: d.mae_mw,
    bias: d.bias_mw,
    baselineMae: d.baseline_mae_mw,
    actualMean: d.mean_actual_mw,
    forecastMean: d.mean_forecast_mw,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;

    return (
      <div className="bg-surface border border-border p-3.5 rounded-lg shadow-lg text-xs max-w-xs z-50">
        <div className="font-semibold text-text-primary border-b border-border pb-1.5 mb-2">
          Decision Date: {d.fullDate} (Delivery: {d.deliveryDate})
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-text-secondary">Mean Absolute Error (MAE):</span>
            <span className="font-bold tabular-nums text-text-primary">{d.mae} MW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Forecast Bias (Mean Error):</span>
            <span className={`font-bold tabular-nums ${d.bias > 0 ? 'text-overforecast' : 'text-underforecast'}`}>
              {d.bias > 0 ? `+${d.bias}` : d.bias} MW ({d.bias > 0 ? 'Overforecast' : 'Underforecast'})
            </span>
          </div>
          {d.baselineMae && (
            <div className="flex justify-between text-text-tertiary">
              <span>Persistence Baseline MAE:</span>
              <span className="tabular-nums">{d.baselineMae} MW</span>
            </div>
          )}
          <div className="pt-1.5 border-t border-surface-subtle flex justify-between text-[11px] text-text-secondary">
            <span>Mean Actual / Forecast:</span>
            <span className="tabular-nums">{d.actualMean} / {d.forecastMean} MW</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card mb-6">
      <div className="mb-4 pb-3 border-b border-border">
        <h3 className="font-serif text-lg font-bold text-text-primary">
          Daily Forecast Accuracy across January 2026 Decisions
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Day-ahead evaluation evaluated at {cutoffTime} Europe/London cutoff. Bars represent daily MAE; orange points denote Bias.
        </p>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D7" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              stroke="#69675F"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
              label={{ value: 'Decision Date (January 2026)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#69675F' }}
            />
            <YAxis
              stroke="#69675F"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
              tickFormatter={(v) => `${v}`}
              label={{ value: 'Error (MW)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#69675F' }}
            />
            <ReferenceLine y={0} stroke="#20201D" strokeWidth={1} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />

            <Bar
              dataKey="mae"
              name="Daily MAE (MW)"
              fill="#D95635"
              opacity={0.85}
              radius={[3, 3, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="bias"
              name="Forecast Bias (MW)"
              stroke="#A96E13"
              strokeWidth={2}
              dot={{ r: 3, fill: '#A96E13' }}
            />
            <Line
              type="monotone"
              dataKey="baselineMae"
              name="Day-Ahead Baseline MAE (MW)"
              stroke="#7C7971"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
