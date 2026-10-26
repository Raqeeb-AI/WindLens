# WindLens — Frontend UX Improvement Backlog & Execution Record

This document records the user experience and interface refinements designed to elevate WindLens from a functional data tool to an intuitive, client-focused electricity procurement intelligence workstation.

---

## 1. Primary Workflow Principles
- **Target Persona:** Power procurement manager / energy trader (not data scientist).
- **Three Core Questions Answered in <5 Seconds:**
  1. *What forecast was available at my cutoff?*
  2. *How did that forecast compare with physical generation?*
  3. *How reliable was the forecast across January 2026?*

---

## 2. Refinement Implementation & Verification Status

### A. Navigation & Shell (`Navbar.tsx`)
- [x] Streamline header layout: Clean brand icon, product title, and compact description.
- [x] Simplify secondary metadata: Subtle pill badge for January 2026 scope.
- [x] Clear active state indicators with consistent editorial tokens (#FAF8F4, #D95635, #20201D).

### B. Decision Day Controls (`DecisionControls.tsx`)
- [x] **Date Selector Simplification:** Replaced verbose dropdown text (`2026-01-15 (Decision) → Delivery: ...`) with a clean date selector formatted as `15 Jan 2026`.
- [x] **Dual Date Badge:** Displayed Decision Date ($D$) and Delivery Date ($D+1$) as distinct, clearly labeled cards/badges.
- [x] **Cutoff Selector:** Compact dropdown with timezone clearly visible (`09:00 Europe/London`).
- [x] **Subordinated Case Studies:** Positioned case-study chips as subtle quick-links (`Storm Spike`, `High Wind`, `Low Wind`) rather than competing primary buttons.
- [x] **Disclaimer Streamlining:** Concise, calm cutoff assumption note.

### C. Metric Hierarchy & KPI Cards (`App.tsx`)
- [x] **Hierarchy Rebalancing:**
  - Group 1 (Primary): Delivery Day Forecast vs Actual Outturn (Hero comparison block: `12,840 vs 11,200 MW`).
  - Group 2 (Primary): Forecast Error (MAE magnitude: `1,842 MW`).
  - Group 3 (Primary): Directional Bias (`+1,640 MW` Overforecast badge with clear explanation).
  - Group 4 (Secondary Benchmark Strip): Naive Day-Ahead Persistence Skill & Baseline MAE (`+54.3% skill score`).
- [x] **Plain English Tooltips:** Concise explanations of MAE, Bias, and Persistence Skill score without academic jargon.

### D. Main Forecast & Actual Chart (`ForecastActualChart.tsx`)
- [x] Made the chart the visual centerpiece with generous whitespace and clear axes.
- [x] Non-color visual distinction: Solid dark line with solid dots for Actuals; vermilion line with hollow markers for Forecast; dashed muted line for Baseline.
- [x] Secondary Persistence baseline line with optional checkbox toggle.
- [x] Tooltip polish: delivery hour, forecast, actual, error with direction, and publication age.
- [x] Strict gap handling: `connectNulls={false}` to prevent interpolating missing observations.
- [x] Responsive mobile sizing without clipping axis labels.

### E. Vintage Sensitivity Evolution (`VintageFanChart.tsx`)
- [x] Transformed into a collapsible/expandable secondary drawer ("Inspect Forecast Revision History Across Cutoffs").
- [x] Preserved multi-cutoff comparison lines (07:00, 09:00, 12:00, 16:00, 22:00) without cluttering the primary view.

### F. Interval Audit Table (`IntervalTable.tsx`)
- [x] Clean scanning layout with tabular numerals and sorting on all key columns.
- [x] Distinct error badges (Overforecast / Underforecast / Exact).
- [x] Obvious but unobtrusive "Export Delivery Day CSV" button.

### G. Month Accuracy View (`App.tsx`, `DailyErrorChart.tsx`)
- [x] Executive summary callout at top: Plain English interpretation of January 2026 reliability.
- [x] 4 Key Monthly KPI cards: Month MAE, Overall Bias, Month RMSE, Sample Coverage (744 hours / 100% complete).
- [x] Daily MAE and Bias chart with data-derived high error threshold (>1.5× monthly mean MAE).
- [x] Subordinated collapsible section for structural breakdowns: Diurnal patterns and Lead-time horizon decay with takeaway explanations.

### H. Data & Methodology (`MethodologyView.tsx`)
- [x] Reframed around client-oriented practical questions:
  1. *Where does the data come from?* (Official FUELHH & WINDFOR links).
  2. *What period is covered?* (January 2026 decision dates, 2 Jan – 1 Feb delivery dates).
  3. *How is the selected forecast chosen?* (Cutoff selection rule, lookahead protection, granularity reconciliation).
  4. *How should results be interpreted?* (Plain-English definitions of MAE, Bias, RMSE, Skill Score).
  5. *What are the limitations?* (Illustrative 09:00 cutoff, national transmission-level generation only, no pricing/trading advice).
  6. *How can the user verify the data?* (Raw CSV export, Elexon BMRS portal links, automated test suite).
- [x] Collapsible "Technical Definitions & Mathematical Formulas" accordion for mathematical transparency.

---

## 3. Visual QA & Verification
- All views inspected and validated via headless browser subagent on desktop (1280×800) and mobile (390×844) viewports.
- Zero console errors, zero layout shifts, zero clipped components.
