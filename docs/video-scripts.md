# WindLens — Video Demonstration Scripts

This document provides exact, timed scripts for the two mandatory submission videos (maximum 5 minutes each).

---

## Video 1: Customer Demo Video (Procurement Workflow)
- **Target Audience:** Commercial Electricity Procurement Manager / Energy Trading Desk
- **Target Duration:** 4 minutes 30 seconds (Max 5 minutes)
- **Tone:** Practical, commercial, focused on decision value, confidence, and auditability.
- **Recording Mode:** Full-screen browser at [http://localhost:8000](http://localhost:8000) or production deployed URL.

---

### Timed Script & Action Plan

#### [00:00 – 00:45] Introduction & The Procurement Challenge
- **Visual:** Decision Day tab. Mouse hovering over the header and the Decision Controls banner.
- **Spoken Script:**
  > "Welcome to this demonstration of WindLens. In UK day-ahead power procurement, energy buyers and trading desks face a fundamental challenge: renewable wind generation fluctuates dramatically, and the forecasts available to you change every few hours.
  >
  > When committing to wholesale power contracts or setting hedges ahead of gate closure, you need to know three things with certainty:
  > 1. What forecast was actually available on my desk at my decision cutoff?
  > 2. How did that forecast compare against physical outturn generation?
  > 3. How reliable were the forecasts over time so we can calibrate imbalance risk?
  >
  > WindLens was built specifically to answer these questions without requiring you to sift through raw Elexon data feeds or navigate complex engineering pipelines."

---

#### [00:45 – 02:00] Decision Day: Real-Time Cutoff & Delivery Reconciliation
- **Visual:** Select Decision Date: `15 Jan 2026`. Notice the physical delivery date immediately updates to `16 Jan 2026`. Point out the default cutoff `09:00 Europe/London`.
- **Spoken Script:**
  > "Let's look at the Decision Day view. Here we are evaluating procurement decisions made on the 15th of January 2026 for physical delivery on the 16th of January.
  >
  > Notice the clean separation of dates: procurement decisions made on Day D govern physical power flow on Day D+1. 
  > 
  > At our 09:00 AM cutoff, WindLens automatically selects the freshest national forecast issued prior to that moment, with strict lookahead protection—meaning no post-cutoff forecast updates can leak into this analysis.
  >
  > In the summary tier above, we immediately see our top-line metrics:
  > - Forecast vs Actual Outturn: Day-ahead forecast averaged 12,840 MW compared to actual delivery of 11,200 MW.
  > - Mean Absolute Error (MAE): 1,842 MW average miss across the 24 hours.
  > - Systematic Bias: +1,640 MW Overforecast, meaning the forecast consistently overpredicted wind generation throughout the day.
  > - Below this, our persistence benchmark confirms the forecast still outperformed a naive 'yesterday at the same hour' baseline by over 50%."

---

#### [02:00 – 03:00] Centerpiece Forecast vs Actual Chart & Interval Audit
- **Visual:** Scroll down to the main time-series chart. Hover over the evening peak intervals (17:00 to 20:00 UTC). Toggle the "Show D-1 Persistence Baseline" checkbox. Then scroll to the Interval Table and click "Export Delivery Day CSV".
- **Spoken Script:**
  > "Looking at the centerpiece hourly profile: the dark line with solid dots represents actual physical wind generation delivered to the GB grid, derived from Elexon FUELHH. The vermilion line with distinct markers represents the latest WINDFOR forecast available at our 09:00 cutoff.
  >
  > Hovering over each delivery interval displays the exact error, directional badge, and publication age. If we toggle the persistence baseline, we see how naive persistence would have lagged actual conditions during weather shifts.
  >
  > Below the chart, every single hour is completely auditable in our Reconciliation Table, with clear Overforecast and Underforecast badges and publication timestamps. With one click on 'Export Delivery Day CSV', procurement analysts can export this exact data into Excel or their internal valuation models."

---

#### [03:00 – 04:00] Month Accuracy: Reliability Intelligence
- **Visual:** Click over to the "Month Accuracy" tab. Highlight the Executive Summary narrative banner and the 4 monthly metric cards. Scroll down through the Daily Error chart and open the collapsible "Detailed Structural Breakdowns" drawer.
- **Spoken Script:**
  > "Now let's step back from a single day and look at monthly procurement reliability across January 2026.
  >
  > Right at the top, the executive summary answers how reliable forecasts were in plain English: across all 744 evaluated hours in January, day-ahead wind forecasts exhibited an average error of 2,039 MW, with a persistent overforecasting bias of +1,748 MW.
  >
  > Our Daily Error chart highlights unusual days where error exceeded 1.5 times the monthly mean. Furthermore, opening our structural breakdown drawer reveals diurnal patterns—showing how morning and evening atmospheric transitions affect forecast precision—and lead-time decay, confirming that forecasts for near-term delivery hours (12–18 hours out) are tighter than distant hours (30–36 hours out)."

---

#### [04:00 – 04:30] Data Transparency & Conclusion
- **Visual:** Switch briefly to the "Data & Methodology" tab. Show the clean Q&A sections and official Elexon documentation links.
- **Spoken Script:**
  > "Finally, our Data & Methodology tab provides total transparency for auditors and compliance teams. Every observation is traceable directly to public Elexon BMRS feeds—FUELHH for actuals and WINDFOR for forecasts—with zero synthetic data.
  >
  > WindLens gives procurement teams the clarity, empirical evidence, and audit trail needed to manage wind balancing risk with complete confidence. Thank you."

---

## Video 2: Technical Lead Review Video (Architecture & Audit)
- **Target Audience:** Engineering Lead / Software Architect / Lead Data Scientist
- **Target Duration:** 4 minutes 45 seconds (Max 5 minutes)
- **Tone:** Technical, precise, covering code architecture, mathematical lookahead proofs, data engineering, and test suites.
- **Recording Mode:** Split screen or sequential view of terminal / VS Code and running browser application.

---

### Timed Script & Action Plan

#### [00:00 – 00:50] Architectural Overview & Scope Discipline
- **Visual:** Show repository file tree or `README.md` in IDE.
- **Spoken Script:**
  > "Hello, this is the technical lead review for WindLens.
  >
  > WindLens was engineered with strict adherence to scope:
  > - Data sources are strictly restricted to official Elexon Insights Solution (BMRS) feeds: `FUELHH` for actual wind generation and `WINDFOR` for wind forecasts. No external weather models, electricity spot prices, or simulated data were introduced.
  > - The application follows a clean, layered architecture: pure Python domain rules and numerical analytics in `backend/app/domain` and `analytics`, decoupled from HTTP frameworks; high-performance in-memory caching backed by Parquet snapshots; a FastAPI REST backend; and a React 19 + TypeScript + Vite frontend with Tailwind CSS editorial design tokens."

---

#### [00:50 – 01:50] Temporal Lookahead Enforcement & Selection Algorithm
- **Visual:** Open `backend/app/domain/rules.py` and `backend/etl/audit_data.py`.
- **Spoken Script:**
  > "The core algorithmic invariant of WindLens is strict lookahead protection:
  > For any delivery interval $t$ and decision cutoff timestamp $c$, the selected forecast is:
  > `selected_publish_time = max(publishTime) WHERE publishTime <= c AND startTime == t`
  >
  > Forecasts published after the cutoff ($publishTime > c$) are never eligible under any circumstance.
  >
  > In our data engineering audit across January 2026:
  > - We probed BMRS and verified that WINDFOR preserves genuine historical publication runs—each delivery interval retains a median of 24 distinct historical vintages (range 8 to 32).
  > - Our audit script tested all 744 target intervals at the 09:00 cutoff: exactly 744 satisfied $publishTime \le cutoff$, with 0 post-cutoff leaks.
  > - Granularity harmonization: Because FUELHH is half-hourly and WINDFOR is hourly, for each hour $[T, T+60m)$, we calculate actual generation as the exact arithmetic mean of its two 30-minute settlement periods. Target coverage across January 2026 was 100% complete with zero missing settlement periods."

---

#### [01:50 – 02:45] Analytics Engine & Independent Metric Reconciliation
- **Visual:** Open `backend/app/analytics/metrics.py` and `docs/pre-deployment-audit.md`.
- **Spoken Script:**
  > "In the analytics engine, all metrics are implemented with rigorous definitions:
  > - Error is defined as $Forecast - Actual$, such that positive values indicate overforecast and negative values indicate underforecast.
  > - MAE, Bias, RMSE, and MAPE are vectorized with explicit zero-division guards.
  > - We benchmark against a naive Day-Ahead Persistence model: $Actual(t - 24 hours)$, with skill score $1 - (MAE_{forecast} / MAE_{baseline})$.
  >
  > Reconciling against the full January 2026 dataset (744 hours):
  > - Month MAE: 2,038.91 MW
  > - Forecast Bias: +1,747.89 MW
  > - RMSE: 2,504.76 MW
  > - Day-Ahead Baseline MAE: 4,261.83 MW
  > - Baseline Skill Score: +52.16%
  >
  > Every metric reported in the UI is directly calculated from genuine source records."

---

#### [02:45 – 03:40] Automated Test Suite & API Contracts
- **Visual:** Run `pytest -v` in terminal; show 11 passing tests. Then show `npx tsc --noEmit` in frontend.
- **Spoken Script:**
  > "Let's look at verification. Running `pytest -v`:
  > We have 11 comprehensive automated tests executing in under 3 seconds:
  > - `test_selection_rule.py` verifies lookahead enforcement, boundary eligibility at exact cutoff timestamps, and empty candidate handling.
  > - `test_metrics.py` validates mathematical formulations and empty array handling.
  > - `test_api_endpoints.py` tests all FastAPI endpoints: `/health`, `/metadata`, `/decision`, `/accuracy`, and `/vintages`.
  >
  > On the frontend, running `npx tsc --noEmit` confirms 100% strict TypeScript type checking against contracts mirrored directly from the backend Pydantic models."

---

#### [03:40 – 04:45] Production Build, Dockerization & Deployment
- **Visual:** Show `Dockerfile` and `docker-compose.yml`, then briefly show the browser running the unified SPA build on port 8000.
- **Spoken Script:**
  > "For deployment, WindLens is packaged as a unified multi-stage Docker container:
  > - Stage 1 uses Node 22 to build the optimized React client bundle.
  > - Stage 2 copies the distribution assets into a lightweight Python 3.12-slim runtime.
  > - FastAPI mounts the static assets and serves `index.html` with client-side SPA fallback while exposing REST endpoints under `/api/v1`.
  > - The Parquet snapshots load in memory at startup, allowing decision and accuracy queries to execute in under 3 milliseconds with zero external database dependencies.
  >
  > The application is verified on desktop and mobile viewports, fully auditable, and ready for deployment. Thank you."
