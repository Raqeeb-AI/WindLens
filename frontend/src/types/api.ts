export interface AppMetadata {
  app_name: string;
  version: string;
  target_period: string;
  available_decision_dates: string[];
  available_delivery_dates: string[];
  default_cutoff_time: string;
  default_cutoff_timezone: string;
  data_sources: {
    actuals_source: string;
    forecast_source: string;
    fuelhh_unit: string;
    windfor_unit: string;
    alignment_method: string;
  };
}

export interface SummaryMetrics {
  total_intervals: number;
  matched_intervals: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  mape_pct: number | null;
  overforecast_count: number;
  underforecast_count: number;
  exact_count: number;
  baseline_mae_mw: number | null;
  baseline_skill_score: number | null;
}

export interface DecisionInterval {
  start_time: string;
  hour_of_day: number;
  forecast_mw: number;
  actual_mw: number;
  error_mw: number;
  abs_error_mw: number;
  percentage_error: number | null;
  error_direction: 'OVERFORECAST' | 'UNDERFORECAST' | 'EXACT';
  publish_time: string;
  lead_time_hours: number;
  age_at_cutoff_hours: number;
  baseline_mw: number | null;
  baseline_error_mw: number | null;
}

export interface DecisionResponse {
  metadata: {
    decision_date: string;
    delivery_date: string;
    cutoff_timestamp_utc: string;
    cutoff_time: string;
    cutoff_timezone: string;
    is_default_cutoff: boolean;
    cutoff_assumption_note: string;
  };
  summary_metrics: SummaryMetrics;
  intervals: DecisionInterval[];
}

export interface DailyBreakdownItem {
  decision_date: string;
  delivery_date: string;
  matched_intervals: number;
  mae_mw: number;
  bias_mw: number;
  rmse_mw: number;
  mape_pct: number | null;
  baseline_mae_mw: number | null;
  baseline_skill_score: number | null;
  mean_actual_mw: number;
  mean_forecast_mw: number;
}

export interface TimeOfDayItem {
  hour_of_day: number;
  sample_count: number;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  mae_mw: number;
  bias_mw: number;
  rmse_mw: number;
  mape_pct: number | null;
}

export interface LeadTimeItem {
  lead_time_band: string;
  min_lead_time_hours: number;
  max_lead_time_hours: number | null;
  sample_count: number;
  mae_mw: number;
  bias_mw: number;
  rmse_mw: number;
  mape_pct: number | null;
}

export interface AccuracyResponse {
  metadata: {
    start_decision_date: string;
    end_decision_date: string;
    cutoff_time: string;
    cutoff_timezone: string;
    total_decision_days: number;
    total_evaluated_intervals: number;
  };
  overall_metrics: SummaryMetrics;
  daily_breakdown: DailyBreakdownItem[];
  time_of_day_breakdown: TimeOfDayItem[];
  lead_time_breakdown: LeadTimeItem[];
}

export interface VintageSeriesPoint {
  start_time: string;
  hour_of_day: number;
  forecast_mw: number;
  error_mw: number;
  publish_time: string;
  lead_time_hours: number;
}

export interface VintageRun {
  cutoff_time: string;
  cutoff_timestamp_utc: string;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  mape_pct: number | null;
  mean_forecast_mw: number;
  series: VintageSeriesPoint[];
}

export interface VintageActualPoint {
  start_time: string;
  hour_of_day: number;
  actual_mw: number;
}

export interface VintageResponse {
  metadata: {
    decision_date: string;
    delivery_date: string;
    cutoffs_evaluated: string[];
  };
  actuals: VintageActualPoint[];
  vintages: VintageRun[];
}
