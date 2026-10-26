# WindLens — Phase 1: Data Source Verification and Architecture Foundation Findings

**Project:** WindLens — Cutoff-Aware National Wind Forecast Intelligence Dashboard  
**Assessment Target:** UK Electricity Day-Ahead Procurement (January 2026 Decisions)  
**Document Status:** Final Technical Verification Report (Phase 1 Deliverable)  
**Author:** Senior Data Engineer & Software Architect  
**Date:** 26 October 2026  

---

## 1. Executive Summary

Phase 1 data source verification and architecture foundation is complete. All findings in this document are grounded in direct, live empirical probes of the official Elexon Insights Solution (BMRS) API endpoints, using real historical generation and forecast data for the target period of **January 2026**.

### Key Verified Outcomes:
1. **Authoritative Sources Verified:** Both `FUELHH` (actual generation) and `WINDFOR` (forecast generation) stream endpoints are active, public (no authentication required), and returned valid data for the target evaluation period.
2. **Historical Forecast Vintages Retained:** Crucially, historical forecast publications in `WINDFOR` are fully preserved. A representative hourly delivery interval in January 2026 has a median of **24 distinct forecast publication timestamps** (ranging from 8 to 32 runs), enabling strict, authentic cutoff-aware vintage selection without any synthetic data fabrication.
3. **Granularity Alignment Solved:** `FUELHH` is published at half-hourly (30-minute) settlement period resolution; `WINDFOR` is published at hourly (60-minute) resolution with a 72-hour rolling horizon. Both measure generation as **interval-average power in Megawatts (MW)**. Aggregating pairs of half-hourly FUELHH actuals into hourly arithmetic averages achieves exact 1:1 temporal and physical comparability.
4. **Data Quality Confirmed:** Across the entire evaluation window (19,856 WINDFOR records and 1,537 FUELHH wind records), there are **0 null values**, **0 negative generation values**, and **0 duplicate primary keys**.

---

## 2. Workspace and Environment Inspection

### 2.1 Repository State
- **Git status:** Repository was uninitialized; `git init` was executed at the workspace root (`d:\Gridbricks`).
- **Pre-existing files:**
  - `backend_requirements.md` (31 KB): Comprehensive backend specification defining architecture boundaries, non-goals, metric formulations, and API schemas.
  - `frontend_requirements.md` (16 KB): Frontend design system specification defining color tokens, component layout, and chart behavior.
  - `frontend_backend_integration.md` (12 KB): End-to-end integration protocol and TypeScript/Pydantic contract rules.
  - `deployment_guide.md` (18 KB): Deployment considerations for Docker, Vercel, and Heroku.
- None of the existing specifications were deleted or overwritten. They remain the contractual baseline for subsequent phases.

### 2.2 Installed System Tooling
- **Operating System:** Windows 10/11 (PowerShell environment)
- **Python:** `Python 3.12.4` (Available at `C:\Program Files\Python312\python.exe`)
  - Key libraries present: `httpx` (0.28.1), `pydantic` (2.10.6), `pandas` (2.2.3), `numpy` (2.2.3)
  - Libraries to be installed in Phase 2 virtual environment: `fastapi`, `uvicorn`, `pytest`
- **Node.js:** `v22.18.0`
- **npm:** `10.9.3`
- **Docker:** Not detected in system `PATH`. A containerized deployment strategy will rely on local Docker installation or standard buildpack/container registry mechanisms on the hosting platform (e.g., Heroku container deployment or Vercel serverless runtime).
- **Disk Space:** Drive D has 66.8 GB free; Drive C has ~2.7 GB free. All repository artifacts, snapshots, and build outputs must reside within Drive D (`d:\Gridbricks`).

---

## 3. Authoritative Scope and Elexon API Verification

