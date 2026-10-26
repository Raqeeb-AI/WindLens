import React, { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Database,
  Calendar,
  Filter,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { AppMetadata } from '../types/api';

interface MethodologyViewProps {
  metadata?: AppMetadata;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ metadata }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-surface rounded-lg p-6 border border-border shadow-card">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">
          Data Sources & Methodology
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          WindLens provides procurement professionals with an evidence-based audit of day-ahead
          wind forecasts available at specific decision cutoffs. This guide answers key practical
          questions regarding data sources, vintage selection, interpretation, and known limitations.
        </p>
        {metadata && (
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-4 text-xs text-text-tertiary">
            <span>Snapshot Window: <strong className="text-text-secondary">{metadata.target_period}</strong></span>
            <span>Available Decision Days: <strong className="text-text-secondary">{metadata.available_decision_dates?.length ?? 31} days</strong></span>
            <span>Evaluated Delivery Hours: <strong className="text-text-secondary">744 hrs (100% complete)</strong></span>
          </div>
        )}
      </div>

      {/* 1. Where does the data come from? */}
      <div className="bg-surface rounded-lg p-6 border border-border shadow-card">
        <div className="flex items-center space-x-2.5 mb-3 text-forecast">
          <Database className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            Where does the data come from?
          </h3>
        </div>
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          All data is extracted directly from the official <strong>Elexon Insights Solution (BMRS)</strong> APIs,
          the authoritative source for Great Britain electricity balancing and market settlement data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded border border-border bg-surface-subtle/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-text-primary">Actual Wind Generation</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-underforecast">
                FUELHH
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-2.5">
              Outturn generation by fuel type for Great Britain transmission-connected wind farms.
            </p>
            <ul className="text-xs text-text-tertiary space-y-1 mb-3">
              <li>• Filtered strictly to <code className="text-text-secondary font-mono">fuelType = WIND</code></li>
              <li>• Published half-hourly (settlement periods 1 to 50)</li>
              <li>• Expressed in Megawatts (MW) average power</li>
            </ul>
            <a
              href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-forecast hover:underline inline-flex items-center"
            >
              Official FUELHH Documentation <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          <div className="p-4 rounded border border-border bg-surface-subtle/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-text-primary">Wind Forecast Vintages</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-forecast">
                WINDFOR
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-2.5">
              National wind generation forecasts published by the National Energy System Operator (NESO).
            </p>
            <ul className="text-xs text-text-tertiary space-y-1 mb-3">
              <li>• Issued on a rolling 72-hour horizon, ~every 2 to 4 hours</li>
              <li>• Retains genuine source publication timestamps (<code className="text-text-secondary font-mono">publishTime</code>)</li>
              <li>• Expressed in Megawatts (MW) hourly forecasted power</li>
            </ul>
            <a
              href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-forecast hover:underline inline-flex items-center"
            >
              Official WINDFOR Documentation <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. What period is covered? */}
      <div className="bg-surface rounded-lg p-6 border border-border shadow-card">
        <div className="flex items-center space-x-2.5 mb-3 text-forecast">
          <Calendar className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            What period is covered?
          </h3>
        </div>
        <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
          <p>
            The analysis evaluates day-ahead procurement decisions made during <strong>January 2026</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-surface-subtle rounded border border-border">
              <strong className="text-text-primary block mb-1">Decision Dates: 1 Jan 2026 – 31 Jan 2026</strong>
              The calendar days when procurement decisions are assumed to take place (31 decision days).
            </div>
            <div className="p-3 bg-surface-subtle rounded border border-border">
              <strong className="text-text-primary block mb-1">Delivery Dates: 2 Jan 2026 – 1 Feb 2026</strong>
              The subsequent day-ahead physical delivery intervals (744 total hourly intervals).
            </div>
          </div>
          <p className="text-xs text-text-tertiary">
            <strong>Data Coverage:</strong> 100% matched observations across all 744 target delivery hours in January 2026.
            There are zero missing or synthetically imputed settlement intervals in the baseline evaluation snapshot.
          </p>
        </div>
      </div>

      {/* 3. How is the selected forecast chosen? */}
      <div className="bg-surface rounded-lg p-6 border border-border shadow-card">
        <div className="flex items-center space-x-2.5 mb-3 text-forecast">
          <Filter className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            How is the selected forecast chosen?
          </h3>
        </div>
        <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
          <p>
            In day-ahead electricity procurement, decision-makers only have access to information published prior to their decision cutoff.
            To reflect real-world decision conditions without lookahead leakage:
          </p>
          <div className="p-3.5 bg-surface-subtle rounded border border-border font-mono text-xs text-forecast font-medium">
            selected_publish_time = max(publishTime) WHERE publishTime ≤ decision_cutoff AND startTime = delivery_interval
          </div>
          <ul className="text-xs text-text-secondary space-y-2 list-disc pl-5">
            <li>
              <strong>Lookahead Protection:</strong> Forecast runs published after the configured cutoff are strictly excluded from the decision analysis, ensuring future revisions cannot distort the historical evaluation.
            </li>
            <li>
              <strong>Vintage Freshness:</strong> The algorithm selects the most recent forecast published at or before the cutoff, reflecting the freshest available view.
            </li>
            <li>
              <strong>Reconciliation Granularity:</strong> WINDFOR provides hourly forecast values, while FUELHH reports half-hourly settlement periods. For each hour <code className="text-text-primary font-mono">[T, T+60m)</code>, actual generation is computed as the exact arithmetic mean of its two 30-minute settlement periods.
            </li>
          </ul>
        </div>
      </div>

      {/* 4. How should the results be interpreted? */}
      <div className="bg-surface rounded-lg p-6 border border-border shadow-card">
        <div className="flex items-center space-x-2.5 mb-3 text-forecast">
          <BarChart3 className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            How should the results be interpreted?
          </h3>
        </div>
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          WindLens reports key procurement accuracy metrics using plain-English conventions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded border border-border bg-surface-subtle/40">
            <div className="font-bold text-text-primary mb-1">Mean Absolute Error (MAE)</div>
            <p className="text-text-secondary leading-relaxed">
              The typical magnitude of forecast error in Megawatts (MW), regardless of direction. Lower is better.
            </p>
          </div>

          <div className="p-3.5 rounded border border-border bg-surface-subtle/40">
            <div className="font-bold text-text-primary mb-1">Forecast Bias (Mean Error)</div>
            <p className="text-text-secondary leading-relaxed">
              The directional tendency: positive values indicate forecasts systematically overpredicted generation; negative values indicate underprediction.
            </p>
          </div>

          <div className="p-3.5 rounded border border-border bg-surface-subtle/40">
            <div className="font-bold text-text-primary mb-1">Root Mean Square Error (RMSE)</div>
            <p className="text-text-secondary leading-relaxed">
              Similar to MAE, but squares errors before averaging. This penalizes large, unexpected forecast misses much more heavily than small deviations.
            </p>
          </div>

          <div className="p-3.5 rounded border border-border bg-surface-subtle/40">
            <div className="font-bold text-text-primary mb-1">Persistence Baseline & Skill</div>
            <p className="text-text-secondary leading-relaxed">
              A benchmark comparison using observed generation from the same hour yesterday (D-1). A positive skill score confirms the forecast provided genuine informational value over naive persistence.
            </p>
          </div>
        </div>
      </div>

      {/* 5. What are the limitations? */}
      <div className="bg-surface rounded-lg p-6 border border-border shadow-card">
        <div className="flex items-center space-x-2.5 mb-3 text-overforecast">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            What are the limitations of this analysis?
          </h3>
        </div>
        <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
          <p>
            When applying these findings to procurement operations, keep the following scope boundaries in mind:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>Illustrative Cutoff Assumption:</strong> The default 09:00 Europe/London cutoff is an illustrative procurement modelling assumption, not an official industry-wide gate closure or auction deadline.
            </li>
            <li>
              <strong>National-Scale Generation Only:</strong> This dashboard evaluates Great Britain transmission-level wind generation. It does not model embedded/rooftop generation, demand profiles, regional transmission bottlenecks, or imbalance market cashout prices.
            </li>
            <li>
              <strong>Procurement Context:</strong> WindLens measures physical forecast accuracy. It does not calculate optimal hedging strategies, financial savings, or commercial trading recommendations.
            </li>
          </ul>
        </div>
      </div>

      {/* 6. How can the user verify the data? */}
      <div className="bg-surface rounded-lg p-6 border border-border shadow-card">
        <div className="flex items-center space-x-2.5 mb-3 text-underforecast">
          <CheckCircle2 className="w-5 h-5" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            How can the user verify the data?
          </h3>
        </div>
        <div className="text-xs text-text-secondary space-y-2 leading-relaxed">
          <p>
            Every observation in WindLens is auditable against primary public records:
          </p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>
              Download the delivery day data as a raw CSV directly from the <strong>Interval Audit Table</strong> on the Decision Day view.
            </li>
            <li>
              Cross-reference any individual interval's <code className="font-mono text-text-primary">publishTime</code> against the official Elexon BMRS portal.
            </li>
            <li>
              The underlying Parquet data snapshots and automated test suite verify that 100% of selected forecasts satisfy the lookahead condition <code className="font-mono text-text-primary">publishTime ≤ cutoff</code>.
            </li>
          </ul>
        </div>
      </div>

      {/* 7. Collapsible Technical Definitions & Mathematical Formulas */}
      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-colors"
        >
          <span className="flex items-center space-x-2">
            <span>Technical Definitions & Mathematical Formulas</span>
            <span className="text-[10px] text-text-tertiary font-normal">(Optional reference)</span>
          </span>
          {showTechnicalDetails ? (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="p-5 border-t border-border bg-surface-subtle/30 space-y-4 text-xs text-text-secondary">
            <div>
              <strong className="text-text-primary block mb-1">Forecast Error Convention</strong>
              <div className="p-2 bg-surface rounded border border-border font-mono text-[11px] text-forecast">
                Error = Forecast - Actual
              </div>
              <p className="mt-1 text-[11px] text-text-tertiary">
                Positive indicates overforecast (forecast was higher than outturn); negative indicates underforecast.
              </p>
            </div>

            <div>
              <strong className="text-text-primary block mb-1">Mean Absolute Error (MAE)</strong>
              <div className="p-2 bg-surface rounded border border-border font-mono text-[11px]">
                MAE = (1 / N) * Σ |Forecast_i - Actual_i|
              </div>
            </div>

            <div>
              <strong className="text-text-primary block mb-1">Forecast Bias (Mean Error)</strong>
              <div className="p-2 bg-surface rounded border border-border font-mono text-[11px]">
                Bias = (1 / N) * Σ (Forecast_i - Actual_i)
              </div>
            </div>

            <div>
              <strong className="text-text-primary block mb-1">Root Mean Square Error (RMSE)</strong>
              <div className="p-2 bg-surface rounded border border-border font-mono text-[11px]">
                RMSE = √[ (1 / N) * Σ (Forecast_i - Actual_i)² ]
              </div>
            </div>

            <div>
              <strong className="text-text-primary block mb-1">Baseline Skill Score</strong>
              <div className="p-2 bg-surface rounded border border-border font-mono text-[11px]">
                Skill = 1 - (MAE_forecast / MAE_baseline)
              </div>
              <p className="mt-1 text-[11px] text-text-tertiary">
                Where MAE_baseline uses the Day-Ahead Persistence forecast: Actual(t - 24 hours).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
