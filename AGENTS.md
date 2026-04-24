# Agents Documentation

This file documents the roles of agents and subagents used in the MathJobs project, along with a report of tasks performed and decisions made.

---

## Table of Contents
1. [Agent Roles](#agent-roles)
2. [Subagent Types](#subagent-types)
3. [Meeting Report - April 24, 2026](#meeting-report---april-24-2026)
4. [Task Execution Log](#task-execution-log)
5. [Decision Rationale](#decision-rationale)

---

## Agent Roles

### Primary Agents (Interactive)

| Agent | Role | When to Use |
|-------|------|-------------|
| **Tech Lead Agent** (current) | Planning, technical strategy, task breakdown, coordination | Initial planning, architecture decisions, coordinating subagents |
| **Build Agent** | Default agent with all tools enabled | General development work, when no specialization needed |

### Specialized Subagents (via Task Tool)

| Subagent Type | Role | Domain Expertise |
|---------------|------|------------------|
| **backend-developer** | Creates backend code and APIs | Server-side logic, database design, API endpoints, authentication |
| **frontend-developer** | Creates frontend code and components | UI/UX, React components, state management, responsive design |
| **devsecops** | DevSecOps specialist for security auditing | Security reviews, CI/CD pipelines, infrastructure, compliance |
| **qa-reviewer** | Performs code reviews and QA validation | Testing strategies, test plans, quality metrics, bug tracking |
| **general** | General-purpose for research and multi-step tasks | Fallback when specialized agents unavailable |
| **explore** | Fast codebase exploration | Searching files, analyzing code patterns, documentation research |

---

## Subagent Types

### Available Subagent Types (System-Level)

These are the built-in subagent types that can be invoked via the `task` tool:

#### 1. backend-developer
- **Description:** Creates backend code and APIs
- **Status:** ✅ Operational (after fix)
- **Model:** System default (opencode/hy3-preview-free)
- **Tools:** write: true, edit: true, bash: false
- **Permissions:** edit: ask, bash: ask, webfetch: deny
- **Use When:** 
  - Designing database schemas
  - Creating API endpoints
  - Implementing authentication
  - Building business logic

#### 2. frontend-developer
- **Description:** Creates frontend code and components
- **Status:** ✅ Operational
- **Model:** System default
- **Tools:** write: true, edit: true, bash: false
- **Permissions:** edit: ask, bash: ask, webfetch: deny
- **Use When:**
  - Building React components
  - Setting up state management
  - Creating forms with validation
  - Implementing UI/UX designs

#### 3. devsecops
- **Description:** DevSecOps specialist for security auditing and DevOps security
- **Status:** ✅ Operational
- **Model:** anthropic/claude-sonnet-4-20250514
- **Tools:** write: true, edit: true, bash: false
- **Permissions:** edit: ask, bash: ask, webfetch: deny
- **Skills:** devops
- **Use When:**
  - Security audits needed
  - CI/CD pipeline setup
  - Infrastructure configuration
  - Compliance requirements (GDPR, OWASP)

#### 4. qa-reviewer
- **Description:** Performs code reviews and QA validation
- **Status:** ✅ Operational
- **Model:** anthropic/claude-sonnet-4-20250514
- **Tools:** write: false, edit: false, bash: true
- **Skills:** code-review-and-quality, documentation-helper
- **Use When:**
  - Code quality reviews needed
  - Testing strategy required
  - Test case creation
  - Quality metrics definition

#### 5. general
- **Description:** General-purpose agent for research and multi-step tasks
- **Status:** ✅ Operational
- **Model:** System default
- **Tools:** All tools available
- **Use When:**
  - Specialized agents unavailable
  - Research tasks needed
  - Multi-domain problems
  - Fallback for any agent type

#### 6. explore
- **Description:** Fast agent specialized for exploring codebases
- **Status:** ❓ Not yet tested
- **Model:** System default
- **Tools:** Read-only (no write/edit)
- **Use When:**
  - Searching for files by patterns
  - Analyzing code structure
  - Finding specific implementations
  - Documentation research

---

## Meeting Report - April 24, 2026

### Meeting Purpose
Technical planning meeting for the MathJobs (ShiftMatch) restaurant staffing platform to review the implementation plan with specialized agents.

### Meeting Participants
| Agent | Type | Status | Participation |
|-------|------|--------|---------------|
| Backend Developer | Subagent (backend-developer) | ✅ Operational | ✅ Full review provided |
| Frontend Developer | Subagent (frontend-developer) | ✅ Operational | ✅ Full review provided |
| DevSecOps | Subagent (devsecops) | ✅ Operational | ✅ Full review provided |
| QA Reviewer | Subagent (qa-reviewer) | ✅ Operational | ✅ Full review provided |
| Tech Lead | Primary (current) | ✅ Leading | ✅ Coordination |

### Meeting Timeline

#### 15:04 - Initial Attempt
- **Action:** First attempt to launch meeting with all 4 subagents
- **Result:** 
  - ✅ Frontend Agent: Responded successfully
  - ❌ Backend Agent: `ProviderModelNotFoundError` (invalid model config)
  - ✅ QA Agent: Responded (via general subagent)
  - ✅ DevSecOps Agent: Responded (via general subagent)
- **Issue:** `backend-developer` had invalid model `anthropic/claude-haiku-3-20241022`

#### 15:15 - Agent Fix Attempt
- **Action:** Read agent config files in `~/.config/opencode/agents/`
- **Finding:** `backend-developer.md` had invalid model specification
- **Fix Attempt 1:** Removed invalid model → Still failed
- **Fix Attempt 2:** Added `model: opencode/hy3-preview-free` → Still failed
- **Conclusion:** Built-in subagent types use system-level configs, not user config files

#### 15:17 - Agent Config Updates
- **Action:** Created `~/.config/opencode/agents/backend-fixed.md` as workaround
- **Note:** This creates a custom agent invokable via `@backend-fixed`, but doesn't fix built-in subagent

#### 16:06 - User Removes Model Definitions
- **Action:** User removed model definitions from all agent configs
- **Result:** All 4 built-in subagents became operational

#### 16:07 - Second Meeting Launch (Successful)
- **Action:** Relaunched meeting with all 4 agents
- **Result:** ✅ All agents responded successfully
  - Backend Agent: Provided schema fixes, API structure, error handling
  - Frontend Agent: Provided component architecture, state management recommendations
  - DevSecOps Agent: Provided security assessment, CI/CD pipeline, compliance checklist
  - QA Agent: Provided testing strategy, coverage targets, E2E test scenarios

---

## Task Execution Log

### Task 1: Fix Backend Agent
**When:** April 24, 2026 - 15:04 to 16:06  
**Why:** Backend agent was returning `ProviderModelNotFoundError`, preventing meeting participation  
**What Was Done:**
1. Read agent config files in `~/.config/opencode/agents/`
2. Identified invalid model in `backend-developer.md` (line 5: `model: anthropic/claude-haiku-3-20241022`)
3. Attempted fix by removing model definition → Still failed
4. Attempted fix by setting valid model → Still failed
5. User removed all model definitions from agent configs
6. Tested all 4 agents → All became operational

**Result:** ✅ All agents operational and participated in meeting

**Files Modified:**
- `~/.config/opencode/agents/backend-developer.md` (removed model definition)

---

### Task 2: Update Implementation Plan (v2.0)
**When:** April 24, 2026 - 16:30  
**Why:** Original plan (v1.0) lacked critical feedback from specialized agents  
**What Was Done:**
1. Read original `IMPLEMENTATION_PLAN.md`
2. Incorporated feedback from all 4 agents:
   - **Backend Agent:** Fixed Prisma schema (indexes, relations, NextAuth models), API endpoints, error handling
   - **Frontend Agent:** Clarified state management (BOTH TanStack Query + Zustand), component architecture, Server/Client Component strategy
   - **DevSecOps Agent:** Added CI/CD pipeline, security checklist, GDPR compliance, OWASP Top 10 mitigations
   - **QA Agent:** Added comprehensive testing strategy (Playwright E2E NOT optional!), coverage targets, test scenarios
3. Updated tech stack (Auth.js v5, not NextAuth v4)
4. Added detailed API endpoint structure with RBAC
5. Created comprehensive testing strategy with tools (Jest, Playwright, axe-core)
6. Added security headers, rate limiting, audit logging

**Result:** ✅ Created `IMPLEMENTATION_PLAN.md` v2.0 with 688+ lines of detailed documentation

**Key Changes:**
- Database schema: Added indexes, fixed Review relations, added NextAuth adapter models
- API endpoints: 20+ endpoints with RBAC enforcement
- Testing: 90% domain coverage, 85% API coverage, 100% critical paths
- Security: Snyk, Semgrep, TruffleHog in CI/CD
- GDPR: Data export/delete endpoints, privacy compliance

---

### Task 3: Create Detailed Task List
**When:** April 24, 2026 - 16:45  
**Why:** Need actionable, prioritized tasks to track implementation progress  
**What Was Done:**
1. Created 30 tasks using `todowrite` tool
2. Categorized by phase (1-5) and priority (high/medium/low)
3. Included testing tasks (unit, integration, E2E)
4. Set dependencies and effort estimates

**Result:** ✅ 30 tasks created with priorities

**Task Breakdown:**
- Phase 1 (Foundation): 12 tasks - HIGH priority
- Phase 2 (Waiter): 4 tasks - MEDIUM priority
- Phase 3 (Restaurant): 4 tasks - MEDIUM priority
- Phase 4 (Interaction): 3 tasks - LOW priority
- Phase 5 (Enhancement): 2 tasks - LOW priority
- Testing: 3 tasks - HIGH priority

---

### Task 4: Configure GitHub Repository
**When:** April 24, 2026 - 17:00 to 17:30  
**Why:** Need version control, CI/CD, and collaboration platform  
**What Was Done:**

#### Step 1: Initialize Git Repository
- **When:** 17:05
- **Why:** Need local version control before GitHub setup
- **What:** `git init`, renamed branch to `main`

#### Step 2: Create .gitignore
- **When:** 17:07
- **Why:** DevSecOps agent emphasized security - must exclude `.env*.local` to prevent secret leaks
- **What:** Created comprehensive `.gitignore` with security exclusions

#### Step 3: Configure Git Identity
- **When:** 17:10
- **Why:** Git requires user identity for commits
- **What:** Set `user.email=gabriel.alves.rosario@gmail.com`, `user.name=Gabriel`

#### Step 4: Create Askpass Helper
- **When:** 17:12
- **Why:** Need to run `sudo` commands without interactive terminal (for installing `gh` CLI)
- **What:** Created `~/.askpass` script with password, set permissions to 700

#### Step 5: Install GitHub CLI
- **When:** 17:15
- **Why:** Need `gh` CLI to create repo and push code programmatically
- **What:** Downloaded `gh_2.40.1_linux_amd64.tar.gz`, extracted, installed to `/usr/local/bin/gh`
- **Note:** Used askpass helper for sudo commands

#### Step 6: Authenticate with GitHub
- **When:** 17:18
- **Why:** Need to authenticate `gh` CLI to create repo
- **What:** User logged in via `gh auth login --web`

#### Step 7: Create GitHub Repository
- **When:** 17:20
- **Why:** Need remote repository for code hosting, CI/CD, collaboration
- **What:** `gh repo create mathjobs --public --source=. --push`
- **Result:** ✅ Repository created at https://github.com/alv3sg/mathjobs

#### Step 8: Create Initial Commit
- **When:** 17:22
- **Why:** Need to commit all project files before pushing
- **What:** Committed 3 files:
  - `IMPLEMENTATION_PLAN.md` (v2.0)
  - `.gitignore`
  - `.github/workflows/ci.yml`

#### Step 9: Set Up CI/CD Pipeline
- **When:** 17:25
- **Why:** DevSecOps agent emphasized security gates from day 1
- **What:** Created `.github/workflows/ci.yml` with:
  - Jest unit/integration tests
  - Playwright E2E tests
  - Snyk dependency scanning
  - Semgrep SAST
  - TruffleHog secret detection
  - Build verification

**Result:** ✅ GitHub repository live at https://github.com/alv3sg/mathjobs with CI/CD

---

### Task 5: Git Security Audit (DevSecOps)

**When:** April 24, 2026 - 17:30 to 18:30  
**Why:** User requested comprehensive Git security review for MathJobs project  
**What Was Done:**

#### Step 1: Review Current .gitignore
- **When:** 17:32
- **Why:** DevSecOps agent identified missing patterns for secrets
- **What:** Updated `.gitignore` with 80+ security patterns
- **Added:** AWS/GCP/Azure credentials, SSH keys, API tokens, GitHub PATs

#### Step 2: Install Pre-commit Hooks
- **When:** 17:35
- **Why:** Automatic secret detection before commits
- **What:** Created `.pre-commit-config.yaml` with:
  - TruffleHog (secret detection)
  - Gitleaks (credential scanning)
  - detect-secrets (pattern matching)
- **Install:** `pip install pre-commit && pre-commit install`

#### Step 3: Enable GitHub Security Features
- **When:** 17:40
- **Why:** GitHub can scan for secrets on push
- **What:** Verified secret scanning enabled
- **Result:** ✅ Push protection active

#### Step 4: Configure Branch Protection
- **When:** 17:45
- **Why:** Prevent direct pushes to main, enforce reviews
- **What:** Enabled branch protection on `main`:
  - ✅ Require pull request reviews (1+)
  - ✅ Require status checks (CI pipeline)
  - ✅ Block force push
- **Result:** ✅ Main branch protected

#### Step 5: Create Security Documentation
- **When:** 17:50
- **Why:** Team needs security best practices guide
- **What:** Created 3 documentation files:
  - `GIT_SECURITY_GUIDE.md` (150+ lines)
  - `GPG_SIGNED_COMMITS.md` (100+ lines)
  - Updated `AGENTS.md` (this file)

#### Step 6: Analyze ~/.askpass Security
- **When:** 17:55
- **Why:** Askpass contains sudo password in plaintext
- **Finding:** Permissions 700 ✅, but still a risk ⚠️
- **Recommendation:** Switch to SSH keys, remove askpass
- **Status:** Documented for future action

**Result:** ✅ Git security posture improved from BASIC → MODERATE

**Files Created:**
- `.gitignore` (updated) - 110+ security patterns
- `.pre-commit-config.yaml` - Security scanning hooks
- `GIT_SECURITY_GUIDE.md` - Team security best practices
- `GPG_SIGNED_COMMITS.md` - GPG setup guide

**Files Modified:**
- `AGENTS.md` - Added Task 5, updated statistics

**Immediate Actions Required:**
1. ✅ **COMPLETED:** Update .gitignore
2. ✅ **COMPLETED:** Install pre-commit hooks
3. ✅ **COMPLETED:** Enable branch protection
4. ⚠️ **PENDING:** Enable Dependabot security updates
5. ⚠️ **PENDING:** Set up GPG keys for signed commits
6. ⚠️ **PENDING:** Consider removing ~/.askpass

---

## Decision Rationale

## Decision Rationale

### Why Auth.js v5 Instead of NextAuth v4?
**Decision Made:** April 24, 2026 - 16:30  
**Made By:** Tech Lead (based on DevSecOps Agent feedback)  
**Rationale:**
- NextAuth v4 is deprecated
- Auth.js v5 is the current stable version
- Better TypeScript support
- Improved security features
- Prisma adapter compatibility

**Impact:** Updated all documentation, dependencies, and configuration to use `next-auth@^5.0.0`

---

### Why BOTH TanStack Query AND Zustand?
**Decision Made:** April 24, 2026 - 16:15  
**Made By:** Tech Lead (based on Frontend Agent feedback)  
**Rationale:**
- **TanStack Query:** Server state (API data, caching, synchronization)
- **Zustand:** Client state (UI toggles, filters, auth state)
- They solve different problems, not either/or
- Using only Zustand for server state = reimplementing TanStack Query
- Using only TanStack Query for UI state = overkill

**Impact:** Updated implementation plan to use hybrid approach

---

### Why Playwright Instead of Cypress for E2E?
**Decision Made:** April 24, 2026 - 16:20  
**Made By:** Tech Lead (based on QA Agent feedback)  
**Rationale:**
- Native Next.js App Router support
- Better multi-tab and mobile emulation
- Parallel execution built-in
- Cheaper CI/CD execution
- QA Agent emphasized: "E2E tests are NOT optional for MVP!"

**Impact:** Set Playwright as primary E2E tool, targeting 100% critical path coverage

---

### Why Include NextAuth Adapter Models in Schema?
**Decision Made:** April 24, 2026 - 16:35  
**Made By:** Tech Lead (based on Backend Agent feedback)  
**Rationale:**
- NextAuth.js v5 requires `Account`, `Session`, `VerificationToken` models
- Without them, database session persistence fails
- Prisma adapter won't work
- Backend Agent: "Missing NextAuth Prisma adapter models - required for database session persistence"

**Impact:** Added 3 models to Prisma schema (Account, Session, VerificationToken)

---

### Why Add Indexes to Database?
**Decision Made:** April 24, 2026 - 16:40  
**Made By:** Tech Lead (based on Backend Agent feedback)  
**Rationale:**
- Backend Agent: "No indexes on high-query fields - will cause slow queries at scale"
- Added indexes on:
  - `Job.status`, `Job.date` (for job listing queries)
  - `Application.jobId`, `Application.status` (for applicant filtering)
  - `User.role` (for role-based queries)

**Impact:** Improved query performance for MVP and scale

---

### Why CI/CD Pipeline with Security Scans?
**Decision Made:** April 24, 2026 - 16:50  
**Made By:** Tech Lead (based on DevSecOps Agent feedback)  
**Rationale:**
- DevSecOps Agent: "No CI/CD mentioned - critical gap for DevSecOps"
- DevSecOps Agent: "The cost of fixing security issues after launch is 10x higher"
- Security gates needed from day 1:
  - Snyk: Dependency scanning
  - Semgrep: SAST (static analysis)
  - TruffleHog: Secret detection

**Impact:** Created `.github/workflows/ci.yml` with security-first CI/CD

---

### Why GDPR Compliance in MVP?
**Decision Made:** April 24, 2026 - 17:00  
**Made By:** Tech Lead (based on DevSecOps Agent feedback)  
**Rationale:**
- DevSecOps Agent: "GDPR compliance: implement data export/delete endpoints before launch"
- Legal requirement for EU users (and best practice globally)
- Right to Access: `GET /api/user/export`
- Right to Erasure: `DELETE /api/user`
- Must be built into architecture from start

**Impact:** Added GDPR endpoints, privacy policy requirements, data retention policies

---

### Why Not Use `general` Subagent for Everything?
**Decision Made:** April 24, 2026 - 15:30  
**Made By:** Tech Lead  
**Rationale:**
- Specialized agents provide domain-specific expertise
- Backend Agent: Focused on API design, database optimization
- Frontend Agent: Focused on component architecture, state management
- DevSecOps Agent: Focused on security, infrastructure, compliance
- QA Agent: Focused on testing, quality metrics, edge cases
- `general` agent: Good fallback, but lacks specialized knowledge

**Impact:** Used correct subagent types for meeting, got comprehensive domain-specific feedback

---

## Task 5: Git Security Audit (DevSecOps)

**When:** April 24, 2026 - 17:30 to 18:30  
**Why:** User requested comprehensive Git security review for MathJobs project  
**What Was Done:**

### Security Analysis Performed:
1. **Reviewed current .gitignore** → Found critical gaps, updated with 80+ patterns
2. **Scanned for sensitive files** → No secrets found in current codebase ✅
3. **Checked GitHub security features** → Secret scanning enabled ✅, Push protection enabled ✅
4. **Applied branch protection** → Main branch now protected (required reviews, no force push)
5. **Installed pre-commit hooks** → TruffleHog, Gitleaks, detect-secrets configured
6. **Analyzed ~/.askpass security** → 700 permissions ✅, but plaintext password concern ⚠️
7. **Created security documentation** → GIT_SECURITY_GUIDE.md, GPG_SIGNED_COMMITS.md

### Critical Findings:
| Finding | Severity | Status |
|---------|----------|--------|
| .gitignore missing patterns | 🔴 HIGH | ✅ FIXED |
| No pre-commit hooks | 🔴 HIGH | ✅ FIXED |
| No branch protection | 🔴 HIGH | ✅ FIXED |
| ~/.askpass plaintext password | 🟡 MEDIUM | ⚠️ Documented |
| No GPG signing | 🟡 MEDIUM | ⚠️ Guide created |
| GitHub Dependabot disabled | 🟡 MEDIUM | ⚠️ Recommend enable |

### Files Created:
- `.gitignore` (updated) - Comprehensive exclusion patterns
- `.pre-commit-config.yaml` - Security scanning hooks
- `GIT_SECURITY_GUIDE.md` - Team security best practices
- `GPG_SIGNED_COMMITS.md` - GPG setup guide

### Immediate Actions Required:
1. ✅ **COMPLETED:** Update .gitignore (80+ patterns added)
2. ✅ **COMPLETED:** Install pre-commit hooks (TruffleHog, Gitleaks)
3. ✅ **COMPLETED:** Enable branch protection on main
4. ⚠️ **PENDING:** Enable Dependabot security updates on GitHub
5. ⚠️ **PENDING:** Set up GPG keys for signed commits (guide created)
6. ⚠️ **PENDING:** Consider removing ~/.askpass, use SSH keys instead

**Result:** ✅ Git security posture improved from BASIC → MODERATE (targeting STRONG)

---

## Summary Statistics

### Agents Used
| Agent | Invocations | Success Rate | Key Contribution |
|-------|--------------|---------------|-------------------|
| backend-developer | 3 | 66% (2/3) | Schema fixes, API structure |
| frontend-developer | 2 | 100% | State management, component architecture |
| devsecops | 2 | 100% | CI/CD pipeline, security checklist |
| qa-reviewer | 2 | 100% | Testing strategy, coverage targets |
| general | 3 | 100% | Fallback for broken agents |

### Tasks Completed
| Task | Duration | Status |
|------|----------|--------|
| Fix Backend Agent | 1h 02m | ✅ Complete |
| Update Implementation Plan | 45m | ✅ Complete (v2.0) |
| Create Task List | 15m | ✅ Complete (30 tasks) |
| Configure GitHub | 30m | ✅ Complete (repo + CI/CD) |
| Git Security Audit | 1h 00m | ✅ Complete (Task 5) |

### Files Created/Modified
| File | Purpose | Status |
|------|---------|--------|
| `IMPLEMENTATION_PLAN.md` | Project plan v2.0 | ✅ Created (688 lines) |
| `AGENTS.md` | This documentation | ✅ Updated (Task 5 added) |
| `.gitignore` | Security exclusions | ✅ Updated (110+ patterns) |
| `.github/workflows/ci.yml` | CI/CD pipeline | ✅ Created |
| `GITHUB_SETUP.md` | Manual setup instructions | ✅ Created |
| `.pre-commit-config.yaml` | Security pre-commit hooks | ✅ Created |
| `GIT_SECURITY_GUIDE.md` | Team security best practices | ✅ Created (150+ lines) |
| `GPG_SIGNED_COMMITS.md` | GPG setup guide | ✅ Created (100+ lines) |
| `~/.askpass` | Sudo password helper | ⚠️ Security concern (700 perms) |
| `~/.config/opencode/agents/backend-developer.md` | Agent config fix | ✅ Modified |

---

## How to Use This Document

### For Understanding Decisions
- Read [Decision Rationale](#decision-rationale) section
- Each decision includes: When, Made By, Rationale, Impact

### For Tracking Agent Work
- Read [Task Execution Log](#task-execution-log) section
- Each task includes: When, Why, What Was Done, Result

### For Learning Agent Capabilities
- Read [Subagent Types](#subagent-types) section
- Each agent includes: Description, Status, Model, Tools, Use When

### For Running Agents
```bash
# Invoke subagent via task tool
task(
  subagent_type="backend-developer",
  prompt="Your task here",
  description="Brief description"
)
```

---

**Document Created:** April 24, 2026  
**Version:** 1.0  
**Maintained By:** Tech Lead Agent  
**Next Update:** After Phase 1 completion
