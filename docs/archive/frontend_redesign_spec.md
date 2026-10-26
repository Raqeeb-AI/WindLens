# WindLens --- Frontend Redesign Specification

## Product and UX direction for Antigravity

**Purpose:** Replace the current frontend presentation with a minimal,
client-ready decision workspace. Treat this document as the
implementation brief. The backend/data pipeline is not to be rewritten
unless a frontend requirement exposes a verified API or data-contract
problem.

## 1. Design objective

WindLens should feel like a focused professional energy decision
tool---not a generic analytics dashboard, a research paper, or a page
full of cards and definitions.

The user should be able to answer these questions in seconds:

1.  What decision date and cutoff am I looking at?
2.  Which national wind forecast was available by that cutoff for the
    delivery day?
3.  How did it compare with actual generation?
4.  How large was the error, and did the forecast tend to over- or
    under-predict?
5.  How reliable is the evidence behind this view?

**Core UX rule:** put the decision and the interpretation first; put
supporting detail second; put technical methodology last.

Do not add features just because another candidate included them. Do not
add demand, prices, regional/turbine views, other generation types,
live-today claims, or automated procurement recommendations. The
assessed scope is national GB wind actuals and forecasts from Elexon for
January 2026 decision dates.

## 2. Recommended information architecture

Use **three primary destinations**, not a long menu of loosely
differentiated pages:

1.  **Forecast** --- the main task: select decision
    date/cutoff and inspect forecast versus actual for the following
    delivery day.
2.  **Accuracy** --- month-level performance, error direction,
    and coverage.
3.  **Data** --- source provenance, data coverage, limitations,
    and a short explanation of the vintage-selection rule.

Keep the app name and current page in the left navigation. Use a
compact, fixed-width sidebar on desktop because it makes destinations
visible and allows the main content to retain a predictable width. On
small screens, collapse it into a menu/drawer. Do not use a large top
navigation bar with all destinations spread across the page; the current
top nav becomes cramped at narrower widths.

### Desktop shell wireframe

``` text
┌──────────────────┬───────────────────────────────────────────────────────────┐
│ WINDLENS         │ Overview                                      Jan 2026 snapshot │
│                  ├───────────────────────────────────────────────────────────┤
│ ▣ Decision       │                                                           │
│   Workspace      │  [Decision date ▾] [Cutoff ▾] [Reset]                     │
│                  │  Decision: 15 Jan 2026  →  Delivery: 16 Jan 2026           │
│ ▣ January        │                                                           │
│   Accuracy       │  Forecast vs actual                                      │
│                  │  ┌─────────────────────────────────────────────────────┐  │
│ ▣ Data   │  │ One large, clear hourly line chart                  │  │
│                  │  │ Forecast = vermilion; Actual = charcoal/teal         │  │
│                  │  └─────────────────────────────────────────────────────┘  │
│                  │                                                           │
│                  │  [MAE]                 [Forecast bias]                    │
│                  │  [Matched intervals / coverage]                           │
│                  │                                                           │
│                  │  Hourly detail ▾ (collapsed by default)                   │
│                  │                                                           │
│                  │  Data source + cutoff timestamp (quiet footer)             │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

### Mobile shell wireframe

``` text
┌────────────────────────────────────┐
│ ☰  WINDLENS              Jan 2026  │
├────────────────────────────────────┤
│ Forecast                 │
│ Decision date  [15 Jan 2026  ▾]    │
│ Cutoff         [09:00 London  ▾]   │
│ Delivery day   16 Jan 2026          │
│                                    │
│ Forecast vs actual                 │
│ ┌────────────────────────────────┐ │
│ │ Chart with readable labels     │ │
│ └────────────────────────────────┘ │
│ MAE              Bias              │
│ 783 MW           +352 MW           │
│ Coverage: 48/48 matched intervals │
│                                    │
│ Hourly detail  [Expand]             │
└────────────────────────────────────┘
```

The figures above are layout examples from an existing screenshot, not
values to hardcode. Every displayed value must come from the current API
response.

## 2A. Final navigation naming — use exactly these labels

The sidebar and responsive mobile menu must use these four items, in this order:

1. **Overview**
2. **Forecast**
3. **Accuracy**
4. **Data**

These are the final names. Do not use the previous labels “Decision Day,” “Decision Workspace,” “January Accuracy,” “Month Accuracy,” “Data & Methodology,” or “Data & Trust” anywhere as navigation labels, page titles, or route names. The month/year may appear as a small filter/context label, for example `January 2026`, but must not be embedded in the page name.

Overview is the default landing page. Forecast is the day-level detailed analysis. Accuracy is the month-level performance view. Data contains source and quality context.

## 3. Visual system

Use a restrained, warm editorial style: high readability, calm
whitespace, and one clear accent color. The product should feel
deliberate and trustworthy.

-   Page background: warm off-white `#FAF8F4`.
-   Main surfaces: white `#FFFFFF`.
-   Borders/dividers: `#E5E0D7`.
-   Primary text: `#20201D`.
-   Secondary text: `#69675F`.
-   Forecast line/accent: vermilion `#D95635`.
-   Actual line: deep teal `#267568` or a dark neutral with a clear
    legend.
