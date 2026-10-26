# WindLens Frontend Requirements and Design Specification

**Purpose:** Implementation contract for the React frontend built in
Antigravity.\
**Scope:** Frontend only. Backend API contracts are defined in
`backend_requirements.md`; integration details are in
`frontend_backend_integration.md`.\
**Product:** WindLens --- cutoff-aware national wind forecast
intelligence for day-ahead electricity procurement.

------------------------------------------------------------------------

## 1. Product objective

The frontend must make two questions easy to answer:

1.  What wind-generation forecast was available at the selected
    day-ahead decision cutoff?
2.  How accurate was that forecast compared with actual generation, and
    how should the user interpret the error?

Build a polished, credible analytical product. Do not build a generic
SaaS landing page, a chatbot-first app, or a broad energy trading
platform.

The core UI must remain useful without AI. Every displayed metric must
come from the backend or a clearly identified metadata field. Never
present mock/synthetic values as live Elexon results.

## 2. Technology decisions

Use: - React - Vite - TypeScript with strict mode - Tailwind CSS -
shadcn/ui components where useful, customised to the WindLens design
system - Recharts for charts, unless an implementation limitation
justifies another well-supported chart library - Lucide React for
consistent icons - Motion (`motion` package) for restrained
transitions - TanStack Query for server-state fetching, caching,
refetching and error handling - React Router if multiple routes are
used; a tabbed three-view application is also acceptable - Zod for
validating critical API payloads at the client boundary if this can be
added without duplicating excessive schema work - Vitest and React
Testing Library for frontend tests

Do not add dependencies simply for fashion. Keep the bundle lean and use
accessible components.

## 3. Visual direction: warm, light, editorial, data-first

### 3.1 Design personality

The product should feel like a carefully designed energy analytics
workstation: calm, precise, trustworthy, editorial, and easy to scan.

Avoid the generic AI-generated look: - No blue/purple gradients. - No
neon. - No glassmorphism. - No large centred marketing hero. - No giant
rounded cards everywhere. - No excessive shadows. - No decorative blobs,
floating orbs, or gratuitous 3D effects. - No emoji icons. - No dark
theme as the default. - No fake testimonials, invented metrics, or
filler copy.

Use a warm off-white canvas, white content surfaces, restrained borders,
typography with character, and clear analytical hierarchy.

### 3.2 Starting colour tokens

Define all colours as CSS variables/design tokens and reuse them
consistently. These are proposed starting values; check contrast and
adjust where needed.

``` css
:root {
  --background: #FAF8F4;
  --surface: #FFFFFF;
  --surface-subtle: #F3F0E9;
  --border: #E5E0D7;
  --text-primary: #20201D;
  --text-secondary: #69675F;
  --text-tertiary: #89867E;
  --forecast: #D95635;       /* restrained vermilion */
  --actual: #252622;         /* ink */
  --underforecast: #267568;  /* deep teal */
  --overforecast: #A96E13;   /* amber/brown */
  --success: #267568;
  --warning: #A96E13;
  --danger: #B74335;
  --focus-ring: #6B7F59;
}
```

Rules: - Use forecast vermilion and actual ink consistently across all
charts. - Use under/overforecast colours with text labels or symbols
too; colour must never be the only signal. - Avoid full-surface semantic
colours. Prefer small indicators and subdued tinted backgrounds. - Use
no gradients unless a specific chart band requires a very subtle opacity
fill. - Ensure WCAG AA contrast for normal text (target at least
4.5:1). - Provide a single theme; do not spend time implementing dark
mode.

### 3.3 Typography

Recommended starting system: - Headings and selected hero metrics:
**Instrument Serif** or **Fraunces** for an editorial feel. - UI/body:
**DM Sans** or **Geist**. - Dense numeric tables: **Geist Mono** or
**JetBrains Mono**, with tabular numerals.

Choose at most two font families plus an optional mono face. Prefer
self-hosting through `@fontsource` packages so production rendering does
not depend on a third-party font request. Use reliable fallbacks.

Suggested scale: - Small labels: 12px - Secondary UI: 13--14px - Body:
15--16px - Section heading: 20--24px - Page heading: 28--34px - Large
metric: 36--44px, used selectively

Use clear line-height, sentence case, readable labels, and stable
alignment. Do not use serif for every label or dense table cell.

### 3.4 Layout, spacing and shape

-   Use an 8px spacing system.
-   Desktop content width: approximately 1160--1240px.
-   Persistent top header with product identity and limited navigation.
-   Left-aligned page titles and short explanatory subtext.
-   Cards use 8--12px corner radii, 1px borders, and minimal shadows.
-   Avoid making every section a separate card; use whitespace and
    dividers to create hierarchy.
