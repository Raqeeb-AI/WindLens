import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetadata, fetchDecision, fetchAccuracy, fetchVintages } from './lib/api';
import { Sidebar, type NavTab } from './components/Sidebar';
import { DecisionControls } from './components/DecisionControls';
import { ForecastActualChart } from './components/ForecastActualChart';
import { IntervalTable } from './components/IntervalTable';
import { ForecastView } from './components/ForecastView';
import { AccuracyView } from './components/AccuracyView';
import { DataView } from './components/DataView';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [decisionDate, setDecisionDate] = useState<string>('2026-01-15');
  const [cutoffTime, setCutoffTime] = useState<string>('09:00');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

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
    enabled: activeTab === 'forecast' || activeTab === 'overview',
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

  const handleReset = () => {
    setDecisionDate('2026-01-15');
    setCutoffTime('09:00');
  };

  const handleSelectDateFromAccuracy = (newDate: string) => {
    setDecisionDate(newDate);
    setActiveTab('forecast');
  };

  // Interpretation sentence derivation
  const getInterpretationSentence = (bias: number) => {
    if (bias > 200) {
      return 'The forecast tended to over-predict wind generation over this delivery day.';
    } else if (bias < -200) {
      return 'The forecast tended to under-predict wind generation over this delivery day.';
    } else {
      return 'There was little average directional bias, although individual intervals may still have large errors.';
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col md:flex-row font-sans selection:bg-forecast/20 selection:text-forecast">
      {/* Left Sidebar (Desktop fixed, Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(!mobileOpen)}
      />

      {/* Main Workspace */}
      <div className="flex-1 md:ml-60 lg:ml-72 flex flex-col min-h-screen transition-all">
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* ========================================================= */}
          {/* 1. OVERVIEW (Default Landing View)                       */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in-up space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary">
                    Overview
                  </h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Review the national wind forecast available at a decision cutoff and compare it with what happened next.
                  </p>
                </div>
                <span className="self-start sm:self-auto text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface border border-border text-text-tertiary">
                  January 2026 snapshot
                </span>
              </div>

              {/* Decision Controls */}
              <DecisionControls
                decisionDate={decisionDate}
                onDateChange={setDecisionDate}
                availableDates={availableDates}
                cutoffTime={cutoffTime}
                onCutoffChange={setCutoffTime}
                deliveryDate={decisionData?.metadata.delivery_date || '2026-01-16'}
                onReset={handleReset}
              />

              {/* Shimmer Skeleton Loading State */}
              {decisionLoading && (
                <div className="space-y-6 animate-pulse">
                  <div className="h-80 bg-surface rounded-xl border border-border flex flex-col items-center justify-center p-8 text-center shadow-card">
                    <RefreshCw className="w-5 h-5 animate-spin text-forecast mx-auto mb-3" />
                    <p className="text-xs font-semibold text-text-primary">
                      Evaluating forecast cutoff selection for {decisionDate}...
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-1">
                      Querying Elexon WINDFOR and FUELHH streams at {cutoffTime} Europe/London
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-28 bg-surface rounded-xl border border-border p-4 shadow-card skeleton-shimmer" />
                    ))}
                  </div>
                </div>
              )}

              {/* Error State */}
              {decisionError && (
                <div className="bg-surface rounded-xl p-6 border border-danger/30 text-center shadow-card">
                  <AlertCircle className="w-6 h-6 text-danger mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-text-primary">Unable to load decision analysis</h3>
                  <p className="text-xs text-text-secondary mt-1 mb-3">{(decisionError as Error).message}</p>
                  <button
                    type="button"
                    onClick={() => refetchDecision()}
                    className="touch-press px-4 py-2 rounded-lg bg-forecast text-white text-xs font-semibold hover:bg-forecast/90 transition-all shadow-xs"
                  >
                    Retry
                  </button>
                </div>
              )}

              {decisionData && (
                <>
                  {/* Centerpiece: Forecast vs Actual Generation Chart */}
                  <ForecastActualChart
                    intervals={decisionData.intervals}
                    deliveryDate={decisionData.metadata.delivery_date}
                    cutoffTime={cutoffTime}
                  />

                  {/* 3 Primary Result Blocks: MAE, Bias, Coverage */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-4">
                    {/* Takeaway 1: Typical Error (MAE) */}
                    <div className="bg-surface rounded-xl p-4 border border-border shadow-card card-hover">
                      <div className="text-xs font-medium text-text-secondary mb-1">
                        Typical Error (MAE)
                      </div>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                          {decisionData.summary_metrics.mae_mw.toLocaleString()}
                        </span>
                        <span className="text-xs text-text-secondary">MW</span>
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
                        On average, the forecast missed actual generation by{' '}
                        <strong>{decisionData.summary_metrics.mae_mw.toLocaleString()} MW</strong>.
                      </p>
                    </div>

                    {/* Takeaway 2: Forecast Bias */}
                    <div className="bg-surface rounded-xl p-4 border border-border shadow-card card-hover">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-secondary">Forecast Bias</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            decisionData.summary_metrics.bias_mw > 0
                              ? 'bg-overforecast/10 text-overforecast border-overforecast/20'
                              : decisionData.summary_metrics.bias_mw < 0
                              ? 'bg-underforecast/10 text-underforecast border-underforecast/20'
                              : 'bg-surface-subtle text-text-secondary border-border'
                          }`}
                        >
                          {decisionData.summary_metrics.bias_mw > 0 ? 'Over-forecast' : 'Under-forecast'}
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
                        <span className="text-xs text-text-secondary">MW</span>
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
                        The forecast was{' '}
                        <strong>
                          {Math.abs(decisionData.summary_metrics.bias_mw).toLocaleString()} MW{' '}
                          {decisionData.summary_metrics.bias_mw > 0 ? 'higher' : 'lower'}
                        </strong>{' '}
                        than actual on average.
                      </p>
                    </div>

                    {/* Takeaway 3: Data Coverage */}
                    <div className="bg-surface rounded-xl p-4 border border-border shadow-card card-hover">
                      <div className="text-xs font-medium text-text-secondary mb-1">
                        Data Coverage
                      </div>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="font-serif text-2xl sm:text-3xl font-bold text-underforecast tabular-nums">
                          {decisionData.summary_metrics.matched_intervals} / {decisionData.summary_metrics.total_intervals}
                        </span>
                        <span className="text-xs text-text-secondary">intervals</span>
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
                        100% matched observations for physical delivery on {decisionData.metadata.delivery_date}.
                      </p>
                    </div>
                  </div>

                  {/* Short Data-Driven Interpretation Sentence */}
                  <div className="bg-surface rounded-xl px-4 py-3.5 border border-border shadow-card mb-6 text-xs text-text-secondary flex items-start sm:items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-forecast mt-1.5 sm:mt-0 flex-shrink-0" />
                    <div>
                      <strong className="text-text-primary">Interpretation: </strong>
                      <span>{getInterpretationSentence(decisionData.summary_metrics.bias_mw)}</span>
                    </div>
                  </div>

                  {/* Hourly Detail (Collapsed by default disclosure) */}
                  <IntervalTable
                    intervals={decisionData.intervals}
                    deliveryDate={decisionData.metadata.delivery_date}
                  />

                  {/* Quiet Bottom Provenance Note */}
                  <div className="text-[11px] text-text-tertiary flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-border gap-1">
                    <span>
                      Data sources: Elexon FUELHH (WIND) & WINDFOR · Cutoff: {cutoffTime} Europe/London
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('data')}
                      className="touch-press text-forecast hover:underline text-left sm:text-right font-medium"
                    >
                      Learn more in Data →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. FORECAST (Day-Level Detailed Deep Dive)                */}
          {/* ========================================================= */}
          {activeTab === 'forecast' && (
            <div className="animate-fade-in-up">
              {decisionLoading && (
                <div className="bg-surface rounded-xl p-12 border border-border text-center shadow-card">
                  <RefreshCw className="w-5 h-5 animate-spin text-forecast mx-auto mb-2.5" />
                  <p className="text-xs text-text-secondary">
                    Loading detailed forecast analysis...
                  </p>
                </div>
              )}

              {decisionError && (
                <div className="bg-surface rounded-xl p-6 border border-danger/30 text-center shadow-card">
                  <AlertCircle className="w-6 h-6 text-danger mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-text-primary">Failed to load forecast view</h3>
                  <p className="text-xs text-text-secondary mt-1 mb-3">{(decisionError as Error).message}</p>
                  <button
                    type="button"
                    onClick={() => refetchDecision()}
                    className="touch-press px-4 py-2 rounded-lg bg-forecast text-white text-xs font-semibold hover:bg-forecast/90 transition-all shadow-xs"
                  >
                    Retry
                  </button>
                </div>
              )}

              {decisionData && (
                <ForecastView
                  decisionData={decisionData}
                  vintageData={vintageData}
                  decisionDate={decisionDate}
                  onDateChange={setDecisionDate}
                  availableDates={availableDates}
                  cutoffTime={cutoffTime}
                  onCutoffChange={setCutoffTime}
                  onReset={handleReset}
                />
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. ACCURACY (Month-Level Reliability Performance)         */}
          {/* ========================================================= */}
          {activeTab === 'accuracy' && (
            <div className="animate-fade-in-up">
              {accuracyLoading && (
                <div className="bg-surface rounded-xl p-12 border border-border text-center shadow-card">
                  <RefreshCw className="w-5 h-5 animate-spin text-forecast mx-auto mb-2.5" />
                  <p className="text-xs text-text-secondary">
                    Computing month-wide error distributions for January 2026...
                  </p>
                </div>
              )}

              {accuracyError && (
                <div className="bg-surface rounded-xl p-6 border border-danger/30 text-center shadow-card">
                  <AlertCircle className="w-6 h-6 text-danger mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-text-primary">Failed to load accuracy analysis</h3>
                  <p className="text-xs text-text-secondary mt-1 mb-3">{(accuracyError as Error).message}</p>
                  <button
                    type="button"
                    onClick={() => refetchAccuracy()}
                    className="touch-press px-4 py-2 rounded-lg bg-forecast text-white text-xs font-semibold hover:bg-forecast/90 transition-all shadow-xs"
                  >
                    Retry
                  </button>
                </div>
              )}

              {accuracyData && (
                <AccuracyView
                  data={accuracyData}
                  cutoffTime={cutoffTime}
                  onCutoffChange={setCutoffTime}
                  onSelectDate={handleSelectDateFromAccuracy}
                />
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. DATA (Source and Quality Context)                      */}
          {/* ========================================================= */}
          {activeTab === 'data' && (
            <div className="animate-fade-in-up">
              <DataView metadata={metadata} />
            </div>
          )}
        </main>

        {/* Minimal Global Footer */}
        <footer className="border-t border-border bg-surface/50 py-3.5 mt-auto text-[11px] text-text-tertiary">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
            <span>
              <strong>WindLens</strong> — Cutoff-aware UK national wind generation forecast intelligence.
            </span>
            <span>
              Authoritative Elexon BMRS data for January 2026 decision evaluation.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
