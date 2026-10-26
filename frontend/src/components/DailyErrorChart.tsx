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
  ReferenceLine,
} from 'recharts';
import type { DailyBreakdownItem } from '../types/api';

interface DailyErrorChartProps {
  data: DailyBreakdownItem[];
  cutoffTime: string;
}

export const DailyErrorChart: React.FC<DailyErrorChartProps> = ({ data, cutoffTime }) => {
  // Compute monthly average MAE for transparent data-derived threshold
  const totalMae = data.reduce((acc, d) => acc + d.mae_mw, 0);
  const avgMae = data.length > 0 ? totalMae / data.length : 0;
  const highErrorThreshold = avgMae * 1.5;

  const chartData = data.map((d) => ({
    dateLabel: d.decision_date.slice(5), // "01-15"
    fullDate: d.decision_date,
    deliveryDate: d.delivery_date,
    mae: d.mae_mw,
    bias: d.bias_mw,
    baselineMae: d.baseline_mae_mw,
    actualMean: d.mean_actual_mw,
    forecastMean: d.mean_forecast_mw,
    isHighError: d.mae_mw > highErrorThreshold,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;

    return (
      <div className="bg-surface border border-border p-3.5 rounded-lg shadow-lg text-xs max-w-xs z-50">
        <div className="font-semibold text-text-primary border-b border-border pb-1.5 mb-2 flex items-center justify-between">
          <span>Decision: {d.fullDate}</span>
          <span className="text-[11px] text-text-tertiary">Delivery: {d.deliveryDate}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Mean Absolute Error (MAE):</span>
            <span className="font-bold tabular-nums text-text-primary">{d.mae.toLocaleString()} MW</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Forecast Bias (Mean Error):</span>
            <span
              className={`font-bold tabular-nums ${
                d.bias > 0 ? 'text-overforecast' : d.bias < 0 ? 'text-underforecast' : 'text-text-primary'
              }`}
            >
              {d.bias > 0 ? `+${d.bias.toLocaleString()}` : d.bias.toLocaleString()} MW
              <span className="text-[10px] ml-1 font-normal">
                ({d.bias > 0 ? 'Over' : d.bias < 0 ? 'Under' : 'Zero'})
              </span>
            </span>
          </div>

          {d.baselineMae !== null && d.baselineMae !== undefined && (
            <div className="flex justify-between items-center text-text-tertiary text-[11px]">
              <span>Persistence Baseline MAE:</span>
              <span className="tabular-nums">{d.baselineMae.toLocaleString()} MW</span>
            </div>
          )}

          <div className="pt-1.5 border-t border-surface-subtle flex justify-between text-[11px] text-text-secondary">
            <span>Avg Actual / Forecast:</span>
            <span className="tabular-nums">
              {d.actualMean?.toLocaleString()} / {d.forecastMean?.toLocaleString()} MW
            </span>
          </div>

          {d.isHighError && (
            <div className="mt-2 pt-1.5 border-t border-border/60 text-[10px] text-overforecast font-medium flex items-center">
              <span>High Volatility Day (&gt; 1.5x month mean MAE of {Math.round(avgMae).toLocaleString()} MW)</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-border">
        <div>
          <h3 className="font-serif text-lg font-bold text-text-primary">
            Daily Forecast Error & Bias across January 2026
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Evaluating Day-Ahead forecasts at the <strong className="text-text-primary">{cutoffTime} Europe/London</strong> cutoff against physical delivery.
          </p>
        </div>
        <div className="mt-2 sm:mt-0 text-[11px] text-text-tertiary">
          Threshold: High error flagged when MAE &gt; {Math.round(highErrorThreshold).toLocaleString()} MW (1.5× monthly mean)
        </div>
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
              label={{
                value: 'Decision Date in January 2026 (Delivery = Decision + 1 Day)',
                position: 'insideBottom',
                offset: -10,
                fontSize: 11,
                fill: '#69675F',
              }}
            />
            <YAxis
              stroke="#69675F"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              label={{
                value: 'Error (MW)',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                fontSize: 11,
                fill: '#69675F',
              }}
            />
            <ReferenceLine y={0} stroke="#20201D" strokeWidth={1} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
            />

            <Bar
              dataKey="mae"
              name="Daily MAE (MW absolute error)"
              fill="#D95635"
              opacity={0.85}
              radius={[2, 2, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="bias"
              name="Forecast Bias (MW mean error)"
              stroke="#A96E13"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#A96E13' }}
            />
            <Line
              type="monotone"
              dataKey="baselineMae"
              name="Day-Ahead Baseline MAE (D-1 Persistence)"
              stroke="#7C7971"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
        <span>Units: Megawatts (MW) daily average</span>
        <span>Bias &gt; 0 indicates systematic overforecasting; Bias &lt; 0 indicates underforecasting</span>
      </div>
    </div>
  );
};
