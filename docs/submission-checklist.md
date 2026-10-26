# WindLens — Final Submission Checklist for Project Owner

**Target Repository:** [https://github.com/Raqeeb-AI/GridBricks](https://github.com/Raqeeb-AI/GridBricks)  
**Required Microsoft Submission Form:** [https://forms.cloud.microsoft/r/FTX6K2bbnU](https://forms.cloud.microsoft/r/FTX6K2bbnU)  

---

## 1. Project Owner Responsibilities (Human-in-the-Loop Boundaries)

As agreed, the AI assistant assists with technical audits, implementation, test suites, and documentation, but **never submits the assessment, contacts GridBricks, records videos, or performs destructive git pushes on your behalf.**

The final actions below must be personally completed and submitted by you:

---

## 2. Pre-Push Verification Checklist

- [x] **Audit & Lookahead Verification:** 744 target hours checked with 0 post-cutoff leaks (documented in `docs/pre-deployment-audit.md`).
- [x] **Backend Automated Test Suite:** `pytest` passes 11/11 tests.
- [x] **Frontend TypeScript & Build:** `tsc -b && vite build` builds cleanly in <2s.
- [x] **Visual QA:** Verified across desktop (1280×800) and mobile (390×844) viewports with zero layout bugs.
- [x] **Clean Local Git History:** Latest commit `4da6d7f` on branch `master`.
- [x] **Remote Configured:** `origin` set to `https://github.com/Raqeeb-AI/GridBricks.git`.
- [ ] **Push Approved Code to GitHub:**
  When you are ready to publish, execute:
  ```bash
  git push -u origin master
  ```

---

## 3. Video Recording Checklist (Max 5 Minutes Each)

Review the detailed scripts in [`docs/video-scripts.md`](video-scripts.md) before recording:

- [ ] **Video 1: Customer Demo Video (Max 5 Minutes)**
  - Topic: Walkthrough of the procurement decision workflow, Decision Day reconciliation, 3-tier KPI cards, CSV export, and Month Accuracy reliability.
  - Recommended tool: Loom, OBS, or Zoom screen recording.
  - Upload to: YouTube as **Unlisted** (or Vimeo/Loom with public link).
  - Verify link accessibility in an **Incognito / Private browser tab**.

- [ ] **Video 2: Technical Lead Review Video (Max 5 Minutes)**
  - Topic: Codebase walkthrough, architecture, Elexon BMRS source verification, lookahead rule enforcement ($publishTime \le cutoff$), analytics formulas, pytest suite execution, and Docker packaging.
  - Upload to: YouTube as **Unlisted** (or Vimeo/Loom with public link).
  - Verify link accessibility in an **Incognito / Private browser tab**.

---

## 4. Deployment Verification Checklist (If deploying live)

- [ ] Select hosting platform (e.g. Render, Railway, Heroku, Fly.io, or AWS).
- [ ] Connect repository or deploy Dockerfile.
- [ ] Verify root endpoint serves the React application (`GET /`).
- [ ] Verify API health endpoint (`GET /api/v1/health`) returns healthy.
- [ ] Test direct URL refresh and browser navigation in an incognito window.
- [ ] Update `README.md` with the live deployment URL.

---

## 5. Final Assessment Form Submission

Open the official Microsoft Form:  
👉 **[https://forms.cloud.microsoft/r/FTX6K2bbnU](https://forms.cloud.microsoft/r/FTX6K2bbnU)**

Prepare the required inputs:
1. **Full Name & Contact Information**
2. **GitHub Repository URL:** `https://github.com/Raqeeb-AI/GridBricks`
3. **Customer Demo Video URL:** (Your unlisted video link)
4. **Technical Lead Review Video URL:** (Your unlisted video link)
5. **Live Deployed Application URL:** (If deployed, e.g., Render/Railway URL)
6. **Brief Summary of Implementation & AI Disclosure:** (Reference Section 9 of `README.md`)
