import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetadata, fetchDecision, fetchAccuracy, fetchVintages } from './lib/api';
import { Navbar } from './components/Navbar';
import { MetricCard } from './components/MetricCard';
import { DecisionControls } from './components/DecisionControls';
import { ForecastActualChart } from './components/ForecastActualChart';
import { IntervalTable } from './components/IntervalTable';
import { VintageFanChart } from './components/VintageFanChart';
import { DailyErrorChart } from './components/DailyErrorChart';
import { DiurnalErrorChart } from './components/DiurnalErrorChart';
import { LeadTimeChart } from './components/LeadTimeChart';
import { MethodologyView } from './components/MethodologyView';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'decision' | 'accuracy' | 'methodology'>('decision');
  const [decisionDate, setDecisionDate] = useState<string>('2026-01-15');
  const [cutoffTime, setCutoffTime] = useState<string>('09:00');

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
    refetch: refetchDecision
  } = useQuery({
    queryKey: ['decision', decisionDate, cutoffTime],
    queryFn: () => fetchDecision(decisionDate, cutoffTime),
  });

  const {
    data: vintageData
  } = useQuery({
    queryKey: ['vintages', decisionDate],
    queryFn: () => fetchVintages(decisionDate),
    enabled: activeTab === 'decision',
  });

  const {
    data: accuracyData,
    isLoading: accuracyLoading,
    error: accuracyError,
    refetch: refetchAccuracy
  } = useQuery({
    queryKey: ['accuracy', cutoffTime],
    queryFn: () => fetchAccuracy('2026-01-01', '2026-01-31', cutoffTime),
    enabled: activeTab === 'accuracy',
  });

  const availableDates = metadata?.available_decision_dates || [
    '2026-01-01', '2026-01-05', '2026-01-10', '2026-01-15', '2026-01-20', '2026-01-25', '2026-01-31'
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========================================================= */}
        {/* TAB 1: DECISION DAY VIEW (Hero Procurement Workflow)      */}
        {/* ========================================================= */}
        {activeTab === 'decision' && (
          <div>
            {/* Page Header */}
            <div className="mb-5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                Day-Ahead Wind Decision Review
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Inspect national-level wind forecast availability at configured cutoff <strong className="text-text-primary">{cutoffTime} Europe/London</strong> and reconcile against observed physical actuals.
              </p>
            </div>

            {/* Controls */}
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
                <p className="text-sm text-text-secondary">Evaluating cutoff selection across historical forecast runs...</p>
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
                {/* 5 KPI Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
                  {/* Card 1: Mean Forecast */}
                  <MetricCard
                    title="Forecast Average"
                    value={
                      (
                        decisionData.intervals.reduce((acc, i) => acc + i.forecast_mw, 0) /
                        decisionData.intervals.length
                      ).toFixed(0)
                    }
                    unit="MW"
                    subtitle="Delivery Day Average"
                    tooltip="Average generation forecasted by the latest WINDFOR run published prior to the decision cutoff."
                  />

                  {/* Card 2: Mean Actual */}
                  <MetricCard
                    title="Actual Generation"
                    value={
                      (
                        decisionData.intervals.reduce((acc, i) => acc + i.actual_mw, 0) /
                        decisionData.intervals.length
                      ).toFixed(0)
                    }
                    unit="MW"
                    subtitle="Observed Delivery"
                    tooltip="Average actual wind generation observed during physical delivery across the 24 hours (FUELHH WIND)."
                  />

                  {/* Card 3: MAE */}
                  <MetricCard
                    title="Mean Absolute Error"
                    value={decisionData.summary_metrics.mae_mw}
                    unit="MW"
                    subtitle="Daily Accuracy"
                    tooltip="Mean Absolute Error (MAE): Average absolute magnitude of deviation between forecast and actual."
                  />

                  {/* Card 4: Bias */}
                  <MetricCard
                    title="Forecast Bias"
                    value={
                      decisionData.summary_metrics.bias_mw > 0
                        ? `+${decisionData.summary_metrics.bias_mw}`
                        : decisionData.summary_metrics.bias_mw
                    }
                    unit="MW"
                    badge={{
                      text: decisionData.summary_metrics.bias_mw > 0 ? 'Overforecast' : 'Underforecast',
                      variant: decisionData.summary_metrics.bias_mw > 0 ? 'over' : 'under',
                    }}
                    subtitle={
                      decisionData.summary_metrics.bias_mw > 0
                        ? 'Forecast exceeded delivery'
                        : 'Delivery exceeded forecast'
                    }
                    tooltip="Mean Error (Forecast - Actual). Positive indicates systematic overforecast; negative indicates underforecast."
                  />

                  {/* Card 5: Baseline & Skill Score */}
                  <MetricCard
                    title="Persistence Skill"
                    value={
                      decisionData.summary_metrics.baseline_skill_score !== null
                        ? `${(decisionData.summary_metrics.baseline_skill_score * 100).toFixed(1)}%`
                        : 'N/A'
                    }
                    badge={{
                      text: (decisionData.summary_metrics.baseline_skill_score || 0) > 0 ? 'Beats Baseline' : 'Trailing',
                      variant: (decisionData.summary_metrics.baseline_skill_score || 0) > 0 ? 'success' : 'warning',
                    }}
                    subtitle={`Baseline MAE: ${decisionData.summary_metrics.baseline_mae_mw ?? 'N/A'} MW`}
                    tooltip="Skill Score vs naive Day-Ahead Persistence (yesterday's generation). Formula: 1 - (MAE / Baseline_MAE)."
                  />
                </div>

                {/* Primary Time Series Chart */}
                <ForecastActualChart
                  intervals={decisionData.intervals}
                  deliveryDate={decisionData.metadata.delivery_date}
                  cutoffTime={cutoffTime}
                />

                {/* Multi-Vintage Forecast Evolution */}
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
        {/* TAB 2: MONTH ACCURACY VIEW (Full January Evaluation)       */}
        {/* ========================================================= */}
        {activeTab === 'accuracy' && (
          <div>
            <div className="mb-5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                January 2026 Procurement Accuracy Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Month-wide statistical evaluation across all 31 decision days, evaluated at cutoff <strong className="text-text-primary">{cutoffTime} Europe/London</strong>.
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
                {/* Month KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
                  <MetricCard
                    title="Month MAE"
                    value={accuracyData.overall_metrics.mae_mw}
                    unit="MW"
                    subtitle="Average Absolute Error"
                    tooltip="Mean Absolute Error across all 744 hourly delivery intervals in January 2026."
                  />
                  <MetricCard
                    title="Overall Bias"
                    value={
                      accuracyData.overall_metrics.bias_mw > 0
                        ? `+${accuracyData.overall_metrics.bias_mw}`
                        : accuracyData.overall_metrics.bias_mw
                    }
                    unit="MW"
                    badge={{
                      text: accuracyData.overall_metrics.bias_mw > 0 ? 'Overforecast' : 'Underforecast',
                      variant: accuracyData.overall_metrics.bias_mw > 0 ? 'over' : 'under',
                    }}
                    subtitle="Systematic Monthly Bias"
                  />
                  <MetricCard
                    title="Month RMSE"
                    value={accuracyData.overall_metrics.rmse_mw}
                    unit="MW"
                    subtitle="Root Mean Square Error"
                    tooltip="Penalizes large extreme outlier forecast misses."
                  />
                  <MetricCard
                    title="Baseline Skill"
                    value={
                      accuracyData.overall_metrics.baseline_skill_score !== null
                        ? `${(accuracyData.overall_metrics.baseline_skill_score * 100).toFixed(1)}%`
                        : 'N/A'
                    }
                    badge={{
                      text: (accuracyData.overall_metrics.baseline_skill_score || 0) > 0 ? 'Superior' : 'Trailing',
                      variant: (accuracyData.overall_metrics.baseline_skill_score || 0) > 0 ? 'success' : 'warning',
                    }}
                    subtitle={`Baseline: ${accuracyData.overall_metrics.baseline_mae_mw} MW`}
                  />
                  <MetricCard
                    title="Sample Size"
                    value={accuracyData.overall_metrics.matched_intervals}
                    unit="Hours"
                    subtitle="31 Decision Days"
                    tooltip="100% complete hourly coverage without missing intervals."
                  />
                </div>

                {/* Daily Time Series Breakdown */}
                <DailyErrorChart data={accuracyData.daily_breakdown} cutoffTime={cutoffTime} />

                {/* Grid of 2 Analytical Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <DiurnalErrorChart data={accuracyData.time_of_day_breakdown} />
                  <LeadTimeChart data={accuracyData.lead_time_breakdown} />
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
