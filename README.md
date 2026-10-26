# WindLens

**Cutoff-Aware UK National Wind Generation Forecast Intelligence Platform**  
*Built for Day-Ahead Electricity Procurement Decision Evaluation (January 2026)*

[![Live Deployment](https://img.shields.io/badge/Vercel-Live%20Deployment-000000?style=flat-square&logo=vercel)](https://x7k2m9p4-livid.vercel.app/)
[![Python Tests](https://img.shields.io/badge/pytest-11%20passed-267568?style=flat-square)](backend/tests)
[![TypeScript](https://img.shields.io/badge/typescript-strict%20pass-blue?style=flat-square)](frontend)
[![Data Provenance](https://img.shields.io/badge/Elexon%20BMRS-FUELHH%20%26%20WINDFOR-D95635?style=flat-square)](https://bmrs.elexon.co.uk)
[![Repository](https://img.shields.io/badge/GitHub-x7k2m9p4-181717?style=flat-square&logo=github)](https://github.com/Raqeeb-AI/x7k2m9p4)

---

### Verified Live Deployment & Links
- **Interactive Web Application:** [https://x7k2m9p4-livid.vercel.app/](https://x7k2m9p4-livid.vercel.app/)
- **Interactive REST API Documentation (Swagger UI):** [https://x7k2m9p4-livid.vercel.app/docs](https://x7k2m9p4-livid.vercel.app/docs)
- **OpenAPI Schema Specification:** [https://x7k2m9p4-livid.vercel.app/openapi.json](https://x7k2m9p4-livid.vercel.app/openapi.json)
- **Public GitHub Repository:** [https://github.com/Raqeeb-AI/x7k2m9p4](https://github.com/Raqeeb-AI/x7k2m9p4)

---

## 1. Product Objective & Executive Summary

WindLens is an evidence-based analytics platform designed for Great Britain electricity trading desks, renewable portfolio optimizers, and power procurement teams. In day-ahead power markets, contracts are committed under strict operational cutoffs prior to physical delivery. Evaluating historical trading decisions against modern forecast updates introduces severe lookahead bias if the evaluation framework fails to isolate what information was **actually known** when the decision was finalized.

WindLens solves this challenge by implementing an audit-grade, cutoff-aware forecast replay engine for the entirety of January 2026. It addresses three core operational questions:

1. **Information Horizon at Decision Cutoff:** Exactly what national wind generation forecast was available to traders at a specified day-ahead cutoff time (e.g., Day-Ahead at 09:00 Europe/London)?
2. **Physical Delivery Reconciliation:** How did the cutoff-locked forecast perform against physical transmission-connected generation for the 24 hourly settlement intervals of the delivery day ($D+1$, 00:00 to 23:00 UTC)?
3. **Statistical Bias & Forecast Skill:** How consistent was forecast bias across January 2026, and how much economic and volumetric risk reduction did the forecast provide relative to standard persistence baselines?

> **Important Date Semantics:** Decision dates ($D$) and physical delivery dates ($D+1$) represent distinct time horizons. Day-ahead procurement decisions finalized between 1 January and 31 January 2026 govern physical power deliveries between 2 January and 1 February 2026.

---

## 2. Key Product Features

- **Cutoff-Aware Replay Engine (Zero Temporal Leakage):** Dynamically filters rolling forecast vintages to isolate the most recent forecast published strictly on or before the decision cutoff.
- **Configurable Cutoff Policy:** Default baseline assumption is set to Day-Ahead at 09:00 Europe/London *(illustrative demonstration assumption—not a statutory market deadline)*, with instant toggles for 07:00, 12:00, 16:00, and 22:00 cutoffs.
- **Single Delivery Day Reconciliation:** Dual-line comparison of selected hourly forecast vintages vs. physical delivery actuals with non-color-only accessible chart markers, confidence delta ribbons, and hover inspections.
- **Vintage Horizon Fan & Evolution Drawer:** Multi-cutoff sensitivity series visualizing how forecasts for each delivery hour evolved across consecutive publication cycles prior to gate closure.
- **24-Hour Settlement Interval Audit Table:** Granular hour-by-hour audit table reporting forecast, actual, delta (MW & %), over/under-forecast direction, forecast age at cutoff, lead time, and one-click CSV export.
- **Month-Wide Statistical Performance Engine:** Rigorous calculation of Mean Absolute Error (MAE), Root Mean Square Error (RMSE), Mean Forecast Bias, Mean Absolute Percentage Error (MAPE), and Day-Ahead Persistence Benchmark Skill Scores across all 744 January 2026 hours.
- **Diagnostic Error Decompositions:** Diurnal time-of-day accuracy profiles (highlighting overnight vs. peak-hour error distributions) and lead-time forecast degradation curves (12h to 48h).
- **Interactive Calendar & Case Study Curations:** Single-click navigation to notable market events (e.g., Storm Isha on 24 Jan, calm anti-cyclonic lows on 10 Jan, high-ramp transition on 28 Jan).
- **Embedded Methodology Guide:** In-app mathematical formulation and data provenance modal for client presentations.

---

## 3. Quick Start (Run Locally from Fresh Clone)

### Prerequisites
- **Python:** 3.11+ (tested on Python 3.12)
- **Node.js:** 18+ (tested on Node 22) and `npm`
- **Git**

### Fresh Clone Commands

```bash
# 1. Clone the anonymous repository
git clone https://github.com/Raqeeb-AI/x7k2m9p4.git
cd x7k2m9p4

# 2. Set up backend dependencies
pip install -r backend/requirements.txt

# 3. Build the frontend client bundle
cd frontend
npm install
npm run build
cd ..

# 4. Launch the unified FastAPI application server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

Open **[http://localhost:8000](http://localhost:8000)** in your browser. The FastAPI server serves both the REST API under `/api/v1` and the pre-compiled React single-page application at `/`.

### Independent Development Mode (Hot Reloading)

If developing frontend components or backend routes independently:

```bash
# Terminal 1: Backend API (port 8000)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend Vite Dev Server (port 5173)
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)**. The Vite dev server automatically proxies API requests to `http://localhost:8000/api/v1`.

---

## 4. The Cutoff-Aware Forecast Selection Rule

### Mathematical Formulation

Let $t$ denote a physical delivery interval (e.g., `2026-01-15T14:00:00Z`), and let $c$ denote the procurement decision cutoff timestamp (e.g., Day-Ahead on 14 January at 09:00 Europe/London, `2026-01-14T09:00:00Z`).

$$\text{Eligible Forecasts}(t, c) = \left\{ r \in \text{WINDFOR} \;\middle|\; r.\text{startTime} = t \;\land\; r.\text{publishTime} \le c \right\}$$

$$\text{Selected Forecast}(t, c) = \operatorname{argmax}_{r \in \text{Eligible Forecasts}(t, c)} \left( r.\text{publishTime} \right)$$

### Strict Lookahead Exclusion
Any forecast run published after the decision cutoff ($r.\text{publishTime} > c$) is **strictly excluded** from selection, regardless of whether it was more accurate. This prevents future information from contaminating historical procurement evaluations.

### Concrete Operational Example

Consider a procurement decision finalized on **14 January 2026 at 09:00 UTC** ($c = \text{2026-01-14T09:00:00Z}$) for delivery on **15 January 2026 at 14:00 UTC** ($t = \text{2026-01-15T14:00:00Z}$):

| Forecast Run | Publication Timestamp ($r.\text{publishTime}$) | Forecasted Generation | Eligibility Status | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **Run A** | `2026-01-14T03:30:00Z` | 13,850 MW | Eligible | Published before cutoff ($c - 5.5\text{h}$) |
| **Run B** | `2026-01-14T07:30:00Z` | **14,419 MW** | **SELECTED** | **Latest publication prior to cutoff ($c - 1.5\text{h}$)** |
| **Run C** | `2026-01-14T11:30:00Z` | 12,200 MW | **EXCLUDED** | Published after cutoff ($c + 2.5\text{h}$) — Lookahead violation |

**Outcome:** WindLens selects **Run B (14,419 MW)** with a lead time of 30.5 hours and an age of 1.5 hours at cutoff. Run C is excluded because a trader committing bids at 09:00 could not have known a forecast published at 11:30.

---

## 5. Authoritative Data Scope & January 2026 Results

### Authoritative Data Sources (Elexon BMRS)

WindLens ingests and reconciles two official Elexon Insights Solution streams:

1. **FUELHH (Physical Wind Generation Actuals):**
   - **Endpoint:** `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
   - **Filter:** `fuelType=WIND` (transmission-connected Great Britain wind generation).
   - **Native Granularity:** Half-hourly settlement periods (30 minutes).
   - **Harmonization to Hourly:** Exact arithmetic mean of the two consecutive settlement periods:
     $$\bar{G}_{\text{actual, hour}} = \frac{G_{\text{p1}} + G_{\text{p2}}}{2}$$
     *100% of the 1,488 half-hourly periods in January 2026 are complete, yielding zero missing intervals.*
   - **Unit:** Megawatts (MW) average power delivered.

2. **WINDFOR (National Wind Generation Forecast):**
   - **Endpoint:** `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
   - **Source:** National Energy System Operator (NESO) national rolling wind forecast.
   - **Horizon & Cadence:** 72-hour rolling horizon, published ~every 2–4 hours (approx. 8 runs/day). Over 21,600 verified records across 296 distinct publication runs are retained in the January 2026 snapshot.
   - **Unit:** Megawatts (MW) average forecasted power.

### Verified January 2026 Overall Accuracy Results (09:00 Cutoff)

The following figures have been empirically verified against the raw BMRS data and calculated via `backend/app/analytics/metrics.py`:

| Evaluation Metric | Mathematical Definition | Verified Value | Interpretation |
| :--- | :--- | :--- | :--- |
| **Evaluated Delivery Intervals** | $N = 31 \text{ days} \times 24 \text{ hours}$ | **744 hours** | 100% complete temporal coverage across January 2026 |
| **Mean Absolute Error (MAE)** | $\frac{1}{N}\sum \|F_t - A_t\|$ | **2,038.91 MW** | Average magnitude of forecast error across the month |
| **Mean Systematic Bias** | $\frac{1}{N}\sum (F_t - A_t)$ | **+1,747.89 MW** | Strong systematic tendency to overpredict wind generation |
| **Root Mean Square Error (RMSE)** | $\sqrt{\frac{1}{N}\sum (F_t - A_t)^2}$ | **2,504.76 MW** | Penalizes large errors during high-ramp/storm events |
| **Mean Absolute Percentage Error (MAPE)** | $\frac{1}{N}\sum \frac{\|F_t - A_t\|}{A_t}$ | **22.04%** | Normalized average relative error across delivery hours |
| **Overforecast Frequency** | $\sum \mathbb{I}(F_t > A_t) / N$ | **84.95%** (632 / 744) | Forecasts exceeded actuals in 85% of delivery hours |
| **Underforecast Frequency** | $\sum \mathbb{I}(F_t < A_t) / N$ | **15.05%** (112 / 744) | Forecasts were below actuals in only 15% of delivery hours |
| **Day-Ahead Persistence Baseline MAE** | $\frac{1}{N}\sum \|A_{t-24\text{h}} - A_t\|$ | **4,261.83 MW** | Naive 24-hour persistence baseline benchmark |
| **Forecast Skill Score vs. Baseline** | $1 - \frac{\text{MAE}_{\text{model}}}{\text{MAE}_{\text{baseline}}}$ | **+52.16%** | Cutoff forecast cut error by >52% compared to persistence |

### Accuracy Degradation by Lead-Time Horizon

| Lead-Time Horizon | Delivery Window Relative to Cutoff | Sample Count | MAE (MW) | Mean Bias (MW) | RMSE (MW) | MAPE (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **12 – 18 Hours** | Day D+1 (00:00 to 06:00 UTC) | 62 | 2,098.40 | +2,043.01 | 2,599.83 | 19.32% |
| **18 – 24 Hours** | Day D+1 (06:00 to 12:00 UTC) | 186 | 2,359.13 | +2,286.58 | 2,858.23 | 27.30% |
| **24 – 30 Hours** | Day D+1 (12:00 to 18:00 UTC) | 186 | 1,965.71 | +1,629.65 | 2,373.49 | 22.69% |
| **30 – 36 Hours** | Day D+1 (18:00 to 00:00 UTC) | 186 | 1,900.66 | +1,322.53 | 2,285.34 | 19.76% |
| **36 – 48 Hours** | Day D+2 Early Morning Hours | 124 | 1,846.03 | +1,607.67 | 2,392.64 | 17.99% |

---

## 6. Repository Architecture & File Tree

```
x7k2m9p4/
├── api/
│   └── index.py                     # Vercel serverless ASGI entrypoint (imports FastAPI app)
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application setup & unified static SPA mount
│   │   ├── api/
│   │   │   ├── router.py            # Central v1 API router
│   │   │   ├── deps.py              # Dependency injection for SnapshotRepository
│   │   │   └── routes/              # Modular API endpoints
│   │   │       ├── health.py        # GET /health
│   │   │       ├── metadata.py      # GET /metadata
│   │   │       ├── decision.py      # GET /decision
│   │   │       ├── accuracy.py      # GET /accuracy
│   │   │       └── vintages.py      # GET /vintages
│   │   ├── domain/                  # Pure domain logic (zero HTTP framework dependencies)
│   │   │   ├── models.py            # Domain entities (ForecastRecord, ActualRecord)
│   │   │   ├── enums.py             # ErrorDirection, CutoffPolicy enums
│   │   │   └── rules.py             # Pure cutoff selection & lookahead exclusion rule
│   │   ├── analytics/               # Numerical analytics computation engine
│   │   │   ├── metrics.py           # MAE, RMSE, Bias, MAPE, and Skill Score functions
│   │   │   ├── matching.py          # Harmonization of FUELHH (30m) & WINDFOR (60m)
│   │   │   ├── lead_time.py         # Horizon degradation band calculations
│   │   │   └── time_of_day.py       # Diurnal hourly accuracy aggregation
│   │   ├── repositories/            # In-memory cached repository backed by Parquet tables
│   │   │   ├── interfaces.py        # IDataRepository contract
│   │   │   └── snapshot_repository.py
│   │   ├── schemas/                 # Pydantic v2 serialization contracts
│   │   │   ├── common.py
│   │   │   ├── decision.py
│   │   │   ├── accuracy.py
│   │   │   ├── vintages.py
│   │   │   └── metadata.py
│   │   ├── services/                # Application coordination services
│   │   │   ├── decision_service.py
│   │   │   ├── accuracy_service.py
│   │   │   └── vintage_service.py
│   │   └── core/                    # Settings & CORS configuration
│   │       └── config.py
│   ├── etl/                         # Verification probes, live BMRS fetchers, snapshot builder
│   │   ├── probe_elexon.py          # Live BMRS schema verification script
│   │   ├── fetch.py                 # Stream fetcher for FUELHH & WINDFOR
│   │   ├── build_snapshot.py        # Snapshot builder (generates Parquet tables)
│   │   └── audit_data.py            # Lookahead verification and data completeness audit
│   ├── tests/                       # Automated Pytest suite
│   │   ├── unit/
│   │   │   ├── test_selection_rule.py # Cutoff boundary & lookahead exclusion tests
│   │   │   └── test_metrics.py      # Formula mathematical verification
│   │   └── integration/
│   │       └── test_api_endpoints.py # FastAPI HTTP contract tests
│   ├── openapi.json                 # Exported OpenAPI 3.1 specification schema
│   ├── export_openapi.py            # OpenAPI exporter script
│   └── requirements.txt             # Locked Python runtime dependencies
│
├── frontend/                        # React 19 + TypeScript + Vite single-page application
│   ├── src/
│   │   ├── components/              # Modular UI components
│   │   │   ├── Navbar.tsx           # Compact header with view tabs & live system badge
│   │   │   ├── Sidebar.tsx          # Brand navigation & status indicator
│   │   │   ├── CalendarPopover.tsx  # Interactive dual-column date selector & case studies
│   │   │   ├── DecisionControls.tsx # Date switcher, dual-date badges, cutoff picker
│   │   │   ├── ForecastActualChart.tsx # Centerpiece time-series with accessible markers
│   │   │   ├── VintageFanChart.tsx  # Multi-cutoff revision comparison drawer
│   │   │   ├── IntervalTable.tsx    # 24-hour audit table with column sorting & CSV export
│   │   │   ├── DailyErrorChart.tsx  # 31-day error bar chart with high-error threshold
│   │   │   ├── DiurnalErrorChart.tsx# Diurnal 24-hour accuracy curves
│   │   │   ├── LeadTimeChart.tsx    # Lead-time degradation bar chart
│   │   │   ├── MethodologyView.tsx  # Client-oriented Q&A methodology reference
│   │   │   ├── ForecastView.tsx     # Single decision day evaluation view
│   │   │   ├── AccuracyView.tsx     # Month-wide statistical summary view
│   │   │   ├── DataView.tsx         # Data provenance and snapshot inspector view
│   │   │   └── MetricCard.tsx       # Standardized KPI card component
│   │   ├── types/api.ts             # TypeScript API interfaces mirrored from backend schemas
│   │   ├── lib/api.ts               # HTTP client with automatic DEV/PROD environment fallback
│   │   ├── App.tsx                  # Root application view coordinator
│   │   ├── main.tsx                 # Entrypoint with TanStack React Query provider
│   │   └── index.css                # Curated editorial theme tokens (#FAF8F4, #D95635, #267568)
│   ├── package.json                 # Locked frontend dependencies
│   ├── tailwind.config.js           # TailwindCSS typography and palette theme configuration
│   └── tsconfig.json                # TypeScript strict configuration
│
├── data/
│   ├── raw/                         # Raw Elexon stream sample JSON payloads
│   └── processed/                   # High-performance Parquet snapshots (<125 KB total)
│       ├── actuals_hourly.parquet   # 841 hourly actual records (24 KB)
│       ├── forecasts_vintages.parquet # 21,608 forecast vintage records (98 KB)
│       └── manifest.json            # Snapshot cryptographic checksum and metadata
│
├── Dockerfile                       # Multi-stage production container (Node build + Python slim)
├── docker-compose.yml               # Local container orchestration
├── package.json                     # Root build coordinator for Vercel
├── pyproject.toml                   # Pytest runner configuration
├── requirements.txt                 # Root serverless Python dependencies for Vercel
└── vercel.json                      # Vercel Hobby serverless routing & asset bundling config
```

---

## 7. REST API Documentation

The backend exposes a structured, OpenAPI-compliant REST API. When running locally, interactive documentation is available at `http://localhost:8000/docs`. In production, it is available at `https://x7k2m9p4-livid.vercel.app/docs`.

### Key Endpoints

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | None | Service liveness, application version, and UTC server time. |
| `GET` | `/api/v1/metadata` | None | Available decision dates, delivery dates, cutoff parameters, and data provenance. |
| `GET` | `/api/v1/decision` | `decision_date` (YYYY-MM-DD), `cutoff_time` (HH:MM) | Reconciles 24-hour delivery intervals for day $D+1$ against cutoff-selected forecasts, returning interval metrics and summary statistics. |
| `GET` | `/api/v1/accuracy` | `cutoff_time` (HH:MM), `start_date`, `end_date` | Month-wide statistical accuracy (MAE, RMSE, Bias, MAPE, Skill Score), daily time series, diurnal curves, and lead-time bands. |
| `GET` | `/api/v1/vintages` | `decision_date`, `delivery_date` | Sensitivity comparison across 5 standard cutoffs (07:00, 09:00, 12:00, 16:00, 22:00) showing how forecasts changed as gate closure neared. |

---

## 8. Docker Instructions

WindLens provides a production-grade multi-stage container ([Dockerfile](file:///d:/Gridbricks/Dockerfile)) that compiles the React application and bundles the FastAPI backend into a hardened `python:3.12-slim` image:

```bash
# Build the Docker image
docker build -t windlens .

# Run the container (binds port 8000)
docker run -p 8000:8000 windlens
```

Alternatively, launch using Docker Compose:
```bash
docker compose up --build
```
Access the application at **[http://localhost:8000](http://localhost:8000)**. The container includes healthcheck polling (`curl -f http://localhost:8000/api/v1/health`).

---

## 9. Automated Testing & Verification

The repository includes comprehensive automated test coverage for domain rules, metric calculations, and API routing:

```bash
# Run pytest suite
pytest -v
```

### Verified Test Suite Output
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
============================= 11 passed in 4.06s ==============================
```

To run TypeScript verification:
```bash
cd frontend
npx tsc --noEmit
```

---

## 10. Deployment Instructions (Vercel Serverless)

The application is deployed live on Vercel at **[https://x7k2m9p4-livid.vercel.app/](https://x7k2m9p4-livid.vercel.app/)** with zero infrastructure hosting cost:
- **Frontend:** Vite SPA built by Vercel's build runner and served via global Edge CDN.
- **Backend:** FastAPI wrapped in an ASGI handler (`api/index.py`) executed within an AWS Lambda Python serverless sandbox.
- **Data Snapshots:** Lightweight Parquet snapshot files (~122 KB total) are packaged directly into the serverless bundle via `vercel.json` (`data/processed/**`).

### Deploying a Fresh Fork to Vercel
1. Import repository `https://github.com/Raqeeb-AI/x7k2m9p4` in [Vercel Dashboard](https://vercel.com/new).
2. Set Root Directory to `./` and Framework Preset to `Other`.
3. Click **Deploy**. Vercel will install dependencies via `package.json`, compile the React client, package `api/index.py`, and provision an instant SSL-enabled production URL.

---

## 11. Limitations & Explicit Scope Boundaries

1. **Illustrative Cutoff Policy:** The default 09:00 Europe/London decision cutoff is an illustrative baseline assumption designed to evaluate day-ahead procurement decisions. It does not represent a statutory market gate closure, exchange auction deadline, or official regulatory milestone. Cutoff times can be adjusted interactively in the UI.
2. **Transmission-Connected Wind Generation Only:** Data is strictly restricted to national transmission-connected wind farms (`fuelType=WIND` in Elexon BMRS). Embedded distribution-connected wind, solar PV, hydro, system demand, transmission network constraints, and local nodal bottlenecks are excluded.
3. **Physical Energy Metrics (Non-Financial):** The platform evaluates volumetric power forecast performance in Megawatts (MW). It does not compute financial settlement cashouts, system imbalance prices (SSP/SBP), imbalance risk premiums, or algorithmic bidding strategies.

---

## 12. AI Tool Disclosure

In compliance with technical assessment guidelines:
- **AI Coding Assistant:** Google Antigravity (powered by Gemini 3.8 Flash) was utilized as an AI pair programmer throughout this project. It assisted with inspecting official Elexon BMRS API documentation, formulating the mathematical cutoff selection rule, generating reproducible verification scripts, structuring Pydantic and TypeScript contract models, and scaffolding React/Recharts visualization layouts.
- **Verification Authority:** All numerical metrics, formula implementations, data structures, and performance benchmarks were empirically verified against live Elexon BMRS endpoints, processed Parquet snapshots, and the automated Pytest test suite. No synthetic or AI-hallucinated figures are presented as fact.
- **Live Deployment Reference:** [https://x7k2m9p4-livid.vercel.app/](https://x7k2m9p4-livid.vercel.app/)
