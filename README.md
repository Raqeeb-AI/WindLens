# WindLens

**Cutoff-Aware UK National Wind Generation Forecast Intelligence Dashboard**  
*Built for Day-Ahead Electricity Procurement Decision Evaluation (January 2026)*

[![Python Tests](https://img.shields.io/badge/pytest-11%20passed-267568?style=flat-square)](backend/tests)
[![TypeScript](https://img.shields.io/badge/typescript-strict%20pass-blue?style=flat-square)](frontend)
[![Data Provenance](https://img.shields.io/badge/Elexon%20BMRS-FUELHH%20%26%20WINDFOR-D95635?style=flat-square)](https://bmrs.elexon.co.uk)
[![Audit Status](https://img.shields.io/badge/Audit-100%25%20Verified-267568?style=flat-square)](docs/pre-deployment-audit.md)

---

## 1. Product Objective

WindLens is an evidence-based intelligence platform designed for UK electricity trading and power procurement professionals. It answers three essential operational questions:

1. **Forecast Availability at Decision Cutoff:** What national-level wind generation forecast was actually available at a specified day-ahead procurement cutoff (e.g., Day-Ahead at 09:00 Europe/London)?
2. **Reconciliation Against Physical Delivery:** How did that cutoff-selected forecast compare with observed physical wind generation for the corresponding delivery intervals (D+1, 00:00 to 23:00 UTC)?
3. **Statistical Bias and Forecast Reliability:** How accurate, biased, and reliable were the forecasts across the entirety of January 2026?

> **Fundamental Date Semantics:** Decision dates ($D$) and physical delivery dates ($D+1$) are distinct concepts. Decisions made between 1 January and 31 January 2026 govern physical power deliveries between 2 January and 1 February 2026.

---

## 2. Authoritative Data Scope & Verified Findings

WindLens is built strictly upon two official, public Elexon Insights Solution (BMRS) data streams:

1. **FUELHH (Actual Generation):**
   - Stream endpoint: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
   - Filtered to: `fuelType=WIND` (Great Britain transmission-connected wind farms).
   - Physical Unit: **Megawatts (MW)** interval-average power delivered.
   - Granularity: **Half-hourly settlement periods (30 minutes)**.
   - Official documentation: [Elexon FUELHH API](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
2. **WINDFOR (Wind Forecast Generation):**
   - Stream endpoint: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
   - Source: National Energy System Operator (NESO) national wind generation forecast.
   - Physical Unit: **Megawatts (MW)** forecasted interval-average power.
   - Granularity: **Hourly delivery intervals (60 minutes)**.
   - Horizon & Cadence: **72-hour rolling horizon**, published ~every 2–4 hours (~8 runs/day).
   - Official documentation: [Elexon WINDFOR API](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)

### Key Empirical Findings:
- **Historical Vintages Retained:** Over 21,600 forecast records across 296 distinct publication runs were verified in BMRS. Each delivery interval in January 2026 retains a median of **24 distinct historical publication runs** (ranging from 8 to 32). Zero synthetic or simulated vintages were introduced.
- **Granularity Alignment:** Hourly actual generation is computed as the exact arithmetic mean of the two consecutive 30-minute FUELHH settlement periods:
  $$\bar{G}_{\text{actual, hour}} = \frac{G_{\text{p1}} + G_{\text{p2}}}{2}$$
  In our audit, **100% of target delivery hours** had complete pairs of settlement periods, ensuring zero interpolation error.
- **January 2026 Overall Performance (09:00 Cutoff):**
  - Evaluated Delivery Hours: **744 hours** (31 decision days $\times$ 24 hours, 100% complete coverage).
  - Mean Absolute Error (MAE): **2,038.91 MW**.
  - Systematic Forecast Bias: **+1,747.89 MW** (systematic overforecasting tendency).
  - Root Mean Square Error (RMSE): **2,504.76 MW**.
  - Day-Ahead Persistence Baseline MAE: **4,261.83 MW**.
  - Forecast Skill Score vs Persistence: **+52.16%** (forecast achieved 52% error reduction over naive baseline).

---

## 3. The Critical Forecast-Vintage Selection Rule

To evaluate real-world procurement decisions without temporal leakage, WindLens enforces strict lookahead protection:

For each delivery interval $t$ and decision cutoff timestamp $c$:

$$\text{Eligible Forecasts}(t, c) = \{ r \in \text{WINDFOR} \mid r.\text{startTime} = t \text{ and } r.\text{publishTime} \le c \}$$

$$\text{Selected Forecast}(t, c) = \operatorname{argmax}_{r \in \text{Eligible Forecasts}(t, c)} (r.\text{publishTime})$$

- **Strict Lookahead Protection:** Any forecast published after the cutoff ($r.\text{publishTime} > c$) is strictly excluded under all circumstances, even if it had a lower error.
- **Illustrative Cutoff Policy:** The default cutoff of D at 09:00 Europe/London is an illustrative demonstration assumption and remains user-configurable (07:00, 09:00, 12:00, 16:00, 22:00).

---

## 4. Repository File & Folder Tree

```
WindLens/
├── api/
│   └── index.py                     # Vercel serverless ASGI entrypoint (imports FastAPI app)
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application & unified React SPA static hosting
│   │   ├── api/
│   │   │   ├── router.py            # Main API router mounting all routes under /api/v1
│   │   │   ├── deps.py              # Dependency injection for SnapshotRepository
│   │   │   └── routes/              # Modular API endpoints
│   │   │       ├── health.py        # /health (status, uptime, snapshot health)
│   │   │       ├── metadata.py      # /metadata (available dates, units, sources)
│   │   │       ├── decision.py      # /decision (reconciles single delivery day at cutoff)
│   │   │       ├── accuracy.py      # /accuracy (month-wide MAE, bias, diurnal & lead-time)
│   │   │       └── vintages.py      # /vintages (multi-cutoff sensitivity series)
│   │   ├── domain/                  # Pure business rules & Pydantic models (no HTTP dependencies)
│   │   │   ├── models.py            # Data transfer objects & schemas
│   │   │   └── rules.py             # Pure cutoff selection & lookahead enforcement logic
│   │   ├── analytics/               # Numerical analytics engine
│   │   │   ├── metrics.py           # MAE, RMSE, Bias, MAPE, Baseline Skill score
│   │   │   └── matching.py          # Harmonization of FUELHH (30m) & WINDFOR (60m)
│   │   ├── repositories/            # In-memory cached repository backed by Parquet (<3ms)
│   │   │   └── snapshot_repository.py
│   │   └── core/                    # Environment configuration & CORS settings
│   │       └── config.py
│   ├── etl/                         # Verification probes, live BMRS fetchers, snapshot builder
│   │   ├── probe_elexon.py          # Initial live BMRS API probe
│   │   ├── fetch.py                 # Stream fetcher for January 2026 FUELHH & WINDFOR
│   │   ├── build_snapshot.py        # Snapshot builder (outputs processed Parquet tables)
│   │   └── audit_data.py            # Comprehensive verification & lookahead audit script
│   ├── tests/                       # Automated Pytest suite
│   │   ├── unit/                    # Unit tests for cutoff selection and metric formulas
│   │   │   ├── test_selection_rule.py
│   │   │   └── test_metrics.py
│   │   └── integration/             # FastAPI integration tests across all endpoints
│   │       └── test_api_endpoints.py
│   └── requirements.txt             # Locked Python dependencies
│
├── frontend/                        # React 19 + Vite 8 + TypeScript client application
│   ├── src/
│   │   ├── components/              # Editorial UI components
│   │   │   ├── Navbar.tsx           # Compact header with view tabs & status badge
│   │   │   ├── Sidebar.tsx          # Navigation sidebar with brand logo & live system indicators
│   │   │   ├── CalendarPopover.tsx  # Dual-column interactive calendar & verified case studies
│   │   │   ├── DecisionControls.tsx # Date selector, dual date badge, compact cutoff picker
│   │   │   ├── ForecastActualChart.tsx # Centerpiece time-series with non-color visual distinctions
│   │   │   ├── VintageFanChart.tsx  # Collapsible multi-cutoff forecast revision drawer
│   │   │   ├── IntervalTable.tsx    # 24-hour audit table with column sorting & CSV export
│   │   │   ├── DailyErrorChart.tsx  # Month daily error bar/line chart with high-error threshold
│   │   │   ├── DiurnalErrorChart.tsx# Diurnal accuracy patterns by hour of day
│   │   │   ├── LeadTimeChart.tsx    # Forecast degradation across lead-time horizons
│   │   │   └── MethodologyView.tsx  # Client-oriented Q&A guide with collapsible formulas
│   │   ├── types/api.ts             # TypeScript API interfaces mirrored from backend contracts
│   │   ├── lib/api.ts               # HTTP client with Axios / fetch (auto DEV/PROD fallback)
│   │   ├── App.tsx                  # Root application shell with 3-tier KPI hierarchy
│   │   ├── main.tsx                 # Application entry point with React Query provider
│   │   └── index.css                # Curated editorial design tokens (#FAF8F4, #D95635, etc.)
│   ├── dist/                        # Production build bundle (served by FastAPI / Vercel CDN)
│   ├── package.json                 # Locked Node dependencies
│   └── tailwind.config.js           # Curated editorial theme configuration
│
├── data/
│   ├── raw/                         # Raw Elexon stream sample payloads (JSON)
│   └── processed/                   # High-performance Parquet & JSON snapshots
│       ├── actuals_hourly.parquet   # 841 hourly actual records (24 KB)
│       └── forecasts_vintages.parquet # 21,608 forecast vintage records (98 KB)
│
├── docs/                            # Comprehensive engineering and audit documentation
│   ├── phase-1-findings.md          # Initial Elexon verification & schema probe findings
│   ├── pre-deployment-audit.md      # Formal pre-deployment verification & test report
│   └── deployment-guide.md          # Zero-cost Vercel & local deployment instructions
│
├── Dockerfile                       # Multi-stage production container (Node build + Python slim)
├── docker-compose.yml               # Local container orchestration
├── package.json                     # Root build coordinator for Vercel
├── pyproject.toml                   # Pytest configuration
├── requirements.txt                 # Root runtime Python dependencies for Vercel Serverless
└── vercel.json                      # Vercel Hobby serverless routing & Parquet asset bundling
```

---

## 5. Deployment & Execution Options

### Option A: Zero-Cost Vercel Serverless Deployment (Recommended)
WindLens is pre-configured for **100% free Vercel Hobby** deployment with zero paid infrastructure:
- **Frontend:** Built by Vite and hosted on Vercel's global Edge CDN.
- **Backend:** FastAPI runs inside an AWS Lambda Python serverless function via `api/index.py` with zero idle compute cost.
- **Data Snapshots:** Lightweight Parquet files (~122 KB total) are bundled directly into the function sandbox (`vercel.json` includes `data/processed/**`).

**Deploying to Vercel in 2 minutes:**
1. Push this repository to your GitHub account.
2. In [Vercel Dashboard](https://vercel.com/new), click **"Add New Project"** and import the repository.
3. Keep default settings (`Framework Preset: Other`, Root directory: `./`).
4. Click **Deploy**. Vercel will run `cd frontend && npm run build`, bundle `api/index.py` with `requirements.txt`, and provide a permanent `*.vercel.app` production URL.

### Option B: Local Unified FastAPI Serving (Simplest Local)
The FastAPI backend serves both the REST API and the pre-built React frontend bundle from `frontend/dist`:

```bash
# 1. Install backend dependencies
pip install -r backend/requirements.txt

# 2. Launch the backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Option C: Independent Frontend Development
```bash
# Terminal 1: Backend API
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Vite Dev Server
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 6. Docker Instructions

WindLens includes a multi-stage production container that builds the frontend and bundles the FastAPI backend into a lean Python runtime:

```bash
# Build the Docker image
docker build -t windlens .

# Run the container
docker run -p 8000:8000 windlens
```

Alternatively, use Docker Compose:
```bash
docker-compose up --build
```
Access the application at **[http://localhost:8000](http://localhost:8000)**.

---

## 7. Running the Automated Test Suite

Execute the comprehensive automated test suite covering cutoff lookahead protection, metric formulas, and API contract integration:

```bash
pytest -v
```

Expected output:
```
backend/tests/integration/test_api_endpoints.py::test_health_endpoint PASSED        [  9%]
backend/tests/integration/test_api_endpoints.py::test_metadata_endpoint PASSED      [ 18%]
backend/tests/integration/test_api_endpoints.py::test_decision_endpoint PASSED      [ 27%]
backend/tests/integration/test_api_endpoints.py::test_accuracy_endpoint PASSED      [ 36%]
backend/tests/integration/test_api_endpoints.py::test_vintages_endpoint PASSED      [ 45%]
backend/tests/unit/test_metrics.py::test_calculate_metrics_formulas PASSED          [ 54%]
backend/tests/unit/test_metrics.py::test_calculate_metrics_empty PASSED             [ 63%]
backend/tests/unit/test_selection_rule.py::test_select_forecast_latest_before_cutoff PASSED [ 72%]
backend/tests/unit/test_selection_rule.py::test_select_forecast_never_selects_post_cutoff PASSED [ 81%]
backend/tests/unit/test_selection_rule.py::test_select_forecast_exact_cutoff_boundary_eligible PASSED [ 90%]
backend/tests/unit/test_selection_rule.py::test_select_forecast_empty_candidates PASSED [100%]
============================= 11 passed in 2.59s ==============================
```

To run the frontend TypeScript type check:
```bash
cd frontend
npx tsc --noEmit
```

---

## 8. Limitations & Scope Boundaries

When reviewing this application, please observe the following explicit scope boundaries:
1. **Illustrative Cutoff Policy:** The default 09:00 Europe/London cutoff is an illustrative modelling assumption for power procurement evaluation, not an official industry-wide gate closure or auction deadline.
2. **National Transmission-Connected Wind Only:** WindLens audits national-level Great Britain wind generation (`fuelType=WIND` in BMRS). It does not model embedded/rooftop solar, system demand, regional network constraints, or imbalance market cashout settlement prices.
3. **Physical Accuracy Focus:** The platform evaluates physical forecast error in Megawatts (MW). It does not provide automated trading algorithms, financial hedging advice, or monetary savings calculations.

---

## 9. AI Tool Disclosure

As required by the technical assessment instructions:
- **AI Coding Assistant:** Google Antigravity (powered by Gemini 3.8 Flash) was used as an AI pair programmer to assist with inspecting Elexon BMRS documentation, formulating mathematical cutoff selection rules, generating reproducible verification probe scripts, constructing Pydantic and TypeScript contract schemas, and scaffolding React/Recharts visualization components.
- **Verification Authority:** All data points, numerical metrics, schema fields, and performance benchmarks were empirically verified against live Elexon BMRS servers, processed Parquet snapshots, and automated test suites. Zero synthetic or AI-hallucinated numbers are presented as fact.