Official API Documentation URLs:
- FUELHH stream: [https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
- WINDFOR stream: [https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)
- Base API URL: `https://data.elexon.co.uk/bmrs/api/v1`

### 3.1 FUELHH (Actual Generation) Endpoint
- **Live Endpoint Path:** `GET https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
- **Authentication:** None required. Public open data.
- **Observed Request Parameters:**
  - `fuelType` (string): Accepts `WIND` directly as a query parameter. When `fuelType=WIND` is provided, Elexon filters server-side and returns only wind generation records.
  - `publishDateTimeFrom` (ISO-8601 UTC): e.g. `2026-01-01T00:00:00Z`
  - `publishDateTimeTo` (ISO-8601 UTC): e.g. `2026-02-02T00:00:00Z`
  - `settlementDateFrom` / `settlementDateTo` (YYYY-MM-DD): Also supported.
- **Observed Response Schema:**
  ```json
  {
    "dataset": "FUELHH",
    "publishTime": "2026-01-02T00:00:00Z",
    "startTime": "2026-01-01T23:30:00Z",
    "settlementDate": "2026-01-01",
    "settlementPeriod": 48,
    "fuelType": "WIND",
    "generation": 15538
  }
  ```
- **Interval Granularity:** Exactly **30 minutes** (half-hourly settlement period).
- **Physical Unit:** **Megawatts (MW)** representing interval-average power delivered during that 30-minute settlement period.
- **Availability Semantics:** `publishTime` is populated (typically 30 minutes after the interval end). Actuals are published ex-post and are strictly unavailable at day-ahead decision cutoffs.

### 3.2 WINDFOR (Wind Forecast Generation) Endpoint
- **Live Endpoint Path:** `GET https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
- **Authentication:** None required. Public open data.
- **Observed Request Parameters:**
  - `publishDateTimeFrom` (ISO-8601 UTC): e.g. `2025-12-30T00:00:00Z`
  - `publishDateTimeTo` (ISO-8601 UTC): e.g. `2026-02-02T00:00:00Z`
  - *Note on Parameter Filtering:* Probes confirmed that parameters like `from`, `startTimeFrom`, or `settlementDateFrom` are not accepted by the stream endpoint; passing unrecognized parameters causes the API to ignore them and return the latest stream window. Therefore, ingestion must filter by publication window (`publishDateTimeFrom` / `publishDateTimeTo`).
- **Observed Response Schema:**
  ```json
  {
    "dataset": "WINDFOR",
    "publishTime": "2026-01-01T07:30:00Z",
    "startTime": "2026-01-02T12:00:00Z",
    "generation": 17541
  }
  ```
  *(Note: WINDFOR records do not include `settlementPeriod` or `fuelType` fields).*
- **Interval Granularity:** **60 minutes** (hourly).
- **Forecast Horizon:** **72 hours** (73 hourly intervals per publication run, covering from $T-3\text{h}$ to $T+72\text{h}$).
- **Publication Frequency:** Typically every 2 to 4 hours (e.g. 02:30, 04:30, 07:30, 09:30, 11:30, 15:30, 18:30, 22:30 UTC), yielding ~8 publication runs per calendar day.
- **Physical Unit:** **Megawatts (MW)** representing forecasted interval-average power.

---

## 4. Historical Forecast-Vintage Availability & January 2026 Coverage

### 4.1 Empirical Coverage Audit
We executed a complete fetch of both endpoints covering all procurement decisions from **1 January 2026 through 31 January 2026**, which govern deliveries from **2 January 2026 through 1 February 2026**:

| Metric | FUELHH (WIND) | WINDFOR |
| :--- | :--- | :--- |
| **Total Records Retrieved** | 1,537 | 19,856 |
| **Date Range Covered** | 2025-12-31 23:30Z to 2026-02-01 23:30Z | 2025-12-29 21:00Z to 2026-02-03 21:00Z |
| **Distinct Delivery Start Times** | 1,537 half-hours | 865 hourly intervals |
| **Distinct Publication Times** | 1,537 | 272 publication runs |
| **Null Values** | 0 | 0 |
| **Negative Values** | 0 | 0 |
| **Duplicate Keys** | 0 (by `startTime`) | 0 (by `startTime, publishTime`) |
| **Query Duration** | 0.35 s | 1.27 s |

### 4.2 Forecast Vintages per Interval
Because forecasts are issued ~8 times per day over a rolling 3-day horizon:
- Each delivery interval in January 2026 has between **8 and 32 historical forecast publications** (mean: 23.0, median: 24.0).
- **Conclusion:** Historical vintages are fully accessible in BMRS. There is no need for synthetic data, simulation, or fallback approximations. The cutoff selection rule can be evaluated on real market data.

---

## 5. Time Semantics & Critical Forecast-Vintage Rule

### 5.1 Disambiguation of Dates and Timestamps
The architecture enforces strict separation between the following distinct temporal concepts:

```
[Decision Date D] ───────────────────────────► [Delivery Date D+1]
   │                                                 │
   ├── [Decision Cutoff c]                           ├── [Delivery Interval Start t]
   │   (e.g. D at 09:00 London)                      │   (e.g. 2026-01-16T14:00:00Z)
   │                                                 │
   └── [Forecast Publication Timestamp p]            └── [Actual Publication Timestamp]
       (Must satisfy p <= c)                             (Ex-post outcome, p_actual > t)
```

1. **Decision Date ($D$):** The calendar day on which the procurement team evaluates forecasts and executes day-ahead procurement decisions (1 January 2026 to 31 January 2026).
2. **Delivery Date ($D+1$):** The intended day of physical power delivery (2 January 2026 to 1 February 2026).
3. **Delivery Interval Start ($t$):** The start time (`startTime` in ISO-8601 UTC) of the delivery interval to which the forecast or actual applies.
4. **Forecast Publication Timestamp ($p$):** The exact timestamp (`publishTime` in ISO-8601 UTC) when Elexon/NESO published that specific forecast run.
5. **Procurement Cutoff Timestamp ($c$):** The time boundary on Decision Date $D$ after which newly published forecasts cannot be used.

### 5.2 The Forecast-Vintage Selection Rule
For a delivery interval $t \in [D+1\text{T00:00:00Z}, D+1\text{T23:00:00Z}]$ and configured cutoff timestamp $c$:

$$\text{Eligible Forecasts}(t, c) = \{ r \in \text{WINDFOR} \mid r.\text{startTime} = t \text{ and } r.\text{publishTime} \le c \}$$

$$\text{Selected Forecast}(t, c) = \operatorname{argmax}_{r \in \text{Eligible Forecasts}(t, c)} (r.\text{publishTime})$$

**Rules:**
- **No Lookahead Leakage:** A forecast with $p > c$ must **never** be selected under any circumstance, even if it has lower error.
- **Staleness Metric:** The forecast age (lead time) is computed explicitly:
  $$\text{Forecast Age at Cutoff} = c - p_{\text{selected}}$$
  $$\text{Lead Time to Delivery} = t - p_{\text{selected}}$$
- **Missing Forecast Handling:** If $\text{Eligible Forecasts}(t, c) = \emptyset$, the interval must be flagged as `UNAVAILABLE` rather than imputed.
- **Timezone Normalization:** All comparison operations are performed on timezone-aware UTC timestamps (`datetime.timezone.utc`). Display timestamps are formatted in `Europe/London`.

### 5.3 Cutoff Assumption
- **Demonstration Default:** Decision Day $D$ at `09:00 Europe/London` (09:00 UTC in January).
- **Labeling:** In all UI components and API metadata, this must be explicitly labeled as an **illustrative demonstration cutoff**, not a statutory gate closure.
- **Configurability:** The cutoff hour and minute must remain user-configurable via query parameters.

---

## 6. Comparability and Granularity Alignment

### 6.1 Granularity Discrepancy
- `FUELHH` = Half-hourly (30 minutes: e.g. 12:00 to 12:30, 12:30 to 13:00).
- `WINDFOR` = Hourly (60 minutes: e.g. 12:00 to 13:00).

### 6.2 Alignment Formulation
Both series measure generation in **Megawatts (MW)** as interval-average power.  
For an hourly forecast interval starting at $T_{\text{hour}}$ (e.g. 12:00:00Z):
- Period 1: $T_{\text{p1}} = T_{\text{hour}}$ (12:00:00Z to 12:30:00Z, generation $G_1$ MW)
- Period 2: $T_{\text{p2}} = T_{\text{hour}} + 30\text{ min}$ (12:30:00Z to 13:00:00Z, generation $G_2$ MW)

The corresponding hourly actual generation is the arithmetic mean:
$$\bar{G}_{\text{actual, hour}} = \frac{G_1 + G_2}{2}$$

**Validation:**
In our January 2026 audit:
- 768 out of 769 hours had complete pairs of half-hours (the only exception was the boundary period 2025-12-31 23:00 UTC which was preceded by unqueried data).
- For all target delivery dates (2 Jan - 1 Feb 2026), **100% of hours have complete pairs**.
- This hourly aggregation produces mathematically exact, physically meaningful comparisons without synthetic interpolation.

---

## 7. Metrics and Error Definitions

To ensure transparency and prevent ambiguity, all core metrics are defined as follows:

1. **Forecast Error:**
   $$\text{Error}_t = \text{Forecast}_t - \text{Actual}_t$$
   - Positive error ($\text{Error}_t > 0$): **Overforecast** (forecast exceeded actual generation).
   - Negative error ($\text{Error}_t < 0$): **Underforecast** (forecast fell short of actual generation).
2. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N} \sum_{t=1}^N \left| \text{Forecast}_t - \text{Actual}_t \right|$$
3. **Forecast Bias (Mean Error):**
   $$\text{Bias} = \frac{1}{N} \sum_{t=1}^N (\text{Forecast}_t - \text{Actual}_t)$$
