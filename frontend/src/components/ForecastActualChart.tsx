import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DecisionInterval } from '../types/api';

interface ForecastActualChartProps {
  intervals: DecisionInterval[];
  deliveryDate: string;
  cutoffTime: string;
}

export const ForecastActualChart: React.FC<ForecastActualChartProps> = ({
  intervals,
  deliveryDate,
  cutoffTime,
}) => {
  const [showBaseline, setShowBaseline] = useState(false);

  // Format data for Recharts, respecting nulls
  const chartData = intervals.map((item) => ({
    hourLabel: `${String(item.hour_of_day).padStart(2, '0')}:00`,
    forecast: item.forecast_mw,
    actual: item.actual_mw,
    baseline: item.baseline_mw,
    error: item.error_mw,
    absError: item.abs_error_mw,
    publishTime: item.publish_time,
    ageAtCutoff: item.age_at_cutoff_hours,
    leadTime: item.lead_time_hours,
    direction: item.error_direction,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-surface border border-border p-3.5 rounded-lg shadow-lg text-xs max-w-xs z-50">
        <div className="font-semibold text-text-primary border-b border-border pb-1.5 mb-2 flex items-center justify-between">
          <span>Delivery Hour: {label} UTC</span>
          <span className="text-[11px] text-text-tertiary">{deliveryDate}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-sm border border-forecast bg-white mr-1.5 inline-block" />
              Selected Forecast:
            </span>
            <span className="font-bold tabular-nums text-text-primary">
              {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : 'No data'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-actual mr-1.5 inline-block" />
              Actual Generation:
            </span>
            <span className="font-bold tabular-nums text-text-primary">
              {data.actual !== null ? `${data.actual.toLocaleString()} MW` : 'No data'}
            </span>
          </div>

          {data.forecast !== null && data.actual !== null && (
            <div className="flex items-center justify-between pt-1 border-t border-surface-subtle">
              <span className="text-text-secondary">Forecast Error:</span>
              <span
                className={`font-bold tabular-nums ${
                  data.error > 0
                    ? 'text-overforecast'
                    : data.error < 0
                    ? 'text-underforecast'
                    : 'text-text-primary'
                }`}
              >
                {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error.toLocaleString()} MW ({data.direction})
              </span>
            </div>
          )}

          {showBaseline && data.baseline !== null && data.baseline !== undefined && (
            <div className="flex items-center justify-between text-[11px] text-text-tertiary">
              <span>D-1 Persistence Baseline:</span>
              <span className="tabular-nums">{data.baseline.toLocaleString()} MW</span>
            </div>
          )}

          <div className="pt-2 border-t border-border/60 text-[11px] text-text-tertiary space-y-0.5">
            <div>Published: <span className="font-mono text-text-secondary">{data.publishTime?.replace('T', ' ').replace('Z', ' UTC')}</span></div>
            <div>Age at Cutoff: <span className="font-medium text-text-secondary">{data.ageAtCutoff}h old</span></div>
            <div>Lead Time to Delivery: <span className="font-medium text-text-secondary">{data.leadTime}h</span></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-border gap-2">
        <div>
          <h3 className="font-serif text-lg font-bold text-text-primary">
            Hourly Generation Profile: Forecast vs Actual Outturn
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Physical delivery on <strong className="text-text-primary">{deliveryDate}</strong>, evaluated using the latest forecast available at <strong className="text-text-primary">{cutoffTime} Europe/London</strong>.
          </p>
        </div>

        {/* Secondary Baseline Toggle */}
        <div className="flex items-center space-x-2 text-xs">
          <label className="inline-flex items-center cursor-pointer text-text-secondary hover:text-text-primary select-none bg-surface-subtle/50 px-2.5 py-1 rounded border border-border">
            <input
              type="checkbox"
              checked={showBaseline}
              onChange={(e) => setShowBaseline(e.target.checked)}
              className="mr-1.5 rounded border-border text-forecast focus:ring-0"
            />
            <span>Show D-1 Persistence Baseline</span>
          </label>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 sm:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D7" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              stroke="#69675F"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
              label={{
                value: 'Delivery Interval Start (UTC)',
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
                value: 'Generation (MW)',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                fontSize: 11,
                fill: '#69675F',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />
            {/* Actual: Solid dark line with solid circle dots */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Generation (FUELHH WIND)"
              stroke="#252622"
              strokeWidth={2.4}
              dot={{ r: 3, fill: '#252622' }}
              activeDot={{ r: 5, fill: '#252622' }}
              connectNulls={false}
            />
            {/* Forecast: Vermilion line with hollow square markers */}
            <Line
              type="monotone"
              dataKey="forecast"
              name="Selected Forecast (WINDFOR ≤ Cutoff)"
              stroke="#D95635"
              strokeWidth={2.4}
              dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#D95635', strokeWidth: 1.5 }}
              activeDot={{ r: 5.5, fill: '#D95635' }}
              connectNulls={false}
            />
            {/* Baseline: Muted dashed line */}
            {showBaseline && (
              <Line
                type="monotone"
                dataKey="baseline"
                name="D-1 Persistence Baseline"
                stroke="#7C7971"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Visual Provenance Note */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
        <span>Units: Megawatts (MW) hourly interval-average power</span>
        <span>Visual Distinction: Solid circles = Outturn Actuals | Hollow markers = Selected Forecast</span>
      </div>
    </div>
  );
};
