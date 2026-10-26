# WindLens Backend Requirements and Implementation Specification

**Document status:** Backend implementation contract\
**Project:** GridBricks technical assessment\
**Scope:** Backend only. Frontend requirements will be documented
separately.\
**Primary stack:** Python, FastAPI, Pydantic, Pandas/NumPy, HTTPX,
Pytest, Docker\
**Data scope:** Elexon FUELHH and WINDFOR only\
**Important:** This document defines intended behaviour. Any API details
not verified against a real Elexon response are explicitly marked as
unverified and must not be guessed by the implementation agent.

------------------------------------------------------------------------

## 1. Backend mission

Build a modular, testable backend that supports two customer outcomes:

1.  Reconstruct the national wind-generation forecast available at a
    configurable day-ahead procurement decision cutoff.
2.  Evaluate that forecast against actual generation using transparent,
    reproducible metrics and useful error analysis.

The backend must prioritise correctness, traceability, explicit
assumptions, and stable contracts over feature count.

### Non-goals

Do not build backend functionality for:

-   External weather or meteorological data.
-   Electricity prices, demand, other generation sources, procurement
    positions, or cost/savings calculations.
-   A new machine-learning weather or wind-generation forecasting model.
-   Autonomous trading or procurement recommendations.
-   Uncalibrated risk labels such as "Normal" or "Elevated".
-   A required LLM/AI agent. AI explanations are optional and must never
    be the source of numerical truth.
-   Authentication, a database, a separate cache service, or
    microservices unless a verified requirement makes one necessary.

------------------------------------------------------------------------

## 2. Authoritative assessment constraints

The original assessment is the primary authority. Implement these
requirements:

-   National-level wind generation only.
-   Use Elexon FUELHH actuals, filtered to `fuelType=WIND`.
-   Use Elexon WINDFOR forecasts.
-   Relevant fields named in the brief:
    -   FUELHH: `startTime`, `generation`, `fuelType`
    -   WINDFOR: `startTime`, `publishTime`, `generation`
-   The analysis concerns procurement **decision dates in January
    2026**, not simply delivery dates in January.
-   Frontend: React; backend: Python; use Docker; deploy through a
    platform permitted by the brief (Vercel or Heroku).
-   Provide a public, anonymously named GitHub repository, README,
    deployed link, two-part unlisted video, and required submission.
-   Disclose AI tools used in the README.

Do not assume the exact raw response shape, parameter names, units,
publication cadence, interval granularity, or historical vintage
coverage until verified against current documentation and real API
responses.

------------------------------------------------------------------------

## 3. Mandatory research and data-verification gate

Before building analytics, create a small API spike script and verify
both datasets.

### 3.1 Verify FUELHH

Confirm from real API responses and current documentation:

-   Accepted request parameters and date filters.
-   How to filter to `WIND`.
-   Exact field names, data types, nullability, units, and timestamp
    formats.
-   Historical coverage for the required delivery intervals.
-   Whether records are duplicated or revised.
-   Whether the response has any actual publication/availability
    timestamp. Do not assume it does.

### 3.2 Verify WINDFOR

Confirm:

-   Accepted request parameters and date filters.
-   Exact response schema, units, nullability, and timestamp formats.
-   Delivery interval granularity.
-   Historical coverage for the required dates.
-   Whether multiple `publishTime` values exist for the same
    `startTime`.
-   Whether the API can retrieve superseded historical forecast
    vintages, and how to request them.
-   Any response-window limits, pagination behaviour, or practical
    request-size constraints.

### 3.3 Verify comparability

Confirm whether FUELHH actuals and WINDFOR forecasts represent
comparable national wind-generation scope and whether their delivery
intervals align.

If granularities differ, do not silently interpolate or duplicate rows.
Define and test an aggregation/alignment rule, document it, and expose
the limitation.

### 3.4 Gate outcome

Produce `docs/data-verification.md` containing:

-   Request examples used (without secrets).
-   A schema summary based on observed responses.
-   Sample retrieval date/time.
-   Coverage and vintage-count findings.
-   Granularity and unit findings.
-   Known data-quality issues.
-   Unresolved questions and the impact on features.

If historical vintages cannot be reconstructed, do not claim to evaluate
the forecast actually available at decision time. Disable or reframe
vintage-dependent features and document the limitation.

------------------------------------------------------------------------

## 4. Decision dates, delivery dates, cutoff and time semantics

These concepts must remain separate in code and documentation:

-   **Decision date:** date the buyer makes the procurement decision.
-   **Delivery time:** interval to which a forecast or actual relates
    (`startTime` in the brief).
-   **Publication time:** when a forecast was published (`publishTime`
    in the brief).
-   **Decision cutoff:** latest publication time eligible for the
    decision.

For a decision date `D`, the intended delivery day is the following day.
Therefore, decisions dated 1--31 January 2026 may concern delivery dates
2 January--1 February 2026. Derive the required delivery window from the
decision dates; do not filter only on January delivery dates.

### 4.1 Cutoff

-   The cutoff must be configurable.
-   A proposed default is decision day `D-1` at `09:00 Europe/London`,
    but this is an **illustrative modelling assumption**, not a
    confirmed market-wide gate closure or confirmed customer cutoff.
-   Make the cutoff policy explicit in API responses and methodology
    metadata.
-   Do not hard-code the cutoff into analytics functions.
-   Use timezone-aware timestamps. Normalise internal timestamps to UTC
    and preserve the configured timezone/cutoff context for display.
-   January is normally on GMT in the UK; still use timezone-aware
    processing and test it.

### 4.2 Forecast-vintage rule

For a delivery interval `t` and decision cutoff `c`, select the latest
eligible forecast publication:

`selected_publish_time = max(publishTime where publishTime <= c)`

Selection must be performed independently for each delivery interval.

-   Never use a forecast published after the cutoff.
-   Never replace a missing eligible forecast with the latest forecast
    published later.
-   If there is no eligible forecast, report that interval as
    unavailable.
-   Handle ties and duplicate `(startTime, publishTime)` keys
    deterministically and report them.
-   Return the selected `publishTime`, forecast age at cutoff, and
    selection status for every interval.

### 4.3 Actual availability caveat

The fields listed in the brief do not establish when FUELHH actuals
first became available to the buyer. Do not claim that an actual was
known at the historical decision cutoff unless a verified source field
or source rule supports that claim.

For forecast evaluation, actuals are the eventual observed outcomes. For
any baseline intended to represent information available at decision
time, explicitly state and validate the availability assumption for
prior actuals.

------------------------------------------------------------------------

## 5. Backend architecture and dependency rules

Use a layered modular monolith. Do not build microservices.

### 5.1 Dependency direction

-   **API layer:** validates requests, invokes application services,
    serialises responses.
-   **Application/service layer:** coordinates use cases and repository
    access.
-   **Domain/analytics layer:** pure functions and domain rules; no HTTP
    calls and no FastAPI dependencies.
-   **Repository layer:** reads the validated processed snapshot.
-   **External client layer:** knows Elexon request details and raw
    response handling.
-   **ETL layer:** fetches, validates, normalises, de-duplicates, and
    builds snapshots.

Routes must not contain metric calculations. Analytics functions must
not call Elexon directly. Frontend-specific presentation logic must not
be embedded in the backend.

### 5.2 Required folder structure

Create the following structure, adjusting only where a simpler
arrangement has a clear benefit:

``` text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── router.py
│   │   └── routes/
│   │       ├── health.py
│   │       ├── metadata.py
│   │       ├── decision.py
│   │       ├── accuracy.py
│   │       └── vintages.py
│   ├── schemas/
│   │   ├── common.py
│   │   ├── decision.py
│   │   ├── accuracy.py
│   │   ├── vintages.py
│   │   └── quality.py
│   ├── domain/
│   │   ├── models.py
│   │   ├── enums.py
│   │   └── rules.py
│   ├── services/
│   │   ├── decision_service.py
│   │   ├── accuracy_service.py
│   │   ├── baseline_service.py
│   │   ├── vintage_service.py
│   │   └── quality_service.py
│   ├── analytics/
│   │   ├── vintage_selection.py
│   │   ├── matching.py
│   │   ├── metrics.py
│   │   ├── lead_time.py
│   │   ├── time_of_day.py
│   │   ├── baseline.py
│   │   └── error_bands.py
│   ├── repositories/
│   │   ├── interfaces.py
│   │   └── snapshot_repository.py
│   ├── clients/
│   │   └── elexon_client.py
│   └── core/
│       ├── config.py
│       ├── logging.py
│       └── exceptions.py
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   └── fixtures/
├── pyproject.toml
└── README.md

etl/
├── fetch.py
├── validate.py
├── transform.py
└── build_snapshot.py

data/
├── raw/
└── processed/

docs/
├── data-verification.md
├── methodology.md
└── architecture-decisions.md
```