-   Over-forecast annotation: amber `#A96E13`.
-   Under-forecast annotation: teal `#267568`.
-   Use a consistent spacing scale (8, 12, 16, 24, 32, 40 px); do not
    use arbitrary margins per component.
-   Use a serif display face only for the product wordmark or one main
    page heading if it is already available and loads reliably. Use a
    clean sans-serif for all UI, metrics, chart labels, controls, and
    body text.
-   Card corners: subtle 10--14 px; borders before shadows. Avoid heavy
    shadows, glassmorphism, gradients, excessive icons, and decorative
    illustrations.
-   Use sentence case, not title case, for most headings.
-   Avoid tiny grey text and long lines of prose. Keep body copy around
    14--16 px and line length readable.
-   Use consistent icon style and size. Icons should support labels,
    never replace important labels.

## 4. Navigation and page content

### Page A --- Overview (default landing page)

This is the primary product experience and should be the first page on
load.

**A. Page header** - Heading: `Overview` - One-line subtitle:
`Review the national wind forecast available at a decision cutoff and compare it with what happened next.` -
At most one small contextual label: `January 2026 snapshot`.

**B. Decision controls** Place the controls in one compact horizontal
control row on desktop and a vertical stack on mobile: - Decision date -
Forecast cutoff time - Reset to default (quiet button) - Show the
derived delivery day beside or immediately below the controls.

The decision date must mean the date the procurement decision is being
modelled, not the delivery date. Label this clearly. For a decision on
15 January, delivery is 16 January under the default D+1 view.

**C. Forecast-vs-actual chart** - Make this the visual centre of the
page. - Use one large, responsive time-series chart, not several small
charts. - Show forecast and actual as two clearly distinct lines. -
Include a compact legend above the chart. - Tooltip on hover/focus:
delivery time in Europe/London, forecast MW, actual MW, signed error
MW. - Include a subtle zero/units explanation: `Generation (MW)`. -
Avoid a dense grid. Use light horizontal guides, minimal vertical
guides, readable time ticks, and no 3D effects. - Chart must have an
accessible text summary for screen readers and a clear
empty/loading/error state. - If data is incomplete, show the actual
matched count and missing intervals; never draw missing values as zero.

**D. Key takeaways** Show no more than three primary result blocks: 1.
**Typical error (MAE)** --- "On average, the forecast missed actual
generation by X MW." MAE is non-negative. 2. **Forecast bias** --- "The
forecast was X MW higher/lower than actual on average." Use the
convention `forecast − actual`; positive means over-forecast. 3.
**Coverage** --- matched intervals out of expected intervals, with
percentage. This is a data-quality indicator, not an accuracy score.

Do not put forecast average and actual average ahead of these metrics if
they make the page too busy. If those averages are useful, show them in
a compact line above or below the chart, not as giant cards.

**E. Interpretation sentence** Below the metrics, render one short
data-driven sentence. Examples of wording only: - Positive bias:
`The forecast tended to over-predict wind generation over this delivery day.` -
Negative bias:
`The forecast tended to under-predict wind generation over this delivery day.` -
Near-zero bias:
`There was little average directional bias, although individual intervals may still have large errors.`
Do not call the error a procurement shortfall or tell the user how much
electricity to buy.

**F. Hourly detail** - Collapsed by default in a disclosure row:
`View hourly values`. - On expansion, show a compact table with delivery
time, forecast (MW), actual (MW), error (MW). - Add sorting only if it
is straightforward and accessible. Default chronological order. - Do not
show the whole raw API payload or many technical columns.

**G. Small provenance note** A quiet line at the bottom: source dataset
names, selected cutoff in Europe/London, and whether the view contains
complete/missing matched intervals. Link to Data for detail.

### Page B --- Accuracy

Purpose: understand whether the forecast was generally reliable across
the requested month, not to recreate the Forecast at a monthly
scale.

**A. Header** `Forecast accuracy` Subtitle:
`How well did cutoff-available national wind forecasts match actual generation across January 2026 decision dates?`

