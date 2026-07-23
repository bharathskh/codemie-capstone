# Plan: Grant full GitHub access (Assistant 4) – Implementation Outline

> **Context note**: The prompt is underspecified (user only asked: “How to grant full access to Github in Assistant 4”). This plan assumes “Assistant 4” is an internal AI assistant that uses a GitHub integration (GitHub App / OAuth / PAT) to read/write repos, create PRs, etc. The goal is to enable **org-level, all-repositories** access with appropriate guardrails.

## Goals

- Enable an admin to grant “full access” for the assistant to GitHub.
- Support GitHub Enterprise/Organization restrictions (approved apps, SSO enforcement).
- Provide clear UX for installation/authorization and visibility into granted permissions.
- Maintain security: least privilege by default, but allow elevated access via explicit admin action.

## Non-goals

- Building a complete RBAC system from scratch (assume existing auth/users).
- Managing non-GitHub SCM providers.

---

## Frontend Implementation

### 1) Settings screen: GitHub Integration
- Add/extend a page: **Settings → Integrations → GitHub**
- Display:
  - Connection status (Not connected / Connected)
  - Integration type (GitHub App / OAuth / PAT)
  - Granted scope summary (repos: all/selected, permissions list)
  - Org selection (if multiple)
  - SSO status (if applicable)
  - Last sync time / last token refresh time

### 2) “Grant Full Access” admin flow
- Only visible to users with an **Admin** role.
- Button: **Grant full access**
- Modal confirmation with:
  - What will change (e.g., install app to all repositories)
  - Required GitHub permissions
  - Risk statement and audit logging notice

### 3) OAuth / GitHub App install UX
- GitHub App (recommended):
  - Redirect to GitHub App installation URL with `state` parameter.
  - Let admin choose: **All repositories** or Selected.
  - After callback, display success + granted permissions.
- OAuth fallback (if used):
  - Request minimal scopes by default.
  - For “full access”, request expanded scopes, show them in UI.

### 4) Error handling UI
- Common errors:
  - Org policy blocks app installation
  - SSO not authorized
  - Insufficient permissions (user not org owner)
  - Token expired/revoked
- Provide actionable instructions + deep links to GitHub settings.

---

## Backend Implementation

### 1) Integration abstraction
Create/extend a service layer:
- `GitHubIntegrationService`
  - `getConnectionStatus(user/org)`
  - `startInstallFlow(org)` → returns redirect URL
  - `handleCallback(code/state/installation_id)`
  - `grantFullAccess(org)` → validate admin + ensure app installed to all repos
  - `listAccessibleRepos(org)`
  - `createPullRequest(...)` (if assistant needs PR capabilities)

### 2) GitHub App approach (preferred)
- Use GitHub App with permissions like:
  - **Contents**: Read & Write
  - **Pull requests**: Read & Write
  - **Issues**: Read & Write (optional)
  - **Metadata**: Read
  - **Workflows**: Read & Write (only if assistant triggers workflows)
  - **Checks**: Read & Write (optional)
- On install callback:
  - Exchange temporary code (if OAuth web flow) or handle installation id.
  - Create an **installation access token** (short-lived) on demand.
  - Store installation id per org.

### 3) OAuth / PAT (fallback)
- OAuth:
  - Store refresh token securely (if applicable) and rotate.
  - Validate scopes.
- PAT:
  - Accept token input (admin only), validate via `/user` + repo listing.
  - Store encrypted.

### 4) Security & Compliance
- Encrypt tokens at rest (KMS/secret manager).
- Never log raw tokens.
- Add audit events:
  - `github.integration.connected`
  - `github.integration.full_access_granted`
  - `github.integration.revoked`
  - Include actor, org, timestamp, permissions.
- Implement CSRF protection via `state` in auth flows.

### 5) Org policy / SSO handling
- Detect SSO requirement failures and return structured error codes.
- Provide backend endpoint to check SSO authorization status (where possible).

---

## Database Changes

Add/extend tables (names illustrative):

### `integrations`
- `id` (pk)
- `provider` (enum: github)
- `org_id`
- `type` (enum: github_app | oauth | pat)
- `installation_id` (nullable)
- `access_token_encrypted` (nullable)
- `refresh_token_encrypted` (nullable)
- `token_expires_at` (nullable)
- `scopes_json` / `permissions_json`
- `repo_access` (enum: all | selected)
- `created_by`
- `updated_by`
- `created_at`, `updated_at`

### `integration_audit_log`
- `id` (pk)
- `org_id`
- `actor_user_id`
- `provider`
- `event_type`
- `event_payload_json`
- `created_at`

### Optional: `integration_selected_repos`
- `integration_id`
- `repo_id`
- `repo_full_name`

---

## API Endpoints (example)

- `GET /api/integrations/github/status`
- `POST /api/integrations/github/install/start`
- `GET /api/integrations/github/install/callback`
- `POST /api/integrations/github/grant-full-access`
- `POST /api/integrations/github/revoke`
- `GET /api/integrations/github/repos`

---

## Testing Plan

- Unit tests:
  - callback validation (`state`), token encryption, permission parsing
- Integration tests:
  - mock GitHub API (installation token, repo listing)
- E2E:
  - admin grants full access, status reflects all repos
- Security tests:
  - ensure tokens never appear in logs/responses

---

## Rollout Plan

- Feature flag: `github_full_access_flow`
- Deploy backend first, then frontend.
- Provide migration scripts.
- Add monitoring:
  - install success rate
  - callback errors
  - token refresh failures

---

## Open Questions (to confirm)

1. What is “Assistant 4” (web app, CLI, internal service)?
2. Do we want GitHub App only, or support PAT/OAuth too?
3. Should “full access” mean **all repos in an org**, or also admin org actions?
4. Is GitHub Enterprise Server involved?
