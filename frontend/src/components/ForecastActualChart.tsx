import React from 'react';
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
  // Format data for Recharts, respecting nulls
  const chartData = intervals.map((item) => ({
    hourLabel: `${String(item.hour_of_day).padStart(2, '0')}:00`,
    forecast: item.forecast_mw,
    actual: item.actual_mw,
    error: item.error_mw,
    direction: item.error_direction,
    publishTime: item.publish_time,
  }));

  // Calculate volume averages for the compact subtitle
  const validForecasts = intervals.filter((i) => i.forecast_mw !== null && i.forecast_mw !== undefined);
  const validActuals = intervals.filter((i) => i.actual_mw !== null && i.actual_mw !== undefined);

  const avgForecast =
    validForecasts.length > 0
      ? Math.round(validForecasts.reduce((sum, i) => sum + i.forecast_mw, 0) / validForecasts.length)
      : null;

  const avgActual =
    validActuals.length > 0
      ? Math.round(validActuals.reduce((sum, i) => sum + i.actual_mw, 0) / validActuals.length)
      : null;

  const delta = avgForecast !== null && avgActual !== null ? avgForecast - avgActual : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-surface border border-border p-3 rounded-lg shadow-lg text-xs max-w-xs z-50">
        <div className="font-semibold text-text-primary border-b border-border pb-1 mb-2 flex items-center justify-between">
          <span>{label} – {String((parseInt(label, 10) + 1) % 24).padStart(2, '0')}:00 UTC</span>
          <span className="text-[10px] text-text-tertiary">{deliveryDate}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-sm bg-forecast mr-1.5 inline-block" />
              Forecast:
            </span>
            <span className="font-bold tabular-nums text-text-primary">
              {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : 'No data'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-underforecast mr-1.5 inline-block" />
              Actual Outturn:
            </span>
            <span className="font-bold tabular-nums text-text-primary">
              {data.actual !== null ? `${data.actual.toLocaleString()} MW` : 'No data'}
            </span>
          </div>

          {data.forecast !== null && data.actual !== null && (
            <div className="flex items-center justify-between pt-1 border-t border-surface-subtle">
              <span className="text-text-secondary">Signed Error:</span>
              <span
                className={`font-bold tabular-nums ${
                  data.error > 0
                    ? 'text-overforecast'
                    : data.error < 0
                    ? 'text-underforecast'
                    : 'text-text-primary'
                }`}
              >
                {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error.toLocaleString()} MW
                <span className="text-[10px] ml-1 font-normal">({data.direction})</span>
              </span>
            </div>
          )}

          {data.publishTime && (
            <div className="pt-1.5 border-t border-border/50 text-[10px] text-text-tertiary">
              Run: <span className="font-mono text-text-secondary">{data.publishTime.replace('T', ' ').replace('Z', ' UTC')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card mb-6">
      {/* Top Header of Chart */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-border gap-2">
        <div>
          <h2 className="font-serif text-lg font-bold text-text-primary">
            Forecast vs actual generation
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Physical delivery on <strong className="text-text-primary">{deliveryDate}</strong>, evaluated at {cutoffTime} Europe/London cutoff.
          </p>
        </div>

        {/* Compact Volume Summary */}
        {avgForecast !== null && avgActual !== null && (
          <div className="text-xs text-text-secondary bg-surface-subtle/60 px-3 py-1.5 rounded border border-border">
            <span>Forecast avg: <strong className="text-text-primary">{avgForecast.toLocaleString()} MW</strong></span>
            <span className="mx-1.5 text-text-tertiary">·</span>
            <span>Actual avg: <strong className="text-text-primary">{avgActual.toLocaleString()} MW</strong></span>
            {delta !== null && (
              <>
                <span className="mx-1.5 text-text-tertiary">·</span>
                <span className={delta > 0 ? 'text-overforecast font-medium' : 'text-underforecast font-medium'}>
                  Δ {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} MW
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Chart Canvas */}
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
                value: 'Delivery Hour (UTC)',
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
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#D1CAC0', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '14px', fontSize: '11px', fontWeight: 500 }}
            />
            {/* Actual: Deep teal/charcoal solid line with solid round dots */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual generation (FUELHH WIND)"
              stroke="#267568"
              strokeWidth={2.4}
              dot={{ r: 3, fill: '#267568' }}
              activeDot={{ r: 5.5, fill: '#267568', stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={600}
            />
            {/* Forecast: Vermilion line with hollow round markers */}
            <Line
              type="monotone"
              dataKey="forecast"
              name="Selected forecast (WINDFOR ≤ Cutoff)"
              stroke="#D95635"
              strokeWidth={2.4}
              dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#D95635', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#D95635', stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Note */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
        <span>Unit: Generation (MW) hourly interval-average power</span>
        <span>Selected forecast: Latest WINDFOR published on or before {cutoffTime} UTC</span>
      </div>
    </div>
  );
};