**B. One filter only** A compact cutoff selector, defaulting to 09:00
Europe/London as an *illustrative modelling assumption*. The UI must not
call this an official market gate closure. If the backend supports only
one cutoff today, show it as a labelled setting rather than a fake
dropdown.

**C. Three metrics maximum** - MAE (MW) - Bias (MW) - Matched coverage
(hours or intervals and percentage)

RMSE and baseline skill can appear in a secondary `Additional metrics`
disclosure if they are implemented and validated. Do not force every
metric into the main visual hierarchy.

**D. One useful chart** Use daily MAE or daily signed bias as the
primary month chart. If both are valuable, use a simple segmented toggle
`Error size | Bias` rather than stacking multiple charts. - Error-size
mode: daily MAE, non-negative values. - Bias mode: bars above zero mean
over-forecast; below zero mean under-forecast. - Make the zero line
clear in bias mode. - Tooltip identifies the decision date and matched
sample count. - Do not imply that a daily aggregate describes every
half-hour/hour.

**E. Explain the result in plain English** One short sentence derived
from actual values; no generic claims such as "excellent accuracy"
unless a defensible threshold exists. If no threshold is defined,
describe the result without grading it.

**F. Optional day selector** A compact list or table of dates with MAE,
bias, and coverage. Clicking a date should open Forecast with
that date selected if this navigation is supported. Do not create a
separate Backtesting page unless the assignment and data genuinely
require it.

### Page C --- Data

This page is supporting context, not a wall of documentation. Keep it
short and scannable.

Use four sections:

1.  **Sources**
    -   Actuals: Elexon FUELHH, filtered to `fuelType=WIND`.
    -   Forecasts: Elexon WINDFOR, retaining source `publishTime`.
    -   Provide links to official dataset documentation only if the URLs
        are real and verified.
2.  **How the forecast is selected**
    -   Plain English:
        `For each delivery interval, WindLens selects the latest forecast published on or before the chosen cutoff.`
    -   Explain that forecasts published after the cutoff are excluded
        to prevent look-ahead bias.
    -   Show selected cutoff in Europe/London and its exact
        timestamp/time-zone conversion in a secondary detail, not as a
        giant timestamp banner.
3.  **Coverage and checks**
    -   Decision dates available in January 2026.
    -   Expected versus matched delivery intervals.
    -   Missing/duplicate records and hourly/half-hourly alignment
        status, if these checks exist and are calculated.
    -   Do not use a `Verified` badge unless a concrete, repeatable
        validation is defined and its result is available from the
        application.
4.  **Scope and limitations**
    -   National GB transmission-connected wind only.
    -   January 2026 decision dates; D+1 delivery may extend to 1
        February 2026.
    -   The default 09:00 cutoff is an illustrative assumption, not a
        confirmed official market deadline.
    -   Forecast error is not a purchase recommendation; demand, prices,
        regional constraints and other supply sources are not modelled.

Remove the current large explanatory cards for every formula.
MAE/RMSE/bias definitions should live in a small
`How to read these metrics` disclosure or concise tooltips on the metric
labels.

## 5. Date and cutoff selector redesign --- important

The current native `<select>` is poor UX: the user must scroll a long
option list to find a date. Replace it with a compact, accessible
date-picker/popover.

Requirements: - Show the selected date in a compact field,
e.g. `Thu, 15 Jan 2026` with a calendar icon and chevron. - On click,
open a calendar popover with January 2026 as the visible month. - Allow
selection of valid January decision dates (1--31 Jan 2026), with clear
previous/next-month controls only if adjacent months are genuinely
selectable and supported. - Default the initial selection to a valid
date (prefer the most useful existing default; do not invent data
availability). - Add quick-select chips for a few verified case-study
dates only if the underlying data confirms those dates are available.
Label them by date and a short factual descriptor; avoid promotional
labels. - Show the derived delivery date immediately after selection,
e.g. `Delivery day · Fri, 16 Jan 2026`. - Never put 35 dates in a tall
dropdown menu. - Keyboard support: Tab, Enter/Space, arrow-key
navigation where appropriate, Escape to close; visible focus states;
accessible labels. - On mobile, use a full-width calendar popover or
native date input with the same constraints. - Prevent dates outside the
supported decision window from being selected. If the API reports no
data, show a clear empty state instead of a broken chart. - Cutoff
control should be a compact time selector with clearly labelled
timezone: `09:00 · Europe/London`. If only 09:00 is supported, do not
pretend that arbitrary times are available. If several cutoffs are
supported, use a short dropdown with real supported options. - Keep the
default cutoff caveat near the control as a small info tooltip or
one-line note: `09:00 is an illustrative modelling cutoff.` Do not
repeat the caveat in multiple large cards.

