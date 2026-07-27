# docs/frontend-tests.feature

Feature: Frontend — Login / Home single-page application

  Background:
    Given the application is running at "http://localhost:3000"
    And no session cookie is present

  # ── Page load & initial state ────────────────────────────────────────────

  Scenario: Login page is visible on first load
    When I navigate to "http://localhost:3000"
    Then the login page "#loginPage" is visible
    And the home page "#homePage" is hidden

  Scenario: Username field receives focus on page load
    When I navigate to "http://localhost:3000"
    Then the "#username" input has focus

  Scenario: Password field has type="password"
    When I navigate to "http://localhost:3000"
    Then the "#password" input has attribute "type" equal to "password"

  Scenario: Login page has username and password labels
    When I navigate to "http://localhost:3000"
    Then a "<label>" with "for=username" is visible
    And a "<label>" with "for=password" is visible

  Scenario: Status region is present with aria-live="polite"
    When I navigate to "http://localhost:3000"
    Then "#status" has attribute "aria-live" equal to "polite"
    And "#status" is empty

  # ── Session check on load ────────────────────────────────────────────────

  Scenario: App shows home page when an active session cookie exists
    Given a valid session cookie for user "demo" exists
    When I navigate to "http://localhost:3000"
    Then the home page "#homePage" is visible
    And the login page "#loginPage" is hidden

  Scenario: App shows login page when session check returns unauthenticated
    Given no session cookie is present
    When I navigate to "http://localhost:3000"
    And "GET /api/session" returns '{"authenticated":false}'
    Then the login page "#loginPage" is visible

  Scenario: App falls back to login page when session check throws a network error
    Given the server is unreachable during the session check
    When I navigate to "http://localhost:3000"
    Then the login page "#loginPage" is visible

  # ── Client-side validation ───────────────────────────────────────────────

  Scenario: Both fields empty — shows required errors on both
    Given I am on the login page
    When I click the "Login" button
    Then "#usernameErr" contains "Username is required."
    And "#passwordErr" contains "Password is required."
    And "#username" has attribute "aria-invalid" equal to "true"
    And "#password" has attribute "aria-invalid" equal to "true"

  Scenario: Username empty — shows error only on username
    Given I am on the login page
    And I fill "#password" with "somepass"
    When I click the "Login" button
    Then "#usernameErr" contains "Username is required."
    And "#passwordErr" is empty

  Scenario: Password empty — shows error only on password
    Given I am on the login page
    And I fill "#username" with "demo"
    When I click the "Login" button
    Then "#passwordErr" contains "Password is required."
    And "#usernameErr" is empty

  Scenario: Focus moves to the first invalid field after failed validation
    Given I am on the login page
    When I click the "Login" button
    Then "#username" has focus

  Scenario: Focus moves to password when only password is invalid
    Given I am on the login page
    And I fill "#username" with "demo"
    When I click the "Login" button
    Then "#password" has focus

  Scenario: Username is trimmed before validation — whitespace-only fails
    Given I am on the login page
    And I fill "#username" with "   "
    And I fill "#password" with "somepass"
    When I click the "Login" button
    Then "#usernameErr" contains "Username is required."

  Scenario: aria-invalid is cleared when the user corrects the field
    Given I clicked "Login" with both fields empty
    And "#username" has "aria-invalid=true"
    When I type any character into "#username"
    Then "#username" no longer has "aria-invalid"

  # ── Loading state & double-submit prevention ────────────────────────────

  Scenario: Submit button label changes to "Signing in…" during request
    Given I am on the login page
    And I fill "#username" with "demo"
    And I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then "#loginBtn" text is "Signing in…" while the request is in flight

  Scenario: All form controls are disabled during in-flight request
    Given I am on the login page
    And I fill "#username" with "demo"
    And I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then "#loginBtn" is disabled while the request is in flight
    And "#resetBtn" is disabled while the request is in flight
    And "#username" is disabled while the request is in flight
    And "#password" is disabled while the request is in flight

  Scenario: Form controls are re-enabled after a failed login
    Given I submitted the form with incorrect credentials
    When the server responds with 401
    Then "#loginBtn" is enabled
    And "#username" is enabled
    And "#password" is enabled
    And "#loginBtn" text is "Login"

  # ── Successful login ─────────────────────────────────────────────────────

  Scenario: Valid credentials show the home page
    Given I am on the login page
    And I fill "#username" with "demo"
    And I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then "#homePage" is visible
    And "#loginPage" is hidden

  Scenario: Welcome message contains the authenticated username
    Given I log in as "demo"
    Then "#welcomeMsg" contains "Welcome, demo"

  Scenario: Username is trimmed before being sent — leading/trailing spaces stripped
    Given I am on the login page
    And I fill "#username" with "  demo  "
    And I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then the POST body sent to "/api/login" contains username "demo" without surrounding spaces

  Scenario: Password field is cleared after a successful login
    Given I log in as "demo"
    And I click "Logout"
    Then "#password" value is ""

  Scenario: Home page shows "You are signed in." text
    Given I log in as "demo"
    Then the page contains the text "You are signed in."

  Scenario: Home page has a visible Logout button
    Given I log in as "demo"
    Then "#logoutBtn" is visible

  # ── Failed login ─────────────────────────────────────────────────────────

  Scenario: Wrong password shows a generic error message
    Given I am on the login page
    And I fill "#username" with "demo"
    And I fill "#password" with "WrongPassword1!"
    When I click the "Login" button
    Then "#status" contains "Invalid username or password."
    And "#loginPage" is still visible

  Scenario: Unknown username shows the same generic error (no enumeration)
    Given I am on the login page
    And I fill "#username" with "nobody"
    And I fill "#password" with "WrongPassword1!"
    When I click the "Login" button
    Then "#status" does not contain "username"
    And "#status" does not contain "not found"
    And "#status" does not contain "does not exist"

  Scenario: Password field is cleared after a failed login
    Given I submitted the form with incorrect credentials
    When the server responds with 401
    Then "#password" value is ""

  Scenario: Brute-force lockout (423) shows a rate-limit message
    Given the server responds with HTTP 423 for "/api/login"
    When I submit the login form
    Then "#status" contains "Too many failed attempts. Please try again later."

  # ── Network & timeout errors ─────────────────────────────────────────────

  Scenario: Network failure shows "Unable to connect" message
    Given the server is unreachable
    When I submit the login form with valid-looking credentials
    Then "#status" contains "Unable to connect. Please try again."

  Scenario: Request timeout (>10 s) shows timeout message
    Given the server stalls and does not respond within 10 seconds
    When I submit the login form with valid-looking credentials
    Then "#status" contains "Request timed out. Please try again."

  # ── Reset button ─────────────────────────────────────────────────────────

  Scenario: Reset clears both input fields
    Given I am on the login page
    And I fill "#username" with "demo"
    And I fill "#password" with "somepass"
    When I click the "Reset" button
    Then "#username" value is ""
    And "#password" value is ""

  Scenario: Reset clears validation error messages
    Given I clicked "Login" with both fields empty
    When I click the "Reset" button
    Then "#usernameErr" is empty
    And "#passwordErr" is empty

  Scenario: Reset clears the status message
    Given a failed login has populated "#status"
    When I click the "Reset" button
    Then "#status" is empty

  Scenario: Reset returns focus to the username field
    Given I am on the login page
    When I click the "Reset" button
    Then "#username" has focus

  # ── Logout ───────────────────────────────────────────────────────────────

  Scenario: Logout returns to the login page
    Given I am logged in as "demo"
    When I click the "Logout" button
    Then "#loginPage" is visible
    And "#homePage" is hidden

  Scenario: Logout returns focus to the username field
    Given I am logged in as "demo"
    When I click the "Logout" button
    Then "#username" has focus

  Scenario: Session is invalidated after logout — reload stays on login
    Given I am logged in as "demo"
    When I click the "Logout" button
    And I reload the page
    Then "#loginPage" is visible

  Scenario: Password field is empty after logout
    Given I am logged in as "demo"
    When I click the "Logout" button
    Then "#password" value is ""

  # ── Session persistence ──────────────────────────────────────────────────

  Scenario: Active session is restored on page reload
    Given I am logged in as "demo"
    When I reload the page
    Then "#homePage" is visible
    And "#welcomeMsg" contains "demo"

  Scenario: No session — reload stays on login page
    Given no session cookie is present
    When I reload the page
    Then "#loginPage" is visible

  # ── Keyboard navigation ──────────────────────────────────────────────────

  Scenario: Pressing Enter in the password field submits the form
    Given I am on the login page
    And I fill "#username" with "demo"
    And I fill "#password" with "C0dem!e@Secure#24"
    When I press "Enter" in the "#password" field
    Then "#homePage" is visible

  Scenario: Tab key moves focus from username to password to Login to Reset
    Given I am on the login page
    And "#username" has focus
    When I press "Tab" three times
    Then "#resetBtn" has focus

  # ── Accessibility ────────────────────────────────────────────────────────

  Scenario: Username input is linked to its label via for/id
    Then the "<label for='username'>" element is present
    And "#username" id matches the label's for attribute

  Scenario: Password input is linked to its label via for/id
    Then the "<label for='password'>" element is present
    And "#password" id matches the label's for attribute

  Scenario: Username error span linked to input via aria-describedby
    Then "#username" has attribute "aria-describedby" equal to "usernameErr"

  Scenario: Password error span linked to input via aria-describedby
    Then "#password" has attribute "aria-describedby" equal to "passwordErr"

  Scenario: Status region has role="status"
    Then "#status" has attribute "role" equal to "status"

  Scenario: Focused inputs have a visible focus outline
    Given I am on the login page
    When "#username" receives focus
    Then the computed style of "#username" includes a non-zero outline

  Scenario: Login and Reset buttons have visible focus outlines
    When "#loginBtn" receives focus
    Then the computed style of "#loginBtn" includes a non-zero outline

  Scenario: Disabled controls show reduced-opacity cursor (not-allowed)
    Given a login request is in flight
    Then the computed style of "#loginBtn" shows opacity less than 1
    And the cursor style of "#loginBtn" is "not-allowed"

  # ── Security (client-side) ───────────────────────────────────────────────

  Scenario: User-supplied username is inserted via textContent, not innerHTML
    Given the server returns username '<img src=x onerror=alert(1)>'
    When the home page is shown
    Then the DOM text of "#welcomeMsg" is the raw string, not an executed script
    And no alert is triggered

  Scenario: Credentials are sent over HTTPS in production
    Given the app is served over HTTPS
    When I submit valid credentials
    Then the POST request to "/api/login" uses the HTTPS scheme

  Scenario: Session cookie is not accessible via document.cookie
    Given I am logged in as "demo"
    When I evaluate "document.cookie" in the browser console
    Then the session token is not present in the output