-   Use consistent chart heights and align chart edges.
-   Keep the primary decision workflow visible without excessive
    scrolling at a typical laptop viewport.
-   Responsive behaviour is required for tablet and phone widths.

## 4. Information architecture: three main views

The frontend has three primary views. They should feel like one coherent
workflow.

### View A --- Decision Day (primary landing view)

This is the hero workflow, not a marketing homepage.

Required elements: 1. Page title such as "Wind decision review". 2.
Decision-date selector constrained to the supported period. 3.
Configurable cutoff control, clearly labelled with timezone and whether
it is an assumption. 4. A concise summary showing selected forecast
status, matched coverage, and forecast age where applicable. 5. Main
time-series chart with selected forecast and actual generation. 6.
Visible chart units (MW, if verified) and a clear explanation of
forecast versus actual. 7. Interval detail table or selectable interval
detail panel. 8. Data-quality warning if observations are missing or
coverage is limited. 9. Link or navigation to methodology details.

Chart requirements: - Forecast = vermilion line. - Actual = ink line. -
If an empirical error band exists, use a subtle forecast-colour tint and
label it "empirical historical error range --- not a probability
interval". - Tooltips show delivery time, forecast value, actual value,
error, selected forecast `publishTime`, and forecast age when
available. - Gaps remain visible; do not draw a continuous line through
missing intervals. - Chart must explain what the cutoff means. - Never
silently show the latest forecast if it was published after the cutoff.

Default state: - Open on a meaningful, verified decision day if one is
available. - Prefer a high-error day only if it is actually computed
from the valid matched data. - If no valid sample is available, show an
honest empty state explaining why and how to select a supported date. -
Never use synthetic data as if it were live data.

### View B --- Accuracy

Required elements: - MAE, RMSE and bias. - Matched sample count and
coverage near the metrics. - Explicit error convention: forecast minus
actual; positive means overforecast. - Overforecast and underforecast
energy-volume breakdown in MWh only after source units and interval
duration are verified. - Accuracy by decision day. - Accuracy by
time-of-day block. - Accuracy by forecast lead-time bucket when
historical vintages support it. - Baseline comparison and skill score if
the baseline has been validated. - Optional error distribution and
biggest-misses list.

Metric cards must include units, a short explanation, and
sample/coverage context. Tooltips should explain terms in plain English.
Do not use MAPE by default. Do not display a skill score if the baseline
is undefined or invalid.

### View C --- Data & Methodology

Required elements: - Data sources: FUELHH and WINDFOR. -
Snapshot/build/retrieval timestamp. - Supported decision-date and
delivery-date windows. - Unit and interval definitions based on verified
API evidence. - Selected cutoff policy and whether it is an
assumption. - Coverage, missing intervals, unmatched rows, duplicates,
and validation warnings. - Methodology for forecast-vintage selection. -
Metric formulas and error sign convention. - Baseline definition and its
availability assumptions, if implemented. - Known limitations, including
that demand, prices, other generation and weather are outside scope. -
Data provenance links/references for drill-down where available.

Do not expose internal filesystem paths or stack traces.

## 5. Shared components

Build reusable, accessible components rather than one large page
component.

Suggested components: - `AppShell` - `TopNavigation` - `PageHeader` -
`DecisionControls` - `DateSelector` - `CutoffSelector` - `MetricCard` -
`CoverageBadge` (use sparingly; do not colour every label) -
`ForecastActualChart` - `VintageFanChart` - `ErrorDistributionChart` -
`AccuracyBreakdownChart` - `IntervalTable` - `IntervalDetailPanel` -
`DataQualityPanel` - `MethodologyDisclosure` - `InsightPanel` -
`LoadingSkeleton` - `EmptyState` - `ErrorState` - `TooltipHelp` -
`ExportCsvButton` (optional)

Use consistent props and typed data models. Avoid duplicate chart logic
and duplicate API-fetching logic across components.

## 6. Motion and interaction

Motion should be subtle and purposeful, not a visual gimmick.

Acceptable: - Brief page content fade/translate on initial mount. -
Short stagger for a small set of metric cards. - Smooth chart updates
when decision date or cutoff changes. - A restrained line reveal on
initial chart render. - Hover/focus transitions on buttons and
interactive rows. - Skeleton loading states.

Guidelines: - Keep typical transitions around 150--300ms; chart reveal
may be slightly longer. - Prefer `transform` and `opacity` animations. -
Avoid constant motion, looping effects, large parallax, scroll-triggered
animations everywhere, or animated number changes that distract from
precision. - Respect `prefers-reduced-motion`. - Do not animate numeric
values in a way that could imply the underlying data is changing in real
time. - Avoid layout shifts during loading.

## 7. User experience and accessibility

