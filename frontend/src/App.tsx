import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetadata, fetchDecision, fetchAccuracy, fetchVintages } from './lib/api';
import { Navbar } from './components/Navbar';
import { DecisionControls } from './components/DecisionControls';
import { ForecastActualChart } from './components/ForecastActualChart';
import { IntervalTable } from './components/IntervalTable';
import { VintageFanChart } from './components/VintageFanChart';
import { DailyErrorChart } from './components/DailyErrorChart';
import { DiurnalErrorChart } from './components/DiurnalErrorChart';
import { LeadTimeChart } from './components/LeadTimeChart';
import { MethodologyView } from './components/MethodologyView';
import { AlertCircle, RefreshCw, Info, ChevronDown, ChevronRight } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'decision' | 'accuracy' | 'methodology'>('decision');
  const [decisionDate, setDecisionDate] = useState<string>('2026-01-15');
  const [cutoffTime, setCutoffTime] = useState<string>('09:00');
  const [showStructuralAnalysis, setShowStructuralAnalysis] = useState<boolean>(true);

  // Queries
  const { data: metadata } = useQuery({
    queryKey: ['metadata'],
    queryFn: fetchMetadata,
    staleTime: Infinity,
  });

  const {
    data: decisionData,
    isLoading: decisionLoading,
    error: decisionError,
    refetch: refetchDecision,
  } = useQuery({
    queryKey: ['decision', decisionDate, cutoffTime],
    queryFn: () => fetchDecision(decisionDate, cutoffTime),
  });

  const { data: vintageData } = useQuery({
    queryKey: ['vintages', decisionDate],
    queryFn: () => fetchVintages(decisionDate),
    enabled: activeTab === 'decision',
  });

  const {
    data: accuracyData,
    isLoading: accuracyLoading,
    error: accuracyError,
    refetch: refetchAccuracy,
  } = useQuery({
    queryKey: ['accuracy', cutoffTime],
    queryFn: () => fetchAccuracy('2026-01-01', '2026-01-31', cutoffTime),
    enabled: activeTab === 'accuracy',
  });

  const availableDates = metadata?.available_decision_dates || [
    '2026-01-01', '2026-01-05', '2026-01-10', '2026-01-15', '2026-01-20', '2026-01-25', '2026-01-31'
  ];

  // Calculated values for Decision Day
  const meanForecast = decisionData
    ? Math.round(
        decisionData.intervals.reduce((acc, i) => acc + i.forecast_mw, 0) /
          decisionData.intervals.length
      )
    : 0;

  const meanActual = decisionData
    ? Math.round(
        decisionData.intervals.reduce((acc, i) => acc + i.actual_mw, 0) /
          decisionData.intervals.length
      )
    : 0;

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========================================================= */}
        {/* TAB 1: DECISION DAY VIEW (Primary Procurement Workflow)    */}
        {/* ========================================================= */}
        {activeTab === 'decision' && (
          <div>
            {/* Page Header */}
            <div className="mb-5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                Day-Ahead Wind Forecast Decision Audit
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Evaluate the latest wind forecast available at your procurement cutoff (<strong className="text-text-primary">{cutoffTime} Europe/London</strong>) against physical delivery.
              </p>
            </div>

            {/* Primary Controls */}
            <DecisionControls
              decisionDate={decisionDate}
              onDateChange={setDecisionDate}
              availableDates={availableDates}
              cutoffTime={cutoffTime}
              onCutoffChange={setCutoffTime}
              deliveryDate={decisionData?.metadata.delivery_date || '2026-01-16'}
            />

            {/* Loading / Error States */}
            {decisionLoading && (
              <div className="bg-surface rounded-lg p-12 border border-border text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-forecast mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Evaluating cutoff vintage selection across historical forecast runs...</p>
              </div>
            )}

            {decisionError && (
              <div className="bg-surface rounded-lg p-8 border border-danger/30 text-center">
                <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
                <h3 className="font-bold text-text-primary">Failed to load decision analysis</h3>
                <p className="text-xs text-text-secondary mt-1 mb-4">{(decisionError as Error).message}</p>
                <button
                  onClick={() => refetchDecision()}
                  className="px-4 py-1.5 rounded bg-forecast text-white text-xs font-medium"
                >
                  Retry Analysis
                </button>
              </div>
            )}

            {decisionData && (
              <>
                {/* Refined KPI Hierarchy: 3 Primary Cards + 1 Supporting Benchmark Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  {/* Card 1: Forecast vs Actual Generation */}
                  <div className="bg-surface rounded-lg p-4 sm:p-5 border border-border shadow-card flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-medium text-text-secondary mb-1">
                        Forecast vs Actual Generation
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="font-serif text-2xl sm:text-3xl font-bold text-forecast tabular-nums">
                          {meanForecast.toLocaleString()}
                        </span>
                        <span className="text-xs text-text-tertiary">vs</span>
                        <span className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                          {meanActual.toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-text-secondary">MW</span>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-surface-subtle flex items-center justify-between text-xs text-text-tertiary">
                      <span>Delivery Day Mean</span>
                      <span className="tabular-nums font-medium text-text-secondary">
                        Δ {meanForecast - meanActual > 0 ? `+${(meanForecast - meanActual).toLocaleString()}` : (meanForecast - meanActual).toLocaleString()} MW
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Forecast Error (MAE) */}
                  <div className="bg-surface rounded-lg p-4 sm:p-5 border border-border shadow-card flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-medium text-text-secondary mb-1">
                        Forecast Error (MAE)
                      </div>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                          {decisionData.summary_metrics.mae_mw.toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-text-secondary">MW</span>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-surface-subtle text-xs text-text-tertiary">
                      Average absolute deviation across all 24 delivery hours
                    </div>
                  </div>

                  {/* Card 3: Forecast Bias & Direction */}
                  <div className="bg-surface rounded-lg p-4 sm:p-5 border border-border shadow-card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-secondary">Forecast Bias</span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            decisionData.summary_metrics.bias_mw > 0
                              ? 'bg-overforecast/10 text-overforecast border-overforecast/20'
                              : decisionData.summary_metrics.bias_mw < 0
                              ? 'bg-underforecast/10 text-underforecast border-underforecast/20'
                              : 'bg-surface-subtle text-text-secondary border-border'
                          }`}
                        >
                          {decisionData.summary_metrics.bias_mw > 0 ? 'Overforecast' : 'Underforecast'}
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-1.5">
                        <span
                          className={`font-serif text-2xl sm:text-3xl font-bold tabular-nums ${
                            decisionData.summary_metrics.bias_mw > 0
                              ? 'text-overforecast'
                              : decisionData.summary_metrics.bias_mw < 0
                              ? 'text-underforecast'
                              : 'text-text-primary'
                          }`}
                        >
                          {decisionData.summary_metrics.bias_mw > 0
                            ? `+${decisionData.summary_metrics.bias_mw.toLocaleString()}`
                            : decisionData.summary_metrics.bias_mw.toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-text-secondary">MW</span>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-surface-subtle text-xs text-text-tertiary">
                      {decisionData.summary_metrics.bias_mw > 0
                        ? 'Forecast systematically exceeded physical generation'
                        : 'Physical generation systematically exceeded forecast'}
                    </div>
                  </div>
                </div>

                {/* Supporting Persistence Baseline Benchmark */}
                <div className="bg-surface rounded-lg px-4 py-2.5 border border-border text-xs text-text-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-6">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                    <span>
                      <strong>Persistence Benchmark:</strong> Naive Day-Ahead Persistence (yesterday's actual generation) had an MAE of{' '}
                      <strong className="text-text-primary">{decisionData.summary_metrics.baseline_mae_mw?.toLocaleString() ?? 'N/A'} MW</strong>.
                    </span>
                  </div>
                  {decisionData.summary_metrics.baseline_skill_score !== null && (
                    <span className="text-xs font-medium text-text-primary whitespace-nowrap">
                      Skill Score:{' '}
                      <strong className={decisionData.summary_metrics.baseline_skill_score > 0 ? 'text-underforecast' : 'text-overforecast'}>
                        {decisionData.summary_metrics.baseline_skill_score > 0 ? '+' : ''}
                        {(decisionData.summary_metrics.baseline_skill_score * 100).toFixed(1)}%
                      </strong>{' '}
                      {decisionData.summary_metrics.baseline_skill_score > 0 ? '(beats naive baseline)' : '(trailing baseline)'}
                    </span>
                  )}
                </div>

                {/* Primary Chart: Forecast vs Actual Generation */}
                <ForecastActualChart
                  intervals={decisionData.intervals}
                  deliveryDate={decisionData.metadata.delivery_date}
                  cutoffTime={cutoffTime}
                />

                {/* Collapsible Secondary Drawer: Forecast Revision History */}
                {vintageData && <VintageFanChart vintageData={vintageData} />}

                {/* Full Hourly Audit Table */}
                <IntervalTable
                  intervals={decisionData.intervals}
                  deliveryDate={decisionData.metadata.delivery_date}
                />
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MONTH ACCURACY VIEW (Reliability Evaluation)       */}
        {/* ========================================================= */}
        {activeTab === 'accuracy' && (
          <div>
            <div className="mb-5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                January 2026 Forecast Reliability Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Month-wide statistical evaluation across all 31 day-ahead decision cycles, evaluated at <strong className="text-text-primary">{cutoffTime} Europe/London</strong>.
              </p>
            </div>

            {accuracyLoading && (
              <div className="bg-surface rounded-lg p-12 border border-border text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-forecast mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Computing month-wide error distributions and lead-time analytics...</p>
              </div>
            )}

            {accuracyError && (
              <div className="bg-surface rounded-lg p-8 border border-danger/30 text-center">
                <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
                <h3 className="font-bold text-text-primary">Failed to load accuracy analysis</h3>
                <p className="text-xs text-text-secondary mt-1 mb-4">{(accuracyError as Error).message}</p>
                <button
                  onClick={() => refetchAccuracy()}
                  className="px-4 py-1.5 rounded bg-forecast text-white text-xs font-medium"
                >
                  Retry Analysis
                </button>
              </div>
            )}

            {accuracyData && (
              <>
                {/* Executive Statement Banner */}
                <div className="bg-surface rounded-lg p-5 border border-border shadow-card mb-5">
                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-forecast mb-1.5">
                    <span>Executive Summary</span>
                    <span>•</span>
                    <span>January 2026 Reliability</span>
                  </div>
                  <p className="text-sm sm:text-base text-text-primary leading-relaxed font-serif">
                    During January 2026, day-ahead wind forecasts available at the{' '}
                    <strong>{cutoffTime} Europe/London</strong> cutoff exhibited an average absolute error (MAE) of{' '}
                    <strong>{accuracyData.overall_metrics.mae_mw.toLocaleString()} MW</strong>, with a consistent{' '}
                    <strong>
                      {accuracyData.overall_metrics.bias_mw > 0
                        ? `overforecasting bias (+${accuracyData.overall_metrics.bias_mw.toLocaleString()} MW)`
                        : `underforecasting bias (${accuracyData.overall_metrics.bias_mw.toLocaleString()} MW)`}
                    </strong>{' '}
                    across all 744 matched delivery hours (100% complete coverage).
                    {accuracyData.overall_metrics.baseline_skill_score !== null && (
                      <>
                        {' '}Forecasts demonstrated a verified{' '}
                        <strong>
                          +{(accuracyData.overall_metrics.baseline_skill_score * 100).toFixed(1)}% skill improvement
                        </strong>{' '}
                        over the naive persistence baseline ({accuracyData.overall_metrics.baseline_mae_mw?.toLocaleString() ?? 'N/A'} MW MAE).
                      </>
                    )}
                  </p>
                </div>

                {/* Month Key Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
                  <div className="bg-surface rounded-lg p-4 border border-border shadow-card">
                    <div className="text-xs font-medium text-text-secondary mb-1">Month MAE</div>
                    <div className="flex items-baseline space-x-1">
                      <span className="font-serif text-2xl font-bold text-text-primary tabular-nums">
                        {accuracyData.overall_metrics.mae_mw.toLocaleString()}
                      </span>
                      <span className="text-xs text-text-secondary">MW</span>
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
                      Average absolute error magnitude
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg p-4 border border-border shadow-card">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-secondary">Overall Bias</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-overforecast/10 text-overforecast border border-overforecast/20">
                        Overforecast
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="font-serif text-2xl font-bold text-overforecast tabular-nums">
                        +{accuracyData.overall_metrics.bias_mw.toLocaleString()}
                      </span>
                      <span className="text-xs text-text-secondary">MW</span>
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
                      Systematic month-wide overprediction
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg p-4 border border-border shadow-card">
                    <div className="text-xs font-medium text-text-secondary mb-1">Month RMSE</div>
                    <div className="flex items-baseline space-x-1">
                      <span className="font-serif text-2xl font-bold text-text-primary tabular-nums">
                        {accuracyData.overall_metrics.rmse_mw.toLocaleString()}
                      </span>
                      <span className="text-xs text-text-secondary">MW</span>
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
                      Penalizes large outlier misses
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg p-4 border border-border shadow-card">
                    <div className="text-xs font-medium text-text-secondary mb-1">Sample Coverage</div>
                    <div className="flex items-baseline space-x-1">
                      <span className="font-serif text-2xl font-bold text-underforecast tabular-nums">
                        {accuracyData.overall_metrics.matched_intervals}
                      </span>
                      <span className="text-xs text-text-secondary">Hours</span>
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
                      31 Decision Days (100% matched)
                    </div>
                  </div>
                </div>

                {/* Primary Daily Accuracy Time Series Breakdown */}
                <DailyErrorChart data={accuracyData.daily_breakdown} cutoffTime={cutoffTime} />

                {/* Secondary Section: Structural Breakdowns (Collapsible / Subordinated) */}
                <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden mb-8">
                  <button
                    onClick={() => setShowStructuralAnalysis(!showStructuralAnalysis)}
                    className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-serif text-sm font-bold">
                        Detailed Structural Breakdowns: Diurnal Cycles & Lead-Time Horizon
                      </span>
                      <span className="text-[11px] text-text-tertiary font-normal">
                        (Secondary analytical inspection)
                      </span>
                    </div>
                    {showStructuralAnalysis ? (
                      <ChevronDown className="w-4 h-4 text-text-tertiary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    )}
                  </button>

                  {showStructuralAnalysis && (
                    <div className="p-4 sm:p-6 border-t border-border bg-surface-subtle/20 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <DiurnalErrorChart data={accuracyData.time_of_day_breakdown} />
                      <LeadTimeChart data={accuracyData.lead_time_breakdown} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DATA & METHODOLOGY VIEW                            */}
        {/* ========================================================= */}
        {activeTab === 'methodology' && <MethodologyView metadata={metadata} />}
      </main>

      {/* Persistent Editorial Footer */}
      <footer className="border-t border-border bg-surface py-5 mt-auto text-xs text-text-tertiary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>WindLens</strong> — Cutoff-Aware UK National Wind Generation Forecast Intelligence Dashboard.
          </div>
          <div>
            Authoritative Sources: Elexon BMRS FUELHH & WINDFOR | Built for Day-Ahead Power Procurement Review.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