Do not create empty modules just to match this tree. Implement the
essential modules first, but preserve the responsibility boundaries.

------------------------------------------------------------------------

## 6. Domain models and data contracts

Map provider-specific raw fields to stable internal models at the
ingestion boundary. Confirm exact raw types before implementing parsers.

### 6.1 Core internal records

**ForecastRecord** - `delivery_time`: timezone-aware timestamp -
`publish_time`: timezone-aware timestamp - `generation`: numeric value
or null where the source permits it - Optional source-record/provenance
identifier

**ActualRecord** - `delivery_time`: timezone-aware timestamp -
`generation`: numeric value or null where the source permits it -
Optional source-record/provenance identifier

**DecisionContext** - `decision_date` - `cutoff_timestamp` -
`timezone` - `cutoff_policy_name` - `cutoff_policy_is_assumption`

**MatchedInterval** - `delivery_time` - `selected_forecast_generation` -
`selected_publish_time` - `actual_generation` - `forecast_age_minutes` -
`error_forecast_minus_actual` - match/selection status -
source/provenance identifiers where available

**AccuracySummary** - MAE - RMSE - mean error/bias - overforecast and
underforecast counts/volumes - matched sample count - expected interval
count - coverage ratio - unit and metric definitions

**DataQualityReport** - record counts at each processing stage -
duplicate counts - missing-field counts - missing/unmatched interval
counts - invalid timestamp counts - source retrieval metadata -
validation warnings

### 6.2 Contract requirements

-   Use Pydantic for API input/output validation and suitable
    data-boundary validation.
-   Use explicit enums for statuses and supported grouping options.
-   Return consistent timestamps in ISO 8601 with timezone information.
-   Return null/missing values explicitly; never convert missing
    generation to zero.
-   Include units in metadata and metric responses only after source
    units are verified.
-   Avoid exposing raw provider-specific schemas to every layer.

------------------------------------------------------------------------

## 7. ETL and snapshot pipeline

The historical assessment window is fixed, so the deployed app should
read a reproducible processed snapshot rather than depend on live Elexon
calls for every page load.

### 7.1 Pipeline stages

1.  Fetch source records from FUELHH and WINDFOR using verified request
    parameters.
2.  Save raw responses with retrieval timestamps and a content hash,
    where appropriate.
3.  Validate the response shape and required fields.
4.  Parse timestamps and normalise timezone handling.
5.  Apply the FUELHH wind filter using the verified source field.
6.  De-duplicate deterministically and record duplicate counts.
7.  Validate units and interval granularity.
8.  Build a consistent set of delivery intervals and forecast vintages.
9.  Generate a data-quality report.
10. Write processed snapshot files atomically, so a failed run does not
    leave a partially written snapshot.
11. Record a manifest describing source files, retrieval times, schema
    version, processing version, row counts, and hashes.

### 7.2 Idempotency

Re-running the ETL against the same raw source responses and same
code/configuration must produce equivalent processed data and analytical
results. Define deterministic sort order and duplicate handling.

### 7.3 Missing and duplicate data

-   Never fill missing generation with zero.
-   Do not silently drop unmatched rows.
-   Keep counts before and after filtering, de-duplication, matching,
    and analysis.
-   Use the verified natural keys for each dataset.
-   For duplicate `(delivery_time, publish_time)` forecasts, use a
    documented deterministic rule and surface duplicates in the quality
    report. Do not assume the latest ingestion is semantically the
    correct source record unless source behaviour justifies it.
-   Distinguish "no forecast available by cutoff" from "forecast exists
    but no matching actual".

### 7.4 Data retention and repository hygiene

-   Keep snapshots small and versioned.
-   Do not commit credentials.
-   Check applicable Elexon terms before publishing raw records.
-   If raw data should not be committed, provide a documented
    reproducible fetch/build command and include only an appropriately
    sized permitted processed sample or artefact.
-   The deployed application must not depend on an untracked local file.

------------------------------------------------------------------------

## 8. Analytics requirements

Implement numerical logic as pure, unit-tested functions where possible.

### 8.1 Error convention and primary metrics

Use:

`error = forecast_generation - actual_generation`

Under this convention: - Positive error = overforecast. - Negative error
= underforecast.

Metrics over matched intervals only:

-   `MAE = mean(abs(error))`
-   `RMSE = sqrt(mean(error ** 2))`
-   `bias = mean(error)`
-   overforecast/underforecast counts and totals
-   sample size `n`
-   coverage = matched eligible intervals / expected eligible intervals,
    with the denominator defined and documented

Do not use MAPE by default because actual generation may be zero or near
zero. Every summary must expose `n` and coverage. Never compare metric
values with different denominators without making that clear.

### 8.2 Energy-volume interpretation

If, and only if, the source generation value is verified as
interval-average MW and the interval is 30 minutes:

`interval_error_mwh = error_mw * 0.5`

Aggregate positive and negative errors separately so overforecast and
underforecast energy volumes are not obscured by cancellation. Confirm
sign and unit conventions in the API contract and UI-facing metadata.

Do not call these financial losses or procurement costs.

### 8.3 Accuracy breakdowns

Implement: - Overall accuracy for the selected decision window and
cutoff. - Daily accuracy. - Time-of-day blocks using delivery time, with
block definitions documented. - Forecast lead-time buckets using the
relationship between delivery time and publication time, if sufficient
historical vintages exist. - Error distribution/percentiles only when
there are enough observations and the sample size is shown.

Use consistent matching and denominator rules across breakdowns.

### 8.4 Baseline benchmark and skill score

Implement a simple baseline only after defining a defensible
information-availability rule. A possible candidate is a prior observed
day/profile using FUELHH, but the source fields specified in the brief
do not prove when actuals became available. Document this limitation and
do not claim strict historical availability unless verified.

If a baseline is valid:

`skill_score = 1 - (MAE_forecast / MAE_baseline)`

Interpretation: - Positive: forecast MAE is lower than baseline MAE. -
Zero: equal MAE. - Negative: forecast MAE is higher than baseline MAE.

Handle a zero or unavailable baseline MAE explicitly; never divide by
zero or present an undefined score as a number. Display baseline
definition, sample size, and cutoff assumptions.

### 8.5 Forecast revisions

For the same delivery interval, compare eligible publication vintages
and calculate the change between successive forecasts. Return the
publication timestamps and values that support each revision. Do not
call a revision a weather event or infer its cause.

If vintage history is unavailable or incomplete, return a clear
unavailable/limited status rather than fabricated history.

### 8.6 Cutoff sensitivity

Where the data supports it, recalculate accuracy at several configured
cutoffs. Return the exact cutoff used for each calculation, matched
sample count, and coverage. The default cutoff remains an explicit
assumption unless confirmed.

### 8.7 Empirical error band

Optional, subject to data sufficiency:

-   Calculate error ranges from eligible prior observations only.
-   Define the historical lookback window and minimum sample
    requirement.
-   Prevent observations from the target decision day or future dates
    from leaking into the band.
-   Label the result "empirical historical error range --- not a
    probability interval".
-   Do not describe it as a calibrated confidence or prediction
    interval.

### 8.8 Biggest misses

Rank the largest absolute errors only among matched intervals. Return
actual, selected forecast, error, publication time, forecast age, and
delivery time. State how ties are resolved. Allow the caller to select a
daily or interval-level grouping if implemented.

------------------------------------------------------------------------

## 9. API endpoints

Use `/api/v1` versioning and consistent response envelopes where
practical. The following are the initial required routes; do not create
extra routes without a clear use case.

### 9.1 `GET /api/v1/health`

Returns service health and whether the processed snapshot can be loaded.
Do not expose secrets or sensitive environment details.

### 9.2 `GET /api/v1/meta`

Returns: - dataset/source names - snapshot build time and retrieval
metadata - supported decision-date range - verified units and interval
resolution - cutoff default and whether it is an assumption - available
feature flags (e.g. vintage history available) - data-quality summary -
methodology/version identifier

Do not claim a source property as verified unless the API spike
established it.

### 9.3 `GET /api/v1/decision`

Suggested query parameters: - `decision_date` - optional `cutoff_time`
or explicit timezone-aware `cutoff_timestamp` - optional supported
grouping/interval filters

Returns: - decision context - derived delivery window - selected
forecast per interval - forecast publication timestamp and age -
matching actual, where available - error and energy-volume error if
units are verified - selection/matching status - coverage and
data-quality summary - source provenance references

Validate dates and cutoff formats. Reject unsupported ranges with a
clear 4xx response.

### 9.4 `GET /api/v1/accuracy`

Suggested parameters: - `decision_date` or supported date range - cutoff
configuration - optional `group_by` from a strict allowlist: `overall`,
`day`, `time_of_day`, `lead_time` - optional baseline flag if the
baseline is available and valid