-   Use semantic HTML and accessible names.
-   All controls must be keyboard accessible.
-   Visible focus indicators are required.
-   Date/cutoff controls need clear labels and validation messages.
-   Tooltips must not be the only place where critical information
    exists.
-   Use text labels/icons as well as colour to distinguish forecast,
    actual, overforecast and underforecast.
-   Charts need an adjacent summary/table or accessible explanation of
    their main information.
-   Respect browser zoom and mobile viewport.
-   Aim for WCAG AA contrast.
-   Show loading, empty, partial-data, stale-data and error states.
-   Errors should use plain language and provide retry where
    appropriate.
-   Never render "0" when the API says data is missing.
-   Do not display "live" or "real-time" unless that is actually true.

## 8. Frontend/backend boundary

The frontend must: - Consume the documented FastAPI API. - Use a single
typed API client module. - Keep backend base URL in environment
configuration. - Never calculate the authoritative forecast vintage,
MAE, RMSE, bias, baseline skill score or empirical band in UI
components. - Format and present backend results only. - Validate
critical response shapes where practical. - Use TanStack Query or
equivalent for server state. - Handle request cancellation/stale results
when a user changes date/cutoff quickly. - Keep loading/error state
local to the relevant view. - Avoid hard-coded production URLs and API
response fixtures in production paths.

Synthetic fixtures may be used in frontend development, but they must be
clearly labelled and never silently become the production data source.

## 9. CSV export

If implemented: - Export the exact currently selected/filter-matched
result set. - Include delivery time, selected forecast, publish time,
actual, error, and verified units. - Include cutoff and methodology
context in metadata or a companion summary. - Escape CSV values
correctly. - Do not export records that were excluded from the visible
metric without indicating their status.

## 10. Testing

Use Vitest and React Testing Library.

Minimum frontend tests: - Loading, error and empty states. - Decision
date and cutoff controls submit the correct API parameters. -
Invalid/unavailable date is handled. - Chart data uses backend values
and does not replace null with zero. - Coverage and missing-data
warnings appear when applicable. - Metric units and error convention are
visible. - Baseline/skill score is hidden or marked unavailable when
backend says it is invalid. - AI explanation failure does not break the
dashboard. - API error responses render understandable messages. -
Keyboard focus and accessible labels exist for key controls.

Run a production build and lint/type checks before integration sign-off.

## 11. Suggested frontend folder structure

``` text
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── charts/
│   │   ├── metrics/
│   │   ├── feedback/
│   │   └── ui/
│   ├── features/
│   │   ├── decision/
│   │   ├── accuracy/
│   │   ├── vintages/
│   │   ├── data-quality/
│   │   └── insights/
│   ├── api/
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   └── errors.ts
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── styles/
│   │   ├── tokens.css
│   │   └── globals.css
│   └── main.tsx
├── tests/
├── .env.example
├── package.json
└── vite.config.ts
```

Adapt only when there is a clear simplification. Do not create empty
folders or excessive abstraction.

## 12. Design review loop for Antigravity

Implement one view at a time.

After each view: 1. Run the app. 2. Inspect it in a browser at desktop
and mobile widths. 3. Capture a screenshot. 4. Compare the screenshot
with this design specification. 5. Check visual hierarchy, spacing,
typography, chart readability, empty/error states, and consistency. 6.
Fix the biggest visible problems before adding more features.

Specific review prompts are better than "make it prettier". Examples: -
"Reduce the number of bordered cards; use whitespace to group the
sections." - "Align metric values and give all numbers tabular
numerals." - "Make the selected cutoff and forecast publication time
visible without opening a tooltip." - "Remove the blue gradient and use
the documented warm neutral palette." - "Show gaps in the chart rather
than connecting missing observations." - "Ensure the chart legend and
line styles are distinguishable without colour alone."

## 13. Frontend definition of done

-   [ ] Warm light theme and design tokens are consistent.
-   [ ] No generic AI-blue/purple gradients or dark-first layout.
-   [ ] Three main views are complete and coherent.
-   [ ] Decision Day is the primary landing experience.
-   [ ] All metric values come from backend responses.
-   [ ] No synthetic values appear as actual data.
-   [ ] Cutoff, publication time, units, sample size and coverage are
    clear.
-   [ ] Loading, empty, error and partial-data states work.
-   [ ] Charts preserve missing values and use consistent
    colours/labels.
-   [ ] Responsive layout works at laptop and mobile widths.
-   [ ] Keyboard navigation, focus indicators and contrast are checked.
-   [ ] Motion is subtle and reduced-motion preferences are respected.
-   [ ] Frontend tests, type checks, lint and production build pass.
-   [ ] The app works against the deployed API.
-   [ ] Screenshots have been reviewed and visual defects fixed.
