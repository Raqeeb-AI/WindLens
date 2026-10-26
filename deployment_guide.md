# WindLens Deployment Guide: Local, Docker, Vercel and Heroku

**Purpose:** End-to-end deployment plan for WindLens.\
**Related documents:** `backend_requirements.md`,
`frontend_requirements.md`, `frontend_backend_integration.md`.

> Platform capabilities and quotas change. Verify current platform
> settings during deployment. The architecture below is a recommended
> path, not a claim that a deployment has already succeeded.

------------------------------------------------------------------------

## 1. Recommended deployment decision

### Preferred first attempt

-   React + Vite frontend deployed to **Vercel**.
-   FastAPI backend deployed to **Vercel's Python runtime**, if the
    current project layout, dependencies, and runtime constraints work
    with the required architecture.
-   Docker used for reproducible local development and testing.
-   If the existing layered FastAPI app, Pandas dependencies, or
    packaging constraints make Vercel awkward, use **Heroku Container
    Registry** for a Docker-based backend (or a single container serving
    the frontend and API), subject to account, billing and current
    platform availability.

Official Vercel documentation describes support for FastAPI on its
Python runtime and documents a 500 MB uncompressed Python function
bundle limit. It also notes a read-only filesystem for functions, with
writable temporary storage. This makes a packaged read-only historical
snapshot more appropriate than runtime writes to the project directory.
See: - https://vercel.com/docs/frameworks/backend/fastapi -
https://vercel.com/docs/functions/runtimes/python -
https://vercel.com/docs/functions/limitations

Vercel does not deploy an arbitrary Docker container as the runtime for
a standard frontend project. Docker remains useful for local
reproducibility; if the deployment itself must run a Docker image,
choose a compatible container deployment route such as Heroku Container
Registry. Confirm the exact assessment wording and current platform
support before finalising.

### Important platform trade-off

A Vercel frontend and Vercel Python backend can be deployed as separate
projects or configured in a supported monorepo/function structure. Do
not assume that an arbitrary monorepo will work without configuration.
Verify the backend entry point, dependency bundle, snapshot inclusion,
route mapping, and runtime behaviour with a minimal skeleton before
migrating the full application.

If you want the simplest single Docker image containing FastAPI plus the
built React assets, a container deployment is usually easier to reason
about than forcing the entire architecture into a serverless function
layout. The assessment's allowed platform wording must be respected.

------------------------------------------------------------------------

## 2. Repository readiness

Before deployment, ensure the repository has:

``` text
windlens/
├── frontend/
├── backend/
├── etl/
├── data/
│   └── processed/
├── docs/
├── Dockerfile or service-specific Dockerfiles
├── compose.yaml
├── .env.example
├── .gitignore
└── README.md
```

The exact Docker layout depends on whether the project uses one combined
image or separate services. Document the chosen path and do not keep
contradictory instructions.

Check: - The production frontend build succeeds. - Backend tests pass. -
ETL/snapshot build succeeds. - The processed snapshot is included or
fetched through a documented build step. - No `.env` secrets, local
virtual environments, `node_modules`, caches, or large temporary files
are committed. - The public repository name is anonymous as requested. -
AI tools used are disclosed in the README.

------------------------------------------------------------------------

## 3. Local development without Docker

### 3.1 Backend

From the backend directory, create and activate a virtual environment,
install the project's pinned dependencies, and start FastAPI using the
documented app import path. For example, if the app entry point is
`app.main:app`:

``` bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Use the actual dependency file and import path created by the backend
agent. Do not maintain conflicting dependency lists.

Verify: - `GET http://localhost:8000/api/v1/health` -
`GET http://localhost:8000/api/v1/meta` - FastAPI docs at
`http://localhost:8000/docs`, if enabled.

### 3.2 Frontend

From `frontend/`:

``` bash
npm install
npm run dev
```

Set `.env.local` or the local environment file according to Vite
conventions:

