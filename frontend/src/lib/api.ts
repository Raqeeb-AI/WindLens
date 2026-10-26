import type { AppMetadata, DecisionResponse, AccuracyResponse, VintageResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1');

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      detail = parsed.detail || parsed.error || errorText;
    } catch {
      // ignore json parse error
    }
    throw new Error(detail || `HTTP Error ${res.status}`);
  }
  return res.json();
}

export async function fetchMetadata(): Promise<AppMetadata> {
  const res = await fetch(`${API_BASE_URL}/metadata`);
  return handleResponse<AppMetadata>(res);
}

export async function fetchDecision(
  decisionDate: string,
  cutoffTime: string = '09:00',
  cutoffTimezone: string = 'Europe/London'
): Promise<DecisionResponse> {
  const params = new URLSearchParams({
    decision_date: decisionDate,
    cutoff_time: cutoffTime,
    cutoff_timezone: cutoffTimezone,
  });
  const res = await fetch(`${API_BASE_URL}/decision?${params.toString()}`);
  return handleResponse<DecisionResponse>(res);
}

export async function fetchAccuracy(
  startDate: string = '2026-01-01',
  endDate: string = '2026-01-31',
  cutoffTime: string = '09:00'
): Promise<AccuracyResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_time: cutoffTime,
  });
  const res = await fetch(`${API_BASE_URL}/accuracy?${params.toString()}`);
  return handleResponse<AccuracyResponse>(res);
}

export async function fetchVintages(
  decisionDate: string,
  cutoffs: string = '07:00,09:00,12:00,16:00,22:00'
): Promise<VintageResponse> {
  const params = new URLSearchParams({
    decision_date: decisionDate,
    cutoffs: cutoffs,
  });
  const res = await fetch(`${API_BASE_URL}/vintages?${params.toString()}`);
  return handleResponse<VintageResponse>(res);
}
