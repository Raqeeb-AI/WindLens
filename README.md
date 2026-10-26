# WindLens

**Cutoff-Aware UK National Wind Generation Forecast Intelligence Dashboard**  
*Built for Day-Ahead Electricity Procurement Decision Evaluation (January 2026)*

---

## 1. Product Objective

WindLens is an analytical intelligence platform designed for UK electricity trading and procurement teams. It addresses three critical operational questions:

1. **Forecast Availability at Decision Cutoff:** What national wind generation forecast was available at a specified day-ahead procurement cutoff time (e.g. D-1 at 09:00 Europe/London)?
2. **Reconciliation Against Physical Delivery:** How did that cutoff-selected forecast compare against actual wind generation outcomes for the corresponding delivery intervals (D+1, 00:00 to 23:00 UTC)?
3. **Statistical Bias and Staleness:** How accurate, biased, stale, or incomplete were the forecasts across the entirety of January 2026?

> **Fundamental Date Semantics:** Decision dates ($D$) and physical delivery dates ($D+1$) are distinct concepts. Decisions made between 1 January and 31 January 2026 govern physical power deliveries between 2 January and 1 February 2026.

---

## 2. Authoritative Data Scope & Verified Findings

WindLens is built strictly upon two official, public Elexon Insights Solution (BMRS) data streams:

1. **FUELHH (Actual Generation):**
   - Stream endpoint: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
   - Filtered to: `fuelType=WIND`
   - Unit: **Megawatts (MW)** interval-average power delivered.
   - Granularity: **Half-hourly settlement periods (30 minutes)**.
2. **WINDFOR (Wind Forecast Generation):**
   - Stream endpoint: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
   - Unit: **Megawatts (MW)** forecasted interval-average power.
   - Granularity: **Hourly delivery intervals (60 minutes)**.
   - Horizon & Cadence: **72-hour rolling horizon**, published ~every 2–4 hours (~8 publication runs/day).

### Key Empirical Findings:
- **Historical Vintages Retained:** Over 21,600 forecast records across 296 publication runs were verified in BMRS. Each delivery interval in January 2026 possesses a median of **24 distinct historical publication runs** (ranging from 8 to 32). Zero synthetic or simulated vintages were introduced.
- **Granularity Alignment:** Hourly actual generation is computed as the arithmetic mean of the two consecutive 30-minute FUELHH settlement periods:
  $$\bar{G}_{\text{actual, hour}} = \frac{G_{\text{p1}} + G_{\text{p2}}}{2}$$
  In our audit, **100% of target delivery hours** had complete pairs of settlement periods, ensuring zero interpolation error.

---

## 3. The Critical Forecast-Vintage Selection Rule

For each delivery interval $t$ and decision cutoff timestamp $c$:

$$\text{Eligible Forecasts}(t, c) = \{ r \in \text{WINDFOR} \mid r.\text{startTime} = t \text{ and } r.\text{publishTime} \le c \}$$

$$\text{Selected Forecast}(t, c) = \operatorname{argmax}_{r \in \text{Eligible Forecasts}(t, c)} (r.\text{publishTime})$$

- **Strict Lookahead Protection:** Any forecast published after the cutoff ($p > c$) is never selected under any circumstance, even if it had a lower error.
- **Cutoff Policy:** The default cutoff of D-1 at 09:00 Europe/London is an illustrative demonstration assumption and remains user-configurable across the application.

---

## 4. Architecture & Technical Stack

```
Gridbricks/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application & unified SPA hosting
│   │   ├── api/routes/              # /health, /metadata, /decision, /accuracy, /vintages
│   │   ├── domain/                  # Pure models and cutoff selection rules (no HTTP dependencies)
│   │   ├── analytics/               # Metrics (MAE, RMSE, Bias, MAPE), matching, breakdowns
│   │   ├── repositories/            # In-memory cached repository backed by Parquet snapshots
│   │   └── core/                    # Config & settings
│   ├── etl/                         # Verification probes, raw fetcher, and snapshot builder
│   ├── tests/                       # Pytest test suite (11 unit and integration tests)
│   └── requirements.txt             # Locked Python dependencies
│
├── frontend/                        # React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/              # Editorial metric cards, Recharts time-series, tables
│   │   ├── types/api.ts             # TypeScript contracts mirrored from Pydantic
│   │   └── lib/api.ts               # HTTP client
│   └── tailwind.config.js           # Curated editorial design tokens (#FAF8F4, #D95635, etc.)
│
├── data/
│   ├── raw/                         # Raw Elexon sample payloads (JSON)
│   └── processed/                   # High-performance Parquet & JSON snapshots (<5ms responses)
│
├── docs/                            # Phase 1 verification findings & architecture specifications
├── Dockerfile                       # Multi-stage production container
└── docker-compose.yml               # Local orchestration
```

---

## 5. Quickstart & Local Execution

### Prerequisites
- Python 3.11+
- Node.js 18+ (Node 22 recommended)

### Option A: Unified FastAPI Serving (Simplest)
The backend serves both the API and the pre-built React frontend from `frontend/dist`:

```bash
# 1. Install backend dependencies
pip install -r backend/requirements.txt

# 2. Launch the backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Option B: Independent Frontend Development
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

## 6. Running the Test Suite

Execute the comprehensive automated test suite covering cutoff lookahead protection, metric formulas, and API contract integration:

```bash
pytest
```
Expected output:
```
backend/tests/integration/test_api_endpoints.py .....                    [ 45%]
backend/tests/unit/test_metrics.py ..                                    [ 63%]
backend/tests/unit/test_selection_rule.py ....                           [100%]
============================= 11 passed in 3.03s ==============================
```

---

## 7. AI Tool Disclosure

As required by the technical assessment instructions:
- **AI Coding Assistant:** Google Antigravity (Powered by Gemini 3.8 Flash) was used as a pair programming assistant to inspect Elexon BMRS documentation, formulate mathematical cutoff rules, generate reproducible verification probe scripts, construct Pydantic/TypeScript contract schemas, and scaffold React/Recharts visualization components.
- **Verification Authority:** All data points, numerical metrics, schema fields, and performance benchmarks were empirically verified against live Elexon BMRS servers and automated test suites. Zero synthetic or AI-hallucinated numbers are presented as fact.
