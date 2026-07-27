# Plan: Hard Stop (Approval Gate) Between Assistant_1 and Assistant_2

## Goal
Implement a **hard stop / approval gate** in the multi-assistant workflow so that **Assistant_2 (and any downstream assistants) cannot execute** until a human/user explicitly approves continuation after **Assistant_1** completes.

This prevents accidental continuation (e.g., user sends `-` or a non-approval message) and ensures the workflow only progresses when the upstream output is confirmed.

---

## Scope
- Add a **workflow state**: `WAITING_FOR_APPROVAL`.
- Persist an **approval flag**: `approval_for_next_stage` (boolean) and an **audit record**.
- Add a **gate step** between Assistant_1 and Assistant_2.
- Add **resume logic**: only explicit approval resumes execution.

Out of scope (unless your system already supports it): building a full identity system; instead, log `user_id`/`actor` if available.

---

## Functional Requirements / Acceptance Criteria

### AC-G1 — Hard stop
- Given Assistant_1 completes
- When the workflow reaches the gate step
- Then the workflow must enter `WAITING_FOR_APPROVAL` and must not execute Assistant_2+.

### AC-G2 — Explicit approval required
- Given the workflow is in `WAITING_FOR_APPROVAL`
- When the user responds with an explicit approval token (e.g., exactly `APPROVE`)
- Then set `approval_for_next_stage = true`, record audit details, and continue to Assistant_2.

### AC-G3 — Reject keeps workflow stopped
- When the user responds with `REJECT` (or `STOP`)
- Then keep the workflow stopped, set `approval_for_next_stage = false`, record audit details, and do not proceed.

### AC-G4 — Ambiguous input does not proceed
- When the user responds with anything other than explicit approval tokens
- Then remain in `WAITING_FOR_APPROVAL` and prompt the user again with clear instructions.

### AC-G5 — Auditability
- Each approval/rejection decision must be logged with:
  - workflow_run_id
  - timestamp
  - actor/user id (if available)
  - decision (approve/reject)
  - raw message (optional but recommended)

---

## Implementation Plan

### 1) Frontend (if applicable)
If your system has a UI for workflow runs, add a checkpoint UI.

**UI changes**
- Show a blocking banner/card when in `WAITING_FOR_APPROVAL`:
  - “Review Assistant_1 output and type **APPROVE** to continue or **REJECT** to stop.”
- Provide quick buttons (optional) that submit exactly `APPROVE` / `REJECT`.

**UX notes**
- Require explicit confirmation. Avoid defaulting “Enter” to approve unless the input equals `APPROVE`.
- Display the Assistant_1 output and a summary of what will happen next.

**Frontend tests**
- State rendering test for `WAITING_FOR_APPROVAL`.
- Ensure ambiguous input does not transition.


### 2) Backend / Orchestration
This is the core of the hard stop.

**Data model / state**
- WorkflowRun state machine: add `WAITING_FOR_APPROVAL`.
- Persist:
  - `approval_for_next_stage` (default `false`)
  - `approval_status` enum: `PENDING | APPROVED | REJECTED`
  - `approved_at`, `approved_by`

**Gate step**
- Insert a step between Assistant_1 and Assistant_2:
  - `ApprovalGateStep`

**Pseudo-flow**
1. Run Assistant_1
2. Transition to `WAITING_FOR_APPROVAL` and emit a message:
   - “Type APPROVE to continue. Type REJECT to stop.”
3. On user message event:
   - Normalize input: `trim()`, `toUpperCase()`
   - If equals `APPROVE` → set approved, log audit, transition to next step
   - If equals `REJECT` or `STOP` → set rejected, log audit, terminate or stay stopped
   - Else → keep waiting and re-prompt

**Guard on Assistant_2 execution**
- Add a precondition: `approval_status == APPROVED`.
- If not approved, return a non-error “BlockedWaitingForApproval” result.

**Observability**
- Emit structured logs/events:
  - `workflow.waiting_for_approval`
  - `workflow.approval.approved`
  - `workflow.approval.rejected`

**Backend tests**
- Unit tests:
  - Gate sets `WAITING_FOR_APPROVAL`
  - Only `APPROVE` transitions
  - Reject terminates
  - Ambiguous input keeps waiting
- Integration tests:
  - Full run halts after Assistant_1 until approval is received


### 3) Database
If you have persistence, implement minimal schema changes.

**Option A: columns on workflow_runs**
- `approval_status` (varchar/enum)
- `approved_at` (timestamp)
- `approved_by` (varchar)

**Option B: separate audit table (recommended)**
Create `workflow_approvals` table:
- `id` (pk)
- `workflow_run_id` (fk)
- `decision` (`APPROVED`/`REJECTED`)
- `actor_id` (nullable)
- `raw_message` (text)
- `created_at`

This supports multiple approvals over time and full audit trail.


### 4) Security / Safety considerations
- Require an explicit token (`APPROVE`) to proceed.
- Do not interpret `-`, `ok`, or empty messages as approval.
- If user identity exists, ensure only authorized users can approve.
- Rate limit approval attempts if your system is exposed publicly.


### 5) Rollout plan
- Feature flag the gate:
  - `enableApprovalGateBetweenAssistants`
- Enable in non-prod first.
- Monitor number of stuck runs and approval latency.

---

## Deliverables
- `plan.md` (this document)
- Code changes (to be implemented in your orchestrator/UI repo):
  - State machine updates
  - Approval gate step
  - Persistence for approval status + audit
  - Tests

---

## Suggested Tech Stack
(Adjust to your existing stack; these are pragmatic defaults.)

### Frontend
- React + TypeScript
- State management: React Query / Redux Toolkit (only if needed)
- Component library: MUI / Chakra UI
- Tests: React Testing Library + Playwright (e2e)

### Backend / Orchestration
- Node.js (NestJS/Express) or Python (FastAPI)
- State machine: XState (TS) or a simple persisted state enum + transition guards
- Messaging/events: Webhooks or internal event bus (e.g., Redis streams)
- Tests: Jest (TS) / Pytest (Python)

### Database
- PostgreSQL
- Migrations: Prisma Migrate / Knex / Alembic

---

## Open Questions
1. What orchestration engine is being used (custom, Temporal, Airflow, LangGraph, etc.)?
2. Is there an existing UI for workflow runs that can display a “waiting for approval” state?
3. Do we have authenticated user identity available for `approved_by`?
4. Should rejection terminate the run or allow revisions and re-request approval?
