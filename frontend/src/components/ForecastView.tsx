import React from 'react';
import type { DecisionResponse, VintageResponse } from '../types/api';
import { DecisionControls } from './DecisionControls';
import { ForecastActualChart } from './ForecastActualChart';
import { IntervalTable } from './IntervalTable';
import { VintageFanChart } from './VintageFanChart';
import { Sparkles, ShieldAlert } from 'lucide-react';

interface ForecastViewProps {
  decisionData: DecisionResponse;
  vintageData?: VintageResponse;
  decisionDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  cutoffTime: string;
  onCutoffChange: (cutoff: string) => void;
  onReset: () => void;
}

export const ForecastView: React.FC<ForecastViewProps> = ({
  decisionData,
  vintageData,
  decisionDate,
  onDateChange,
  availableDates,
  cutoffTime,
  onCutoffChange,
  onReset,
}) => {
  const { summary_metrics, metadata, intervals } = decisionData;

  // Identify peak generation and largest forecast miss for client intelligence
  const maxForecastInterval = [...intervals].sort((a, b) => b.forecast_mw - a.forecast_mw)[0];
  const maxErrorInterval = [...intervals].sort((a, b) => b.abs_error_mw - a.abs_error_mw)[0];

  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary">
            Forecast
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Day-level wind forecast analysis for physical delivery on{' '}
            <strong className="text-text-primary">{metadata.delivery_date}</strong>.
          </p>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface border border-border text-text-tertiary">
          Decision Date: {metadata.decision_date}
        </span>
      </div>

      {/* Decision Controls */}
      <DecisionControls
        decisionDate={decisionDate}
        onDateChange={onDateChange}
        availableDates={availableDates}
        cutoffTime={cutoffTime}
        onCutoffChange={onCutoffChange}
        deliveryDate={metadata.delivery_date}
        onReset={onReset}
      />

      {/* Primary Forecast vs Actual Centerpiece Chart */}
      <ForecastActualChart
        intervals={intervals}
        deliveryDate={metadata.delivery_date}
        cutoffTime={cutoffTime}
      />

      {/* Key Metric Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Typical Error */}
        <div className="bg-surface rounded-xl p-4 border border-border shadow-card card-hover">
          <div className="text-xs font-medium text-text-secondary mb-1">
            Typical Error (MAE)
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
              {summary_metrics.mae_mw?.toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary">MW</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
            Average absolute deviation across all 24 delivery intervals.
          </p>
        </div>

        {/* Metric 2: Directional Bias */}
        <div className="bg-surface rounded-xl p-4 border border-border shadow-card card-hover">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">Forecast Bias</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                summary_metrics.bias_mw > 0
                  ? 'bg-overforecast/10 text-overforecast border-overforecast/20'
                  : 'bg-underforecast/10 text-underforecast border-underforecast/20'
              }`}
            >
              {summary_metrics.bias_mw > 0 ? 'Over-forecast' : 'Under-forecast'}
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span
              className={`font-serif text-2xl sm:text-3xl font-bold tabular-nums ${
                summary_metrics.bias_mw > 0 ? 'text-overforecast' : 'text-underforecast'
              }`}
            >
              {summary_metrics.bias_mw > 0
                ? `+${summary_metrics.bias_mw.toLocaleString()}`
                : summary_metrics.bias_mw?.toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary">MW</span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
            {summary_metrics.bias_mw > 0
              ? 'Forecast systematically exceeded outturn delivery.'
              : 'Physical delivery systematically exceeded forecast.'}
          </p>
        </div>

        {/* Metric 3: Persistence Skill */}
        <div className="bg-surface rounded-xl p-4 border border-border shadow-card card-hover">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">Persistence Skill</span>
            {summary_metrics.baseline_skill_score !== null && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  summary_metrics.baseline_skill_score > 0
                    ? 'bg-underforecast/10 text-underforecast border-underforecast/20'
                    : 'bg-overforecast/10 text-overforecast border-overforecast/20'
                }`}
              >
                {summary_metrics.baseline_skill_score > 0 ? 'Beats Baseline' : 'Trailing'}
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
              {summary_metrics.baseline_skill_score !== null
                ? `${(summary_metrics.baseline_skill_score * 100).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
            Skill improvement over naive persistence ({summary_metrics.baseline_mae_mw?.toLocaleString() ?? 'N/A'} MW MAE).
          </p>
        </div>
      </div>

      {/* Operational Highlights Box */}
      <div className="bg-surface rounded-xl p-4 border border-border shadow-card grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs card-hover">
        {maxForecastInterval && (
          <div className="flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded bg-forecast/10 text-forecast flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-text-primary block">Peak Forecast Period:</span>
              <span className="text-text-secondary">
                {String(maxForecastInterval.hour_of_day).padStart(2, '0')}:00 UTC with{' '}
                <strong className="text-text-primary">{maxForecastInterval.forecast_mw.toLocaleString()} MW</strong> forecasted outturn.
              </span>
            </div>
          </div>
        )}

        {maxErrorInterval && (
          <div className="flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded bg-overforecast/10 text-overforecast flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-text-primary block">Largest Interval Miss:</span>
              <span className="text-text-secondary">
                {String(maxErrorInterval.hour_of_day).padStart(2, '0')}:00 UTC missed by{' '}
                <strong className="text-text-primary">{maxErrorInterval.abs_error_mw.toLocaleString()} MW</strong> ({maxErrorInterval.error_direction.toLowerCase()}).
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Multi-Vintage Revision Sensitivity Drawer */}
      {vintageData && <VintageFanChart vintageData={vintageData} />}

      {/* Hourly Detail Reconciliation Table */}
      <IntervalTable intervals={intervals} deliveryDate={metadata.delivery_date} />
    </div>
  );
};