Returns: - metrics and units - sample size and coverage - group
results - baseline metrics and skill score when requested and valid -
cutoff and methodology details - warnings about missing data or
assumptions

### 9.5 `GET /api/v1/vintages`

Suggested parameters: - required `delivery_date` or delivery interval -
optional cutoff or range, validated against supported data

Returns: - available publication vintages - publication timestamp and
generation value for each vintage - revision differences - selection
indicator for a supplied cutoff - data-completeness warnings

### 9.6 API error handling

-   Use appropriate HTTP status codes.
-   Return a stable error schema with a machine-readable code and
    human-readable message.
-   Never return Python stack traces to clients.
-   Log internal details without leaking secrets.
-   Distinguish invalid input, missing data, unavailable snapshot,
    upstream API failure during ETL, and internal errors.
-   Do not return HTTP 200 with fabricated or silently empty analytics
    when a required calculation failed.

Use FastAPI's OpenAPI docs and include how to access them in the README.

------------------------------------------------------------------------

## 10. Optional AI intelligence layer

AI is an optional, isolated capability. Core analytics must work fully
without an LLM or external AI service.

### 10.1 Deterministic insight service first

Create structured insight objects from verified calculations, such as: -
unusually large forecast revision compared with a documented threshold -
forecast age at cutoff - persistent overforecast/underforecast pattern
in the selected sample - low matched coverage - largest observed errors

Each insight should contain: - stable insight type/code - short title -
structured evidence values - interval/source references - rule or
threshold used - limitations/warnings

Do not create uncalibrated "risk probability" labels.

### 10.2 Optional LLM explanation adapter

If added, isolate the provider behind an interface such as
`InsightExplainer`. It may turn deterministic insight objects into
concise prose, but must not calculate authoritative metrics, select
forecast vintages, or fetch unapproved data.

Requirements: - AI output is optional; the app remains functional when
the provider is unavailable. - Provide only the minimum structured
evidence needed. - Do not permit weather, price, demand, or causal
claims unsupported by the two datasets. - Validate the output and
clearly mark it as an explanatory summary. - Never let generated prose
overwrite metric values. - Record provider/configuration choices in
documentation without committing API keys. - Test fallback behaviour and
unsupported-claim handling. - Include AI use in the project README.

Do not build multi-agent orchestration or autonomous procurement actions
for this assessment.

------------------------------------------------------------------------

## 11. Configuration, logging and security

### Configuration

Use typed settings, preferably via Pydantic Settings or an equivalent
small configuration module. Provide `.env.example` for local settings.
Do not require secrets for reading the processed snapshot.

Configuration may include: - snapshot location - logging level - allowed
CORS origins - default cutoff policy/timezone - optional AI provider
settings - environment/deployment mode

Do not hard-code production URLs throughout the codebase.

### Logging

Log: - ETL start/end and elapsed time - source request status and
retrieval time - row counts before and after each major transform -
validation failures and duplicate counts - snapshot version/hash - API
failures and unexpected exceptions

Do not log credentials or unnecessary sensitive payloads.

### Security and reliability

-   Restrict CORS to the actual deployed frontend origin(s).
-   Validate all request parameters.
-   Set reasonable HTTP timeouts and bounded retries for ETL requests.
-   Do not make external API calls as a side effect of ordinary
    analytics requests.
-   Do not expose filesystem paths, secrets, stack traces, or raw
    internal exception messages.
-   Ensure snapshot writes are atomic and failures are surfaced.
-   Keep dependencies minimal and pinned/locked appropriately for
    reproducibility.

------------------------------------------------------------------------

## 12. Testing and quality gates

Tests are required for analytical correctness, not just route
availability.

### Unit tests

At minimum: 1. Latest eligible vintage selected. 2. Future publication
excluded. 3. No eligible vintage reported as missing. 4. Duplicate
vintage handling is deterministic. 5. Error sign convention is correct.
6. MAE hand-calculated fixture. 7. RMSE hand-calculated fixture. 8. Bias
hand-calculated fixture. 9. MWh conversion tested only under verified
units/interval duration. 10. Missing actual does not become zero. 11.
Unmatched intervals are counted. 12. Coverage denominator is correct.
13. Baseline uses only its permitted historical window. 14. Skill score
edge cases handled. 15. Error band excludes future/target-day leakage.
16. Timestamp timezone conversion works. 17. Lead-time bucket boundaries
are tested. 18. Duplicate/missing timestamps are reported.

