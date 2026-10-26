import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { AccuracyResponse } from '../types/api';
import { Clock, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';

interface AccuracyViewProps {
  data: AccuracyResponse;
  cutoffTime: string;
  onCutoffChange: (cutoff: string) => void;
  onSelectDate: (date: string) => void;
}

const SUPPORTED_CUTOFFS = [
  { value: '07:00', label: '07:00 · Europe/London' },
  { value: '09:00', label: '09:00 · Europe/London (Default)' },
  { value: '12:00', label: '12:00 · Europe/London' },
  { value: '16:00', label: '16:00 · Europe/London' },
  { value: '22:00', label: '22:00 · Europe/London' },
];

export const AccuracyView: React.FC<AccuracyViewProps> = ({
  data,
  cutoffTime,
  onCutoffChange,
  onSelectDate,
}) => {
  const [chartMode, setChartMode] = useState<'mae' | 'bias'>('mae');
  const [showSecondaryMetrics, setShowSecondaryMetrics] = useState(false);

  const { overall_metrics, daily_breakdown } = data;

  // Chart data formatting
  const chartData = daily_breakdown.map((d) => ({
    dateLabel: d.decision_date.slice(5), // "01-15"
    fullDate: d.decision_date,
    deliveryDate: d.delivery_date,
    mae: d.mae_mw,
    bias: d.bias_mw,
    sampleCount: d.matched_intervals,
    actualMean: d.mean_actual_mw,
    forecastMean: d.mean_forecast_mw,
  }));

  // Tooltip for Daily chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;

    return (
      <div className="bg-surface border border-border p-3 rounded-lg shadow-lg text-xs max-w-xs z-50">
        <div className="font-semibold text-text-primary border-b border-border pb-1 mb-1.5 flex items-center justify-between">
          <span>Decision: {d.fullDate}</span>
          <span className="text-[10px] text-text-tertiary">Delivery: {d.deliveryDate}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-text-secondary">Typical Error (MAE):</span>
            <span className="font-bold tabular-nums text-text-primary">{d.mae?.toLocaleString()} MW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Forecast Bias:</span>
            <span
              className={`font-bold tabular-nums ${
                d.bias > 0 ? 'text-overforecast' : d.bias < 0 ? 'text-underforecast' : 'text-text-primary'
              }`}
            >
              {d.bias > 0 ? `+${d.bias.toLocaleString()}` : d.bias?.toLocaleString()} MW
            </span>
          </div>
          <div className="pt-1 border-t border-surface-subtle text-[10px] text-text-tertiary flex justify-between">
            <span>Coverage:</span>
            <span>{d.sampleCount} / 24 hours</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary">
              Accuracy
            </h1>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface border border-border text-text-tertiary">
              January 2026
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            How well did cutoff-available national wind forecasts match actual generation across January 2026 decision dates?
          </p>
        </div>

        {/* Single Filter: Cutoff Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-text-secondary font-medium whitespace-nowrap">
            Cutoff:
          </label>
          <div className="relative inline-flex items-center">
            <Clock className="w-3.5 h-3.5 text-text-tertiary absolute left-2.5 pointer-events-none" />
            <select
              value={cutoffTime}
              onChange={(e) => onCutoffChange(e.target.value)}
              className="bg-surface border border-border text-text-primary text-xs font-medium rounded-md pl-8 pr-7 py-1.5 focus:ring-1 focus:ring-forecast focus:outline-none cursor-pointer"
            >
              {SUPPORTED_CUTOFFS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3 Primary Metrics Maximum */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Month MAE */}
        <div className="bg-surface rounded-lg p-4 border border-border shadow-card">
          <div className="text-xs font-medium text-text-secondary mb-1">
            Typical Error (MAE)
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
              {overall_metrics.mae_mw?.toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary">MW</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
            Average absolute error magnitude across all evaluated delivery hours.
          </p>
        </div>

        {/* Metric 2: Forecast Bias */}
        <div className="bg-surface rounded-lg p-4 border border-border shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">Forecast Bias</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                overall_metrics.bias_mw > 0
                  ? 'bg-overforecast/10 text-overforecast border-overforecast/20'
                  : 'bg-underforecast/10 text-underforecast border-underforecast/20'
              }`}
            >
              {overall_metrics.bias_mw > 0 ? 'Over-forecast' : 'Under-forecast'}
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span
              className={`font-serif text-2xl sm:text-3xl font-bold tabular-nums ${
                overall_metrics.bias_mw > 0 ? 'text-overforecast' : 'text-underforecast'
              }`}
            >
              {overall_metrics.bias_mw > 0
                ? `+${overall_metrics.bias_mw.toLocaleString()}`
                : overall_metrics.bias_mw?.toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary">MW</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
            Directional tendency: positive indicates forecasts systematically exceeded physical delivery.
          </p>
        </div>

        {/* Metric 3: Matched Coverage */}
        <div className="bg-surface rounded-lg p-4 border border-border shadow-card">
          <div className="text-xs font-medium text-text-secondary mb-1">
            Matched Coverage
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-underforecast tabular-nums">
              {overall_metrics.matched_intervals}
            </span>
            <span className="text-xs text-text-secondary">/ {overall_metrics.total_intervals} hours</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
            100% complete hourly coverage across all 31 January decision dates.
          </p>
        </div>
      </div>

      {/* Secondary Metrics Disclosure */}
      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSecondaryMetrics(!showSecondaryMetrics)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-surface-subtle/50 transition-colors text-xs text-text-secondary"
        >
          <span className="flex items-center space-x-1.5 font-medium">
            <span>Additional metrics & baseline comparison</span>
            <span className="text-[10px] text-text-tertiary">(RMSE, Persistence benchmark)</span>
          </span>
          {showSecondaryMetrics ? (
            <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
          )}
        </button>

        {showSecondaryMetrics && (
          <div className="px-4 py-3 border-t border-border bg-surface-subtle/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-text-primary block">Root Mean Square Error (RMSE):</span>
              <span className="font-serif text-lg font-bold text-text-primary tabular-nums">
                {overall_metrics.rmse_mw?.toLocaleString()} MW
              </span>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Squares interval errors before averaging, penalizing large unexpected misses more heavily.
              </p>
            </div>
            <div>
              <span className="font-semibold text-text-primary block">Day-Ahead Persistence Baseline:</span>
              <span className="font-serif text-lg font-bold text-text-primary tabular-nums">
                {overall_metrics.baseline_mae_mw?.toLocaleString() ?? 'N/A'} MW
              </span>
              {overall_metrics.baseline_skill_score !== null && (
                <span className="ml-2 text-xs font-semibold text-underforecast">
                  (+{(overall_metrics.baseline_skill_score * 100).toFixed(1)}% skill improvement)
                </span>
              )}
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Benchmark model using observed generation at the same hour yesterday: Actual(t - 24 hours).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Primary Month Chart with Segmented Toggle */}
      <div className="bg-surface rounded-lg p-5 border border-border shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-border gap-2">
          <div>
            <h2 className="font-serif text-base font-bold text-text-primary">
              {chartMode === 'mae' ? 'Daily error size (MAE)' : 'Daily forecast bias'} across January 2026
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Day-ahead forecast evaluated at <strong className="text-text-primary">{cutoffTime} Europe/London</strong>.
            </p>
          </div>

          {/* Segmented Toggle: Error Size | Bias */}
          <div className="inline-flex rounded-md border border-border p-0.5 bg-surface-subtle self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMode('mae')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                chartMode === 'mae'
                  ? 'bg-surface text-text-primary shadow-xs font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Error size (MAE)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bias')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                chartMode === 'bias'
                  ? 'bg-surface text-text-primary shadow-xs font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Forecast bias
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 20 }}>
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
                  value: chartMode === 'mae' ? 'MAE (MW)' : 'Bias (MW)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 0,
                  fontSize: 11,
                  fill: '#69675F',
                }}
              />
              <ReferenceLine y={0} stroke="#20201D" strokeWidth={1} />
              <Tooltip content={<CustomTooltip />} />

              {chartMode === 'mae' ? (
                <Bar
                  dataKey="mae"
                  name="Daily MAE"
                  fill="#D95635"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              ) : (
                <Bar
                  dataKey="bias"
                  name="Forecast Bias"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={600}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`bias-cell-${index}`}
                      fill={entry.bias >= 0 ? '#A96E13' : '#267568'}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-text-tertiary mt-2.5 pt-2.5 border-t border-surface-subtle gap-2">
          <span>
            {chartMode === 'mae'
              ? 'Bars show mean absolute error per delivery day (non-negative magnitude in MW).'
              : 'Amber bars (>0) indicate over-forecast; teal bars (<0) indicate under-forecast.'}
          </span>
          <span className="font-medium text-text-secondary">Click any date below to inspect its 24-hour profile in Forecast</span>
        </div>
      </div>

      {/* Plain English Result Sentence */}
      <div className="bg-surface rounded-xl p-4 border border-border shadow-card text-xs text-text-secondary leading-relaxed">
        <strong className="text-text-primary block mb-1">Monthly Reliability Summary:</strong>
        Across all 31 January 2026 decision dates evaluated at the {cutoffTime} Europe/London cutoff,
        day-ahead wind forecasts exhibited an average error (MAE) of{' '}
        <strong className="text-text-primary">{overall_metrics.mae_mw?.toLocaleString()} MW</strong>,
        with a consistent tendency to over-predict outturn generation (
        <strong className="text-overforecast">+{overall_metrics.bias_mw?.toLocaleString()} MW</strong> mean bias)
        over the 744 matched hours.
      </div>

      {/* Interactive Day Selector Table */}
      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-bold text-text-primary">
              January Day Selector & Performance Log
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Select any decision date to open its full 24-hour delivery profile in Forecast.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-surface-subtle/90 backdrop-blur-xs z-10 border-b border-border text-[11px] font-semibold text-text-secondary">
              <tr>
                <th className="py-2.5 px-4">Decision Date</th>
                <th className="py-2.5 px-4">Delivery Day</th>
                <th className="py-2.5 px-4 text-right">Daily MAE (MW)</th>
                <th className="py-2.5 px-4 text-right">Forecast Bias (MW)</th>
                <th className="py-2.5 px-4 text-center">Coverage</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-subtle">
              {daily_breakdown.map((row) => (
                <tr
                  key={row.decision_date}
                  onClick={() => onSelectDate(row.decision_date)}
                  className="hover:bg-surface-subtle/50 transition-colors cursor-pointer group"
                >
                  <td className="py-2 px-4 font-medium text-text-primary whitespace-nowrap">
                    {row.decision_date}
                  </td>
                  <td className="py-2 px-4 text-text-secondary whitespace-nowrap">
                    {row.delivery_date}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums font-medium text-text-primary whitespace-nowrap">
                    {row.mae_mw?.toLocaleString()}
                  </td>
                  <td
                    className={`py-2 px-4 text-right tabular-nums font-semibold whitespace-nowrap ${
                      row.bias_mw > 0 ? 'text-overforecast' : 'text-underforecast'
                    }`}
                  >
                    {row.bias_mw > 0 ? `+${row.bias_mw.toLocaleString()}` : row.bias_mw?.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-center tabular-nums text-text-tertiary whitespace-nowrap">
                    {row.matched_intervals} / 24 hrs
                  </td>
                  <td className="py-2 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center text-[11px] text-forecast font-medium group-hover:underline">
                      Inspect <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
