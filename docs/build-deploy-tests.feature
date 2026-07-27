# features/build-deploy-tests.feature

Feature: Execute build scripts and generate deployable artefact

  # ── npm run build ─────────────────────────────────────────────────────────

  Scenario: Build produces a versioned tarball in dist/
    Given the project dependencies are installed
    When I run "npm run build"
    Then the directory "dist/" is created
    And the file "dist/codemie-capstone-1.0.0.tgz" exists
    And the exit code is 0

  Scenario: Build tarball contains only production files
    Given I run "npm run build"
    When I inspect the contents of "dist/codemie-capstone-1.0.0.tgz"
    Then it includes "src/server.js"
    And it includes "public/index.html"
    And it includes "public/css/styles.css"
    And it includes "public/js/app.js"
    And it includes "Dockerfile"
    And it includes "package.json"

  Scenario: Build tarball excludes dev and runtime-only files
    Given I run "npm run build"
    When I inspect the contents of "dist/codemie-capstone-1.0.0.tgz"
    Then it does not include "node_modules/"
    And it does not include "tests/"
    And it does not include "scripts/"
    And it does not include ".env"
    And it does not include "playwright.config.js"

  Scenario: Build is idempotent — running twice does not fail
    Given "dist/codemie-capstone-1.0.0.tgz" already exists from a prior build
    When I run "npm run build" again
    Then the file "dist/codemie-capstone-1.0.0.tgz" is overwritten
    And the exit code is 0

  Scenario: Build artefact is deployable — extracted app starts successfully
    Given I extract "dist/codemie-capstone-1.0.0.tgz" to a clean directory
    When I run "npm ci --omit=dev" in that directory
    And I run "node src/server.js"
    Then the server starts on port 3000
    And "GET /api/session" returns HTTP 200

  # ── npm run build:docker ──────────────────────────────────────────────────

  Scenario: Docker build produces a tagged image
    Given Docker is available on the host
    When I run "npm run build:docker"
    Then a Docker image tagged "codemie-capstone:latest" exists
    And the exit code is 0

  Scenario: Docker image runs and serves the application
    Given the image "codemie-capstone:latest" has been built
    When I run the container with port 3000 exposed
    Then "GET /api/session" on port 3000 returns HTTP 200

  Scenario: Docker image excludes node_modules from the build context
    Given the image "codemie-capstone:latest" has been built
    When I inspect the image layers
    Then no layer contains a "node_modules" directory from the host

  # ── deploy-local.sh ───────────────────────────────────────────────────────

  Scenario: Deploy script clones the repo when the app directory does not exist
    Given the directory "codemie-capstone/" does not exist
    When I run "bash scripts/deploy-local.sh"
    Then the repository is cloned from GitHub
    And the app directory "codemie-capstone/" is created

  Scenario: Deploy script pulls latest when the app directory already exists
    Given the directory "codemie-capstone/" exists on branch "main"
    When I run "bash scripts/deploy-local.sh"
    Then "git pull origin main" is executed
    And no second clone is attempted

  Scenario: Deploy script accepts a custom branch via --branch flag
    Given the repository has a branch "feature/simple-login-home"
    When I run "bash scripts/deploy-local.sh --branch feature/simple-login-home"
    Then the checkout targets "feature/simple-login-home"

  Scenario: Deploy script rejects an unknown flag
    When I run "bash scripts/deploy-local.sh --unknown-flag"
    Then the script prints "Unknown option: --unknown-flag"
    And the exit code is non-zero

  Scenario: Deploy script frees port 3000 when it is already occupied
    Given a process is already listening on port 3000
    When I run "bash scripts/deploy-local.sh"
    Then the existing process on port 3000 is killed
    And the deployment proceeds without a port-conflict error

  Scenario: Deploy script installs npm dependencies before starting
    Given port 3000 is free
    When I run "bash scripts/deploy-local.sh"
    Then "npm install" is executed in the app directory
    And the app starts on port 3000

  Scenario: Deploy script builds a Docker image when --docker flag is passed
    Given Docker is available on the host
    And port 3000 is free
    When I run "bash scripts/deploy-local.sh --docker"
    Then "docker build -t codemie-capstone ." is executed
    And the container is started with "-p 3000:3000"

  # ── post-deployment health check ──────────────────────────────────────────

  Scenario: Application is reachable after deployment
    Given the deploy script has completed successfully
    When I send "GET http://localhost:3000/api/session"
    Then the response status is 200
    And the response body contains "authenticated"

  Scenario: Application returns unauthenticated for session check with no cookie
    Given the application is running
    And no session cookie is present
    When I send "GET /api/session"
    Then the response body is '{"authenticated":false}'

  Scenario: Application accepts valid credentials after deployment
    Given the application is running
    When I POST to "/api/login" with username "demo" and password "C0dem!e@Secure#24"
    Then the response status is 200
    And the response body contains '"authenticated":true'
