# WindLens Frontend--Backend Integration Specification

**Purpose:** Contract for integrating the React/Vite/TypeScript frontend
with the FastAPI backend.\
**Related documents:** `backend_requirements.md`,
`frontend_requirements.md`, `deployment_guide.md`.

------------------------------------------------------------------------

## 1. Integration principles

1.  The FastAPI backend is authoritative for forecast selection,
    matching, metrics, baseline calculations, error bands, and
    data-quality counts.
2.  The frontend is responsible for user interaction, formatting, chart
    rendering, and explaining returned results.
3.  Both sides use explicit, versioned API contracts.
4.  No frontend component may silently substitute mock data, zero-fill
    missing values, or recompute authoritative metrics.
5.  The backend and frontend must work independently in local
    development, then be verified together in deployment.

## 2. Contract-first integration sequence

Do not wait until both applications are "finished" to integrate.

1.  Backend agent verifies Elexon responses and produces real
    schema/data verification notes.
2.  Backend agent defines Pydantic response schemas and OpenAPI
    contract.
3.  Frontend agent creates TypeScript types that match the published
    contract.
4.  Create a small, labelled synthetic fixture matching the contract for
    UI development if needed.
5.  Integrate the Decision Day page with the real API.
6.  Add Accuracy and Data & Methodology views.
7.  Run end-to-end tests against the actual processed snapshot.
8.  Deploy and verify from a clean browser.

When a contract changes, update the Pydantic schema, OpenAPI, TypeScript
types, and tests together.

## 3. Base URL and environment variables

Frontend environment file `.env.example`:

``` env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Production must set `VITE_API_BASE_URL` to the deployed API base URL or
a same-origin proxy path. Vite variables prefixed with `VITE_` are
bundled into the client and are public; never put secrets in them.

Backend configuration should define allowed CORS origins from
environment/configuration. Do not use wildcard CORS in production when
credentials are enabled.

For local development: - Backend default: `http://localhost:8000` -
Frontend default: `http://localhost:5173` - API base:
`http://localhost:8000/api/v1`

These are suggested local defaults; keep them configurable.

## 4. Required API surface

The backend specification defines these endpoints:

-   `GET /api/v1/health`
-   `GET /api/v1/meta`
-   `GET /api/v1/decision`
-   `GET /api/v1/accuracy`
-   `GET /api/v1/vintages`

The final query parameters and response shapes must come from the
implemented FastAPI/OpenAPI contract. Do not invent fields or silently
assume the backend matches an example.

### 4.1 Health

Use health checks for deployment smoke tests, not as a replacement for
checking data availability. If possible, expose snapshot-readiness
separately or include a clearly defined readiness status.

### 4.2 Metadata

The frontend uses metadata to populate: - supported decision-date
range - source labels - cutoff default and assumption status - verified
units and interval resolution - snapshot build/retrieval information -
available feature flags - quality summary and methodology version

Do not hard-code supported dates, units, or feature availability if the
backend provides them.

### 4.3 Decision response

The frontend needs, at minimum, enough contract information to
display: - decision date and cutoff - delivery interval - selected
forecast generation - selected forecast publication timestamp - forecast
age, if calculable - actual generation when matched - error when both
values are available - match/selection status - coverage and
data-quality summary - provenance references, where available

The exact JSON keys must be defined in Pydantic and confirmed in
OpenAPI. Use null for missing values and a status/reason to distinguish
why a value is absent.

### 4.4 Accuracy response

The frontend needs: - metric values and units - error convention -
matched sample count - expected interval count and coverage ratio -
breakdown rows for the requested grouping - baseline values/skill score
only when valid - cutoff and methodology context - warnings and
unavailable-feature reasons

A missing or invalid baseline must not be rendered as zero skill. Render
an explanatory unavailable state.

### 4.5 Vintages response

The frontend needs publication timestamps and forecast values for a
selected delivery interval/day, revision differences, and selection
status for the current cutoff. If vintage history is incomplete, show
that limitation.

## 5. TypeScript contract strategy

-   Define API response types in `src/types/`.
-   Keep request construction in `src/api/endpoints.ts`.
-   Keep fetch logic, HTTP errors, timeouts, and cancellation in
    `src/api/client.ts`.
-   Prefer generating TypeScript types from the backend's OpenAPI
    document when feasible. If manual types are used, add a
    contract-check step and keep them synchronised.
-   Do not duplicate business rules in frontend types or components.
-   Use explicit nullable types for fields that can be missing.
-   Use string timestamps with timezone offsets or `Z`; parse carefully
    for display.
-   Do not assume every numeric field is MW or MWh until the backend
    metadata confirms units.

## 6. API client behaviour

The shared API client must: - Use the configured base URL. - Set
appropriate request headers. - Handle non-2xx responses consistently. -
Parse the stable error schema from FastAPI. - Provide a readable
fallback message when the server returns a malformed error. - Support
request cancellation where possible. - Avoid logging full raw responses
in production. - Avoid automatic retries for invalid 4xx inputs. - Use
restrained retries only for appropriate transient failures. - Never
return a hard-coded success payload when the API is down.