``` env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Open the local Vite URL printed by the command. Verify requests in
browser developer tools.

Vite variables prefixed with `VITE_` are public client-side values;
never place secrets in them. Official reference:
https://vite.dev/guide/env-and-mode.html

------------------------------------------------------------------------

## 4. Docker local workflow

### 4.1 Required outcome

A reviewer should be able to run the project using the documented Docker
command without manually installing Python and Node dependencies on the
host, apart from Docker itself.

Choose one of these patterns:

**Pattern A --- Separate frontend and backend containers** - Easier to
keep the React build and Python runtime separate. - Useful during
development. - Requires clear port configuration and correct
frontend-to-backend routing.

**Pattern B --- One production container** - Build the React app in a
Node build stage. - Copy static assets into the final Python image. -
Configure FastAPI/ASGI or a production web server to serve the static
frontend and API paths. - Easier for a single container deployment, but
the route/static-serving setup must be tested carefully.

Do not run the Vite development server as the production server.

### 4.2 Multi-stage build concept

Use a multi-stage Dockerfile: 1. Node stage installs frontend
dependencies and creates the production build. 2. Python stage installs
only backend runtime dependencies. 3. Copy the frontend build and
processed snapshot into the final image if using a combined deployment.
4. Run the ASGI app with a production command. 5. Bind to the
platform-provided port where required. 6. Keep test tooling and
development-only dependencies out of the final image.

The exact Dockerfile should be written after the repository structure
and deployment target are confirmed.

### 4.3 Docker Compose

If using separate services, `compose.yaml` should define: - Backend
service. - Frontend development service or reverse proxy as
appropriate. - Snapshot mount/path if required. - Environment
variables. - Health checks where supported.

Document a single predictable command, for example:

``` bash
docker compose up --build
```

Verify it actually works before publishing the command in README.

------------------------------------------------------------------------

## 5. Deployment path A: Vercel

### 5.1 Deploy the React frontend

1.  Push the anonymous public repository to GitHub.
2.  Sign in to Vercel and import the repository.
3.  Set the frontend project root directory to `frontend/` if using a
    monorepo.
4.  Confirm the build command (commonly `npm run build`) and output
    directory (`dist` for standard Vite).
5.  Add `VITE_API_BASE_URL` for the production environment.
6.  Deploy a preview build first.
7.  Verify the preview frontend can reach the API.
8.  Promote/deploy the production branch and record the production URL.

Vercel documents Vite deployments and environment handling here: -
https://vercel.com/docs/frameworks/frontend/vite -
https://vercel.com/docs/deployments/environments -
https://vercel.com/docs/environment-variables

### 5.2 Deploy FastAPI on Vercel, if selected

1.  First deploy a minimal FastAPI application and verify a public
    `/api/v1/health` response.
2.  Follow the current official FastAPI-on-Vercel entry-point
    requirements. The application must expose a discoverable FastAPI
    `app` entry point, such as a supported `app.py` or `index.py`
    layout, or a documented adapter in the repository.
3.  Verify the layered backend can be imported in the function runtime.
4.  Verify the required dependencies fit within the documented function
    bundle limits.
5.  Ensure the processed snapshot is included at build time or is
    accessible via a supported read-only path. Do not rely on writing
    persistent files to the deployed function filesystem.
6.  Verify all route paths, including `/api/v1/...`, work as expected.
7.  Test cold-start behaviour and the first request.
8.  Add only the required CORS origins if the frontend and API use
    separate origins.
9.  Verify the public OpenAPI docs and health endpoint.
10. Deploy the complete backend only after the skeleton passes.

Official reference: https://vercel.com/docs/frameworks/backend/fastapi

### 5.3 Vercel rewrite/proxy option

A same-origin `/api/...` rewrite can avoid browser CORS complexity, but
it must be configured and tested for the selected deployment layout.
Ensure it preserves query strings, status codes, and error responses. Do
not assume a rewrite exists automatically.

### 5.4 Vercel go/no-go checks

Use a different deployment approach if: - The current project structure
cannot be mapped cleanly to supported Vercel entry points. - The
dependency bundle or snapshot exceeds supported constraints. - Required
filesystem behaviour is incompatible with the runtime. - The backend
fails on a cold start or cannot load the snapshot reliably. - The
assessment explicitly requires a Docker container deployment rather than
merely using Docker for development.

------------------------------------------------------------------------

## 6. Deployment path B: Heroku container deployment

Choose this route if a container-based deployment better fits the
project and is permitted by the assessment. Confirm account access,
billing and current platform requirements first.

High-level sequence:

1.  Install and authenticate the Heroku CLI.
2.  Create the Heroku app.
3.  Configure the required container registry/repository.
4.  Build the production Docker image.
5.  Test the image locally.
6.  Log in to the Heroku container registry.
7.  Push the image.
8.  Release the image to the app.
9.  Configure environment variables in the platform.
10. Check runtime logs and health endpoint.
11. Open the public URL in an incognito browser.
12. Verify frontend-to-backend calls and snapshot access.

Use the current official Heroku container documentation for exact
commands and syntax:
https://devcenter.heroku.com/articles/container-registry-and-runtime

Do not copy stale CLI commands from an old tutorial without checking the
current documentation.

### Combined container option

If using one image: - FastAPI serves `/api/v1/...`. - The same
application or a correctly configured production server serves the built
React assets. - Frontend API calls use a relative `/api/v1` base URL. -
SPA fallback routes must not swallow API routes. - Health checks should
target the API readiness endpoint. - Confirm the container binds to the
port supplied by the platform.

------------------------------------------------------------------------

## 7. CORS, environment variables and secrets

### Frontend variables

Example:

``` env
VITE_API_BASE_URL=https://your-api-host.example/api/v1
```

This is a placeholder, not a real URL. Replace it with the actual
deployed API URL or the configured same-origin path.

Remember: - `VITE_*` values are exposed in the client bundle. - Never
put API secrets, credentials, or private keys in frontend variables. -
Vite variables are embedded at build time; changing a platform variable
usually requires a new build/deployment.

### Backend variables

Possible settings: - `ENVIRONMENT` - `LOG_LEVEL` - `ALLOWED_ORIGINS` -
`SNAPSHOT_PATH` - `DEFAULT_CUTOFF_TIME` - optional AI provider
configuration, if the optional AI layer is implemented

Use only variables the backend actually supports. Document safe defaults
and do not commit real secrets.

### CORS

For separate origins: - Allow the exact production frontend origin. -
Add preview origins only when needed. - Do not allow every origin in
production by default. - Test preflight and GET requests from the real
deployed frontend.

For same-origin proxying, verify the proxy and API paths instead of
leaving unnecessary permissive CORS settings.

------------------------------------------------------------------------

## 8. Data snapshot deployment

The application analyses a fixed historical period, so deploy a
reproducible processed snapshot.

Before deployment: - Build the snapshot from verified source
responses. - Record the snapshot version/hash, row counts, build time
and source retrieval times. - Verify the backend loads the same snapshot
locally and in deployment. - Avoid relying on a developer's untracked
local path. - Do not make ordinary dashboard requests re-fetch the full
historical source datasets. - Include a documented refresh/rebuild
command for maintainers. - If raw records are not suitable for public
publication, follow the applicable source terms and use an appropriate
permitted data artefact.

The deployed app must show data provenance and limitations accurately.

------------------------------------------------------------------------

## 9. Production smoke tests

Run all of these after deployment:

1.  Open the homepage in incognito mode.
2.  Confirm the page loads without a login requirement if public access
    is required.
3.  Open the health endpoint.
4.  Open the API docs if enabled.
5.  Load metadata and confirm supported dates/units are real.
6.  Select a decision date and cutoff.
7.  Confirm the selected forecast publication is no later than the
    cutoff.
8.  Confirm charts match backend response values.
9.  Confirm missing data remains missing and is clearly shown.
10. Confirm accuracy metrics include sample count and coverage.
11. Confirm browser console and network tab have no critical errors.
12. Check API requests do not point to localhost.
13. Verify the snapshot exists in the deployed runtime.
14. Test a malformed query and confirm a clear error response.
15. Reload a nested frontend route directly and verify it does not
    return a 404.
16. Check mobile and laptop layouts.
17. Confirm all links work in an incognito browser.
18. Confirm no secrets appear in source, logs, or client bundles.

Keep a short deployment verification note with date, deployed commit,
public URLs, and results.

------------------------------------------------------------------------

## 10. CI/CD recommendations

Use GitHub Actions if practical: - Frontend lint and type checks. -
Frontend tests. - Frontend production build. - Backend unit and
integration tests. - Backend lint/type checks if configured. - Docker
build check. - Optional API contract consistency check.

CI should run before a deployment is treated as release-ready. A green
badge is useful only if it reflects real checks.

Do not let the pipeline claim success if a required test is skipped or
failed.

------------------------------------------------------------------------

## 11. README deployment section

The README must include: - Public application URL. - API base URL and
docs URL where public. - Local setup instructions. - Docker startup
command. - Environment variable setup. - Snapshot/ETL refresh
instructions. - Test commands. - Deployment platform and high-level
steps. - Known limitations. - AI tools used and what was independently
verified.

Use actual URLs after deployment; never leave placeholders in the final
submission.

------------------------------------------------------------------------

## 12. Final submission checklist

-   [ ] Public anonymous GitHub repository.
-   [ ] Frontend and backend integrated.
-   [ ] Docker build and local run verified.
-   [ ] Approved platform deployment works.
-   [ ] Backend health and API routes are reachable.
-   [ ] Production frontend reaches the correct backend.
-   [ ] Snapshot and provenance work in production.
-   [ ] No fake metrics or unlabelled synthetic data.
-   [ ] All public links checked in incognito mode.
-   [ ] README contains file/folder descriptions, setup steps, deployed
    URL, and AI disclosure.
-   [ ] Customer demo video is at most 5 minutes.
-   [ ] Technical review video is at most 5 minutes.
-   [ ] Total video duration is at most 10 minutes.
-   [ ] Both video parts are unlisted and accessible to reviewers.
-   [ ] Assessment form submitted.
-   [ ] Submission URLs and final deployment commit recorded.

------------------------------------------------------------------------

## 13. Final recommendation

Start with the smallest deployable skeleton and verify the platform
before polishing the product. For WindLens, a reliable static historical
snapshot and deterministic API are simpler to deploy than a live data
pipeline. Prefer Vercel when the React app and Python API fit its
current runtime and packaging constraints; use a Docker-based Heroku
deployment when container control is more important or Vercel
constraints make the architecture brittle.

Do not declare deployment complete until the deployed app, API, snapshot
and key analytical results have all been checked from a clean browser.