### Integration and contract tests

-   Parse saved, real Elexon response fixtures.
-   Validate ingestion against the verified schema.
-   Run ETL twice and compare processed output.
-   Validate each API response against Pydantic schemas.
-   Test invalid date, invalid cutoff, and unsupported grouping
    parameters.
-   Test missing/corrupt snapshot behaviour.
-   Test the complete decision-day request from snapshot to response.

### Independent verification

-   Select at least one real decision day.
-   Recalculate a small sample's error and MAE independently in a
    spreadsheet or separate script.
-   Compare those results with the API output.
-   Preserve the validation note and test output for the technical
    demonstration.

Use synthetic data for deterministic unit tests, but label it synthetic.
Do not present test fixtures as actual Elexon observations.

------------------------------------------------------------------------

## 13. Docker and deployment requirements

-   Provide a Dockerfile and a simple local run command.
-   A compose file may be used if it materially simplifies development.
-   Confirm the processed snapshot is included or mounted appropriately
    in the deployment.
-   Do not rely on ephemeral local files created only on the developer's
    machine.
-   Test the backend and frontend integration from a clean browser.
-   Deploy a minimal skeleton early, then deploy the complete version.
-   Use a platform permitted by the original brief and verify its
    current Python/Docker constraints before committing to the
    deployment approach.
-   Provide health checks and useful startup errors.
-   Test the public URL in incognito mode.
-   Document the actual deployed API and application URLs.

------------------------------------------------------------------------

## 14. Definition of done

The backend is ready for frontend integration when all of the following
are true:

-   [ ] Both Elexon datasets have been verified against real responses.
-   [ ] Required historical forecast vintages have been checked and
    availability is documented.
-   [ ] Decision dates and delivery dates are distinguished correctly.
-   [ ] Cutoff is configurable and its default is explicitly labelled as
    an assumption if not confirmed.
-   [ ] No selected forecast is published after the cutoff.
-   [ ] Forecast and actual intervals are matched under a documented
    rule.
-   [ ] Missing and duplicate data are visible and not zero-filled.
-   [ ] Metrics include sample size and coverage.
-   [ ] Baseline assumptions are documented and no unsupported
    availability claim is made.
-   [ ] API responses have stable, validated schemas.
-   [ ] Business logic is not embedded in route handlers.
-   [ ] Unit, integration, and contract tests pass.
-   [ ] One real result has been independently cross-checked.
-   [ ] ETL is reproducible and snapshot provenance is retained.
-   [ ] Docker startup works.
-   [ ] Backend deployment is publicly reachable where required.
-   [ ] Optional AI can fail without breaking core analytics.
-   [ ] README documents setup, methodology, data limitations,
    deployment, and AI use.

------------------------------------------------------------------------

## 15. Instructions for the coding agent in Antigravity

Implement this specification incrementally. Do not generate the entire
application in one unreviewed pass.

Recommended implementation order:

1.  Inspect the repository and create the minimal backend/ETL skeleton.
2.  Implement the API spike and save real sample responses.
3.  Document and verify schemas before writing the full parser.
4.  Implement parsing, validation, and snapshot creation.
5.  Implement vintage selection as a pure function and test it
    thoroughly.
6.  Implement matching and accuracy metrics with hand-calculated tests.
7.  Implement baseline and other optional analytics only after defining
    their availability assumptions.
8.  Add the snapshot repository and application services.
9.  Add FastAPI schemas and routes.
10. Add integration and contract tests.
11. Add deterministic insights; add the optional AI adapter only if
    approved and still useful.
12. Add Docker, run the complete test suite, and document how to start
    the backend.

For every stage: - State which files will be created or changed. -
Explain the design briefly before large changes. - Use the verified API
samples rather than guessing field names. - Do not invent API
parameters, response fields, units, or record counts. - Keep changes
small enough to review. - Run tests and report actual results; never
claim tests passed without running them. - Show row counts and
validation summaries for ETL steps. - Flag any conflict between the
observed API and this specification. - Ask for a decision only when an
unresolved issue materially changes correctness or scope; otherwise
choose the simplest documented implementation. - Do not begin frontend
implementation from this document. Frontend requirements will be
supplied separately.

**Final engineering principle:** correctness and reproducibility come
first. A feature is complete only when its behaviour is tested, its
assumptions are documented, and its displayed result can be traced back
to the underlying data.