4. **Mean Absolute Percentage Error (MAPE):**
   $$\text{MAPE} = \frac{100\%}{N} \sum_{t=1}^N \frac{\left| \text{Forecast}_t - \text{Actual}_t \right|}{\text{Actual}_t}$$
   *(Guarded against division by zero: if $\text{Actual}_t < 100\text{ MW}$, flagged or excluded from denominator).*
5. **Root Mean Square Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^N (\text{Forecast}_t - \text{Actual}_t)^2}$$
6. **Day-Ahead Persistence Baseline:**
   The simplest defensible benchmark is persistence: generation observed on the same interval 24 or 48 hours prior. However, because actuals are published ex-post, the baseline must only use actuals available before cutoff $c$.

---

## 8. Verified API Probes and Artifacts Created

The following probe scripts and artifacts were created in Phase 1 and are committed to the repository:

1. `backend/etl/verify_elexon_sources.py`: Self-contained verification probe that tests connectivity, schema fields, interval steps, historical vintages, and cutoff selection logic.
2. `backend/etl/deep_probe.py`: In-depth investigation script for publication horizon, interval delta, and sample records.
3. `backend/etl/analyze_quality.py`: Full statistical verification across the entire month of January 2026 (null checks, duplicate checks, vintage counts, aggregation testing).
4. `data/raw/fuelhh_probe_sample.json`: Sanitized sample response containing 10 raw FUELHH records.
5. `data/raw/windfor_probe_sample.json`: Sanitized sample response containing 10 raw WINDFOR records.
6. `data/metadata/elexon_probe_metadata.json`: Machine-readable metadata capturing endpoint schemas, verified parameters, and units.