## 6. Interaction and responsive behaviour

-   All controls must have obvious labels, clear hover/focus/disabled
    states, and feedback when selection changes.
-   On date/cutoff change, show a subtle loading state and then update
    all related chart values, metrics, delivery date, and table from the
    same response.
-   Avoid stale results appearing under newly selected controls.
-   If the API request fails, retain the selected values and show a
    recoverable error with a Retry action.
-   No dead buttons, decorative dropdowns, fake toggles, or links that
    do nothing.
-   Use skeletons only for the chart/metric areas that are actually
    loading.
-   At desktop widths, content max-width should be roughly 1180--1280 px
    with a consistent gutter. Avoid a huge empty center or content
    touching viewport edges.
-   At widths below tablet, collapse the sidebar and stack controls and
    metrics. Charts must remain readable without horizontal page
    scrolling.
-   Tables can scroll horizontally within their own container on small
    screens; the whole page should not overflow.
-   Respect reduced-motion settings. Do not animate data in a way that
    delays reading.

## 7. Data scope and date policy

**Primary user-facing analysis should show January 2026 decision dates
only: 1--31 January 2026.**

The delivery date for a D+1 decision may fall on 1 February 2026; that
is valid and should not be hidden. A delivery date is not the same as
the decision date.

Do not expose 29--31 December 2025 as selectable decision dates simply
because the cached data contains them. December records should be
included only if the product can justify them as required input records
for a specific January decision and the backend's vintage logic actually
needs them. Do not present them as extra January decision scenarios.

Do not filter away forecast records published before January if those
records are legitimately needed to select a forecast available by a
January cutoff. Apply the cutoff and delivery-time rules first; the
user-facing date picker should remain restricted to January decision
dates.

Before changing the data window, inspect the API and actual snapshot.
Document the distinction between: - decision date, - forecast
publication timestamp, - delivery date/time, - source data required to
calculate the result.

Never hardcode the claimed `744 hours / 100% complete` or any other
coverage statement. Calculate expected and matched counts from the
returned data. If the result is incomplete, show the actual coverage and
explain the gap.

## 8. Metric language and chart semantics

Use the same signed-error convention everywhere: -
`Error = forecast − actual` - Positive bias = average over-forecast. -
Negative bias = average under-forecast. - MAE = average absolute
interval error; it measures error size without direction. - RMSE
penalizes large misses more heavily than MAE. - Coverage = matched
intervals / expected intervals.

Do not conflate: - difference between forecast average and actual
average, - average signed error (bias), - mean absolute error (MAE).

They answer different questions. If daily mean forecast minus daily mean
actual is shown, label it as the difference in averages, not MAE.

Chart styling: - Use MW consistently and include units in metric
labels/tooltips. - Use a shared x-axis in local delivery time. - Keep
forecast and actual colours consistent across every page. - In
error/bias charts, use a clear zero baseline and sign-aware colours. -
Do not imply confidence intervals or uncertainty bands unless the source
actually supplies them and the implementation explains them.

## 9. Implementation constraints

-   Keep the existing React + TypeScript frontend unless there is a
    concrete reason to change it.
-   Reuse existing backend endpoints and metric functions. Do not create
    duplicate frontend calculations for metrics that the backend already
    returns.
-   Keep date/time handling explicit and consistent with
    `Europe/London`, including January winter-time UTC conversion.
-   Keep API types centralized and typed. Handle missing/null values
    explicitly.
-   Do not fabricate forecast records, sample metrics, data quality
    results, case-study labels, or source links.
-   Do not rewrite the backend or change metric definitions to make the
    UI look consistent.
-   Preserve the existing working functionality unless it is
    deliberately replaced and tested.
-   Add or update responsive and component tests where the repo already
    has a test framework.

## 10. Maintainable and extensible frontend architecture

The UI must remain easy to extend without turning into a monolithic dashboard component. Follow SOLID principles where they meaningfully apply to frontend code; do not create needless abstractions just to claim SOLID compliance.

- **Single Responsibility:** page components arrange the page; reusable components render controls, metric summaries, charts, tables, loading states, and error states. Data-fetching hooks/services should not also own page layout.
- **Open/Closed:** adding a new analysis view or metric should usually mean adding a page/module or registering a metric definition—not editing a huge component with many page-specific conditionals.
- **Liskov Substitution:** reusable chart, metric, and input components should honor their documented props and behave consistently when swapped for another compatible implementation.
- **Interface Segregation:** components should receive only the props they need. Avoid a giant `DashboardProps` object passed to every child.
- **Dependency Inversion:** pages should depend on typed API/service interfaces or hooks, not call `fetch` directly throughout the UI. Keep API endpoint details in one service layer.

