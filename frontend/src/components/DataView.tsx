import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronRight, Database, Clock, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import type { AppMetadata } from '../types/api';

interface DataViewProps {
  metadata?: AppMetadata;
}

export const DataView: React.FC<DataViewProps> = ({ metadata }) => {
  const [showMetricsGuide, setShowMetricsGuide] = useState(false);

  return (
    <div className="animate-fade-in-up space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary">
            Data
          </h1>
          {metadata && (
            <span className="text-[11px] font-mono text-text-tertiary">
              v{metadata.version} · {metadata.target_period}
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Authoritative sources, cutoff methodology, data coverage, and analytical boundaries.
        </p>
      </div>

      {/* 1. Sources */}
      <div className="bg-surface rounded-xl p-5 border border-border shadow-card card-hover">
        <div className="flex items-center space-x-2 text-forecast mb-3">
          <Database className="w-4 h-4" />
          <h2 className="font-serif text-base font-bold text-text-primary">
            1. Authoritative Data Sources
          </h2>
        </div>
        <p className="text-xs text-text-secondary mb-4 leading-relaxed">
          WindLens strictly evaluates public Great Britain electricity market data streamed from the official <strong>Elexon Insights Solution (BMRS)</strong> API:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {/* FUELHH */}
          <div className="p-3.5 rounded border border-border bg-surface-subtle/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-text-primary">Actual Wind Generation</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-underforecast font-medium">
                FUELHH
              </span>
            </div>
            <ul className="text-text-secondary space-y-1 text-[11px] mb-2.5">
              <li>• Scope: Transmission-connected wind generation (<code className="font-mono text-text-primary">fuelType=WIND</code>)</li>
              <li>• Granularity: Half-hourly settlement periods (30 min)</li>
              <li>• Physical Unit: Megawatts (MW) delivered power</li>
            </ul>
            <a
              href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
              target="_blank"
              rel="noreferrer"
              className="text-forecast hover:underline inline-flex items-center text-[11px] font-medium"
            >
              Official Elexon FUELHH stream <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          {/* WINDFOR */}
          <div className="p-3.5 rounded border border-border bg-surface-subtle/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-text-primary">Wind Forecast Vintages</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-forecast font-medium">
                WINDFOR
              </span>
            </div>
            <ul className="text-text-secondary space-y-1 text-[11px] mb-2.5">
              <li>• Scope: National wind generation forecast from ESO/NESO</li>
              <li>• Horizon & Cadence: 72-hour horizon, published every ~2–4 hours</li>
              <li>• Physical Unit: Megawatts (MW) hourly forecasted power</li>
            </ul>
            <a
              href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
              target="_blank"
              rel="noreferrer"
              className="text-forecast hover:underline inline-flex items-center text-[11px] font-medium"
            >
              Official Elexon WINDFOR stream <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. How the forecast is selected */}
      <div className="bg-surface rounded-xl p-5 border border-border shadow-card card-hover">
        <div className="flex items-center space-x-2 text-forecast mb-3">
          <Clock className="w-4 h-4" />
          <h2 className="font-serif text-base font-bold text-text-primary">
            2. How the Forecast is Selected (Lookahead Protection)
          </h2>
        </div>
        <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
          <p>
            For each delivery interval, WindLens selects the latest forecast published on or before the chosen decision cutoff.
          </p>
          <div className="p-3 bg-surface-subtle rounded border border-border font-mono text-[11px] text-forecast font-medium">
            selected_publish_time = max(publishTime) WHERE publishTime ≤ decision_cutoff AND startTime = delivery_interval
          </div>
          <p>
            <strong>Lookahead Protection:</strong> Any forecast run published after the cutoff time is excluded. This guarantees that future revisions cannot distort the historical evaluation of what an energy buyer had on their desk at decision time.
          </p>
          <p className="text-[11px] text-text-tertiary">
            <strong>Timezone Conversion:</strong> Cutoff times are specified in <code className="font-mono text-text-primary">Europe/London</code>. For January decisions, London is on Greenwich Mean Time (UTC+0).
          </p>
        </div>
      </div>

      {/* 3. Coverage and checks */}
      <div className="bg-surface rounded-xl p-5 border border-border shadow-card card-hover">
        <div className="flex items-center space-x-2 text-underforecast mb-3">
          <CheckCircle2 className="w-4 h-4" />
          <h2 className="font-serif text-base font-bold text-text-primary">
            3. Data Coverage & Empirical Verification
          </h2>
        </div>
        <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
          <p>
            All evaluations in WindLens are backed by verified source records:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>Decision Window:</strong> 1 to 31 January 2026 (31 decision days, governing deliveries from 2 January to 1 February 2026).
            </li>
            <li>
              <strong>Matched Observations:</strong> 744 matched hourly intervals out of 744 expected delivery hours (100% complete coverage).
            </li>
            <li>
              <strong>Granularity Alignment:</strong> Actual generation is computed as the arithmetic mean of each hour's two 30-minute FUELHH settlement periods. 100% of target hours possess complete settlement pairs with zero interpolation.
            </li>
            <li>
              <strong>Lookahead Test:</strong> Automated testing verified 744 of 744 intervals satisfy <code className="font-mono text-text-primary">publishTime ≤ cutoff</code> with zero post-cutoff leaks.
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Scope and limitations */}
      <div className="bg-surface rounded-xl p-5 border border-border shadow-card card-hover">
        <div className="flex items-center space-x-2 text-overforecast mb-3">
          <AlertTriangle className="w-4 h-4" />
          <h2 className="font-serif text-base font-bold text-text-primary">
            4. Scope & Analytical Boundaries
          </h2>
        </div>
        <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>Illustrative Cutoff:</strong> The default 09:00 Europe/London cutoff is an illustrative modelling assumption for procurement workflows, not an official industry-wide gate closure.
            </li>
            <li>
              <strong>National Scale Only:</strong> WindLens audits transmission-connected wind generation for Great Britain. It does not model embedded/rooftop solar, system demand, transmission constraints, or imbalance cashout prices.
            </li>
            <li>
              <strong>Physical Accuracy Focus:</strong> This tool measures physical forecast error in Megawatts (MW). It does not provide trading advice, automated hedging strategies, or commercial price valuations.
            </li>
          </ul>
        </div>
      </div>

      {/* How to Read These Metrics */}
      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMetricsGuide(!showMetricsGuide)}
          className="touch-press w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-subtle/50 transition-colors text-xs text-text-secondary"
        >
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="font-semibold text-text-primary">How to read these metrics</span>
            <span className="text-[10px] text-text-tertiary">(MAE, Bias, RMSE, Persistence definitions)</span>
          </div>
          {showMetricsGuide ? (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          )}
        </button>

        {showMetricsGuide && (
          <div className="px-5 py-4 border-t border-border bg-surface-subtle/20 space-y-3 text-xs text-text-secondary">
            <div>
              <strong className="text-text-primary block mb-0.5">Signed Error:</strong>
              <div className="font-mono text-[11px] text-forecast">Error = Forecast − Actual</div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Positive values denote over-forecast (forecast exceeded actuals); negative values denote under-forecast.
              </p>
            </div>

            <div>
              <strong className="text-text-primary block mb-0.5">Mean Absolute Error (MAE):</strong>
              <div className="font-mono text-[11px]">(1 / N) * Σ |Forecast − Actual|</div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                The typical magnitude of forecast deviation in Megawatts (MW), measuring error size regardless of direction.
              </p>
            </div>

            <div>
              <strong className="text-text-primary block mb-0.5">Forecast Bias (Mean Error):</strong>
              <div className="font-mono text-[11px]">(1 / N) * Σ (Forecast − Actual)</div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                The average directional tendency across all delivery hours.
              </p>
            </div>

            <div>
              <strong className="text-text-primary block mb-0.5">Day-Ahead Persistence Benchmark:</strong>
              <div className="font-mono text-[11px]">Baseline(t) = Actual(t − 24 hours)</div>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                A standard naive comparison benchmark using observed generation at the same hour yesterday.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