---

## 9. Proposed Project Architecture for Subsequent Phases

```
Gridbricks/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & CORS
│   │   ├── api/
│   │   │   ├── router.py            # API router mounting /health, /decision, /accuracy, etc.
│   │   │   └── routes/
│   │   │       ├── health.py        # Health & status endpoint
│   │   │       ├── metadata.py      # Available dates, cutoff ranges, methodology info
│   │   │       ├── decision.py      # Cutoff-selected forecast & actuals for day D
│   │   │       ├── accuracy.py      # Summary metrics (MAE, Bias, RMSE, MAPE)
│   │   │       └── vintages.py      # Multi-vintage comparison & evolution curves
│   │   ├── schemas/
│   │   │   ├── decision.py          # Pydantic schemas for decision response
│   │   │   ├── accuracy.py          # Pydantic schemas for metric response
│   │   │   ├── vintages.py          # Pydantic schemas for vintage response
│   │   │   └── common.py            # Timestamp & error models
│   │   ├── domain/
│   │   │   ├── models.py            # Pure domain models (ForecastRecord, ActualRecord)
│   │   │   └── rules.py             # Forecast-vintage selection rule (pure Python)
│   │   ├── analytics/
│   │   │   ├── metrics.py           # MAE, RMSE, Bias, MAPE calculations
│   │   │   ├── matching.py          # Hourly aggregation & alignment engine
│   │   │   └── baseline.py          # Benchmark / persistence calculations
│   │   ├── repositories/
│   │   │   ├── interfaces.py        # Abstract repository interface
│   │   │   └── snapshot_repo.py     # Fast Parquet/JSON snapshot repository
│   │   └── core/
│   │       ├── config.py            # Pydantic settings & environment configuration
│   │       └── logging.py           # Structured logging
│   ├── etl/
│   │   ├── verify_elexon_sources.py # Probe script (created in Phase 1)
│   │   ├── fetch.py                 # Full month data fetcher
│   │   ├── transform.py             # Cleaning, aggregation, and Parquet snapshot builder
│   │   └── build_snapshot.py        # One-shot build script for verified local snapshots
│   ├── tests/
│   │   ├── unit/                    # Unit tests for selection rule, metrics, alignment
│   │   ├── integration/             # FastAPI endpoint integration tests
│   │   └── fixtures/                # Fixed real-data snapshots for fast, offline tests
│   ├── pyproject.toml               # Poetry/pip dependencies
│   ├── requirements.txt             # Locked Python requirements
│   └── Dockerfile                   # Backend Dockerfile
│
├── frontend/                        # React + Vite application (Phases 3-4)
│   ├── src/
│   │   ├── components/              # UI components (charts, cards, controls)
│   │   ├── pages/                   # Decision Day, Accuracy, Methodology views
│   │   ├── lib/                     # API client, date utilities
│   │   └── types/                   # TypeScript schemas mirrored from Pydantic
│   ├── package.json
│   └── vite.config.ts
│
├── data/
│   ├── raw/                         # Raw Elexon sample payloads (JSON)
│   ├── processed/                   # Validated snapshot (Parquet/JSON) for backend
│   └── metadata/                    # Metadata & schema definitions
│
├── docs/
│   ├── phase-1-findings.md          # This findings report
│   ├── backend_requirements.md      # Specification baseline
│   ├── frontend_requirements.md     # UI/UX design tokens
│   ├── frontend_backend_integration.md
│   └── deployment_guide.md
│
├── docker-compose.yml               # Local orchestration
└── README.md
```