Suggested structure (adapt to the existing repository rather than moving files unnecessarily):

```text
frontend/src/
  app/                 # app shell, route definitions, global providers
  components/
    layout/             # sidebar, page header, responsive shell
    ui/                 # buttons, date picker, select, disclosure, tooltip
    charts/             # forecast-vs-actual and accuracy charts
    metrics/            # metric card and interpretation sentence
    feedback/           # loading, empty, error states
  features/
    overview/           # overview page and page-specific composition
    forecast/           # cutoff selection, daily comparison, hourly detail
    accuracy/           # month-level metrics and daily accuracy
    data/               # provenance, coverage, limitations
  services/              # typed API client and endpoint functions
  hooks/                 # shared data-fetching and UI hooks
  types/                 # API response and domain types
  utils/                 # date/time formatting and pure calculations
```

Architecture rules:
- Keep calculations that define official metrics in the backend; the frontend formats and explains returned values rather than duplicating business logic.
- Centralize typed API calls, response validation, error handling, and timezone formatting.
- Keep components small enough to test independently, but avoid splitting every text label into a separate component.
- Keep page navigation separate from domain logic. A page should not need to know URL construction details for each API call.
- Use configuration or data-driven definitions for repeated metric labels/descriptions where appropriate.
- Do not introduce a state-management library or routing dependency if the existing app can remain clear and reliable without it.
- Preserve the existing project conventions unless there is a concrete maintainability benefit to changing them.

## 10. Acceptance checklist

The redesign is not complete until all are true:

-   [ ] A first-time user can identify the selected decision date and
    delivery date without reading methodology.
-   [ ] A date can be selected without scrolling through a long dropdown
    list.
-   [ ] The main chart is the visual focus and the forecast/actual
    legend is unmistakable.
-   [ ] The three primary takeaways are error size, error direction, and
    data coverage.
-   [ ] Technical details are available but do not dominate the first
    screen.
-   [ ] The navigation contains only Forecast, January
    Accuracy, and Data.
-   [ ] January decision dates are selectable; February 1 may appear as
    a delivery date.
-   [ ] Every displayed metric comes from real API/data results; no
    hardcoded example metrics.
-   [ ] Incomplete data is represented honestly; missing values are not
    treated as zero.
-   [ ] All buttons, date controls, links, tabs and disclosures work.
-   [ ] Layout is usable at desktop, tablet, and mobile widths.
-   [ ] Keyboard navigation, focus indicators and accessible labels
    work.
-   [ ] Existing tests/typecheck/build pass, and any failures are
    reported accurately.
-   [ ] No public push, deployment, assessment submission, or video
    upload happens without the user's explicit approval.

## 11. Antigravity execution prompt

Use the following prompt after placing this file in the repository or
providing it to Antigravity:

> Read the complete `frontend_redesign_spec.md` and inspect the existing
> WindLens frontend, API contracts, and screenshots before editing.
> Treat the spec as the design source of truth.
>
> **Phase 1 --- Audit and proposal:** identify the current
> page/component structure, routing, chart library, date selector, data
> fetching, and styling system. Map each current UI element to the new
> three-destination structure. Identify which metrics and dates are
> actually supported by the API. Show me a concise implementation plan
> and any API/data issues before making substantial changes.
>
> **Phase 2 --- Implement the frontend redesign:** build the compact
> left sidebar, Forecast, Accuracy, and Data
> pages; replace the long native date dropdown with an accessible
> calendar popover constrained to valid January 2026 decision dates;
> simplify the main view around forecast vs actual, MAE, bias and
> coverage; make technical methodology secondary; improve responsive
> layouts and all loading/empty/error states. Use the current backend
> contract wherever possible.
>
> **Phase 3 --- Validate:** run the frontend typecheck, tests, and
> production build; run the backend tests if frontend integration
> changes require it. Manually verify date selection, delivery-date
> calculation, cutoff timezone display, chart updates, metric labels,
> missing-data behaviour, keyboard access, and mobile layout. Report
> exact commands and real outcomes. Do not claim checks passed unless
> they actually passed.
>
> **Strict constraints:** do not fabricate data or links; do not alter
> metric definitions to make numbers agree; do not add out-of-scope
> demand/pricing/trading features; do not break working backend
> functionality; do not submit the assessment or upload videos. Before
> any public GitHub push or deployment, show me the changes and wait for
> my explicit approval. First deliver the redesigned frontend locally
> and summarize changed files, tests, and any unresolved issues.