## 7. Data fetching and UI states

Use TanStack Query or an equivalent server-state library.

Every view must distinguish: - Initial loading. - Successful data. -
Empty but valid result. - Partial data/coverage warnings. - Invalid user
input. - API/network error. - Snapshot unavailable or stale, if exposed
by backend metadata.

When a user changes the date/cutoff quickly: - Cancel obsolete requests
when possible. - Do not let a slow earlier response overwrite the latest
selection. - Show the selected date/cutoff that corresponds to the
visible data. - Avoid flashing stale charts without labelling them.

Use skeletons for initial load and a concise inline refresh state for
subsequent updates.

## 8. Date, cutoff and timezone handling

-   The UI must distinguish decision date from delivery date.
-   The selected decision window is January 2026, but corresponding
    delivery intervals may extend to 1 February 2026.
-   Display the cutoff timezone explicitly, e.g. `Europe/London`.
-   Do not silently convert a date-only value into a browser-local
    timestamp and thereby shift the intended cutoff.
-   Send either the documented cutoff-time field or a complete
    timezone-aware cutoff timestamp according to the backend contract.
-   Keep the selected cutoff visible in the decision view and
    methodology.
-   If the backend marks the cutoff as an assumption, show that fact in
    the UI.
-   Display the selected forecast `publishTime` and forecast age so
    users can understand how current the information was.
-   Do not call a forecast "available at cutoff" unless the backend has
    applied the eligibility rule.

## 9. Chart integration rules

-   Forecast and actual series use consistent styles throughout the app.
-   Missing values remain null/gaps; do not convert them to zero.
-   Show the units and interval resolution from verified metadata.
-   Tooltips should show delivery time, forecast, actual, error,
    publication time, and forecast age when available.
-   The frontend must not invent missing points by interpolation.
-   Show coverage and matched sample count adjacent to the chart or
    summary.
-   Error bands must carry the backend-provided label and not be
    described as a probability interval.
-   Use an accessible table or textual summary alongside charts.
-   Exported CSV must use the same selected/filter-matched dataset that
    the user is viewing.

## 10. Error contract and user-facing messages

Use a stable backend error format, for example:

``` json
{
  "error": {
    "code": "INVALID_CUTOFF",
    "message": "The cutoff value is invalid.",
    "details": {}
  }
}
```

This is an illustrative contract. The final shape must be agreed and
implemented in FastAPI.

The frontend should map known error codes to clear messages. Do not
expose stack traces or internal file paths. If the API is unreachable,
explain that the service could not be reached and offer retry.

## 11. CORS and same-origin strategy

Choose one deployment strategy and document it:

**Option A --- Separate frontend and backend origins** - Set backend
CORS allowlist to the exact production and required preview frontend
origins. - Configure the frontend API base URL. - Test preflight
requests and actual GET requests in a browser. - Never rely on CORS
settings that only work in local development.

**Option B --- Same-origin reverse proxy** - Frontend requests a
relative `/api/v1/...` path. - Hosting configuration forwards the path
to the backend. - Browser sees same-origin requests, reducing CORS
complexity. - Validate that rewrites preserve query parameters, status
codes and error responses.

Do not combine approaches accidentally. Avoid hard-coded localhost URLs
in production.

## 12. End-to-end verification checklist

-   [ ] Frontend loads metadata from the real backend.
-   [ ] Date selector uses backend-supported range.
-   [ ] Changing decision date triggers the correct request.
-   [ ] Changing cutoff triggers a new request and changes vintage
    selection when expected.
-   [ ] The selected publication timestamp is at or before cutoff.
-   [ ] Actual and forecast values match the backend response.
-   [ ] Null values render as gaps/unavailable values, never zero.
-   [ ] Metrics and sample count match API response exactly.
-   [ ] Coverage warnings appear correctly.
-   [ ] Baseline/skill score unavailable state is handled.
-   [ ] Vintage chart shows publication history returned by the API.
-   [ ] Data-quality view matches backend quality report.
-   [ ] Invalid query values produce understandable UI messages.
-   [ ] Network failure and API 5xx states are handled.
-   [ ] No mock fixtures are shown as real production data.
-   [ ] Browser console has no critical errors.
-   [ ] No production requests point to localhost.
-   [ ] CORS or same-origin proxy works from the deployed frontend.
-   [ ] One selected decision day is independently traced from API
    response to chart.

## 13. Integration ownership

-   Backend owns source parsing, cutoff selection, data matching,
    analytics, data-quality calculations and metric semantics.
-   Frontend owns layout, interaction, accessible presentation, chart
    rendering and display formatting.
-   Shared contract owns field names, nullability, units, statuses and
    error codes.
-   Neither side may silently change the meaning of a field.
-   If the backend cannot support a frontend feature, update the scope
    rather than fabricate data.

## 14. Integration definition of done

The integration is complete only when a user can select a supported
decision date and cutoff, view the forecast selected by the backend,
inspect actuals and errors, understand coverage and limitations, and
reproduce the displayed values from the backend response.