---

## 10. Platform and Hosting Assessment (Vercel vs Heroku)

The assessment guidelines permit **Vercel** or **Heroku**.
1. **Primary Recommendation (Heroku / Container):**
   - Heroku supports standard container deployment (`heroku container:push`) or buildpack deployment with Python and Node.js.
   - It executes standard FastAPI servers with long-running process capability, native Pandas/NumPy binary compatibility, and unified routing.
2. **Alternative / Hybrid Recommendation (Vercel):**
   - Vercel is outstanding for Vite/React frontend hosting with zero config.
   - For FastAPI on Vercel: Vercel provides a Python serverless runtime with a 500 MB uncompressed limit. Because our January 2026 snapshot is compact (~2 MB Parquet / ~8 MB JSON), a packaged read-only snapshot deploys smoothly on Vercel Serverless Functions.
3. **Local Reproducibility:**
   - Both backend and frontend will run locally with standard `npm run dev` and `uvicorn app.main:app --reload` without requiring any external cloud services or databases.

---

## 11. Unresolved Questions & Technical Risks

1. **Local Docker:** Docker is not currently available in the user's local Windows PATH.
   - *Mitigation:* Ensure standard native execution scripts (`npm run dev` and `uvicorn`) work out of the box without Docker as a mandatory local dependency.
2. **Clock Change / Settlement Periods:**
   - January in the UK is on Greenwich Mean Time (GMT, UTC+0); no daylight saving transitions occur in January (standard 48 settlement periods per day). However, all code must use timezone-aware `datetime` objects to avoid hidden bugs.
3. **Data Snapshots vs Live Queries:**
   - Querying live BMRS on every user dashboard click introduces external latency and potential upstream rate-limiting.
   - *Solution:* Package a pre-built, verified, reproducible snapshot for January 2026 into `data/processed/`. The backend will read from this local snapshot with instant (<5ms) response times, with an optional live ETL fetcher.

---

## 12. Ordered Implementation Tasks for Phase 2 (Backend Core)

The implementation sequence for Phase 2 is strictly ordered by dependency:

1. **Task 2.1 — ETL Snapshot Pipeline:**
   - Implement `backend/etl/fetch.py` and `backend/etl/transform.py` to extract all January 2026 FUELHH wind actuals and WINDFOR forecasts.
   - Aggregate FUELHH to hourly means and generate `data/processed/wind_actuals_hourly.parquet` and `data/processed/wind_forecasts_vintages.parquet` (with JSON fallbacks).
2. **Task 2.2 — Domain Models & Selection Engine:**
   - Implement `backend/app/domain/models.py` and `backend/app/domain/rules.py`.
   - Implement pure, deterministic cutoff selection: `select_forecast_for_cutoff(delivery_day, cutoff_dt)`.
3. **Task 2.3 — Pure Analytics & Metrics Engine:**
   - Implement `backend/app/analytics/metrics.py` (MAE, RMSE, Bias, MAPE) and `backend/app/analytics/matching.py`.
   - Implement day-ahead persistence baseline calculation.
4. **Task 2.4 — Unit & Contract Tests:**
   - Implement Pytest suites covering:
     - Cutoff selection rule (verifying that no post-cutoff forecast is ever selected).
     - Half-hour to hourly aggregation correctness.
     - Metric formulas on synthetic edge cases and real January data.
5. **Task 2.5 — FastAPI Application & Pydantic Contracts:**
   - Create `backend/app/main.py`, CORS setup, and API routes:
     - `GET /api/v1/health`
     - `GET /api/v1/metadata` (decision dates, default cutoffs, schema info)
     - `GET /api/v1/decision` (decision day $D$, cutoff $c$, hourly forecast vs actual series)
     - `GET /api/v1/accuracy` (summary accuracy across January 2026)
     - `GET /api/v1/vintages` (forecast evolution across multiple cutoff times)
6. **Task 2.6 — OpenAPI Export:**
   - Generate `openapi.json` from the running FastAPI app to serve as the strict contract for the React frontend in Phase 3.

---

## 13. Acceptance Criteria Verification Checklist

- [x] Actual endpoint behavior investigated against real Elexon responses rather than assumed.
- [x] Historical publication availability verified empirically (24 vintages median per interval in Jan 2026).
- [x] Forecast cutoff selection rule formally and testably defined without lookahead bias.
- [x] Physical units (MW), timezones (UTC/London), and interval matching (30m to 60m mean aggregation) resolved and verified.
- [x] Zero synthetic, fabricated, or mock vintages introduced.
- [x] Findings, sample data, metadata, and reproducible probe code saved to repository.
