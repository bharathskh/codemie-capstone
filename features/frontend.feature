Feature: Frontend Login Application

  Background:
    Given I am on the login page

  # ── Page Load ──────────────────────────────────────────────────────────────

  Scenario: Login page is visible on first load
    Then "#loginPage" is visible
    And "#homePage" is hidden

  Scenario: Username field receives focus on page load
    Then "#username" has focus

  Scenario: Password field has type="password"
    Then "#password" has attribute "type" equal to "password"

  Scenario: Status region has aria-live="polite"
    Then "#status" has attribute "aria-live" equal to "polite"

  # ── Client-side Validation ─────────────────────────────────────────────────

  Scenario: Submitting an empty form shows required errors on both fields
    When I click the "Login" button
    Then "#usernameErr" contains "Username is required."
    And  "#passwordErr" contains "Password is required."
    And  "#username" has attribute "aria-invalid" equal to "true"
    And  "#password" has attribute "aria-invalid" equal to "true"

  Scenario: Only username error is shown when password is filled
    Given I fill "#password" with "somepass"
    When I click the "Login" button
    Then "#usernameErr" contains "Username is required."
    And  "#passwordErr" is empty text

  Scenario: Only password error is shown when username is filled
    Given I fill "#username" with "demo"
    When I click the "Login" button
    Then "#passwordErr" contains "Password is required."
    And  "#usernameErr" is empty text

  Scenario: Focus moves to username field when both fields fail validation
    When I click the "Login" button
    Then "#username" has focus

  Scenario: Whitespace-only username is treated as empty
    Given I fill "#username" with "   "
    And   I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then "#usernameErr" contains "Username is required."

  Scenario: Validation errors are cleared on Reset
    Given I click the "Login" button
    When I click the "Reset" button
    Then "#usernameErr" is empty text
    And  "#passwordErr" is empty text

  # ── Successful Login ───────────────────────────────────────────────────────

  Scenario: Valid credentials show the home page
    Given I fill "#username" with "demo"
    And   I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then "#homePage" is visible
    And  "#loginPage" is hidden

  Scenario: Welcome message shows the authenticated username
    Given I fill "#username" with "demo"
    And   I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then "#welcomeMsg" contains "Welcome, demo"

  Scenario: Home page confirms the user is signed in
    Given I fill "#username" with "demo"
    And   I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then the page contains text "You are signed in."

  Scenario: Home page has a Logout button
    Given I fill "#username" with "demo"
    And   I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    Then "#logoutBtn" is visible

  Scenario: Password field is cleared after successful login
    Given I fill "#username" with "demo"
    And   I fill "#password" with "C0dem!e@Secure#24"
    When I click the "Login" button
    And  I click the "Logout" button
    Then "#password" has value ""

  # ── Failed Login ───────────────────────────────────────────────────────────

  Scenario: Wrong password shows a generic error message
    Given I fill "#username" with "demo"
    And   I fill "#password" with "WrongPass99!"
    When I click the "Login" button
    Then "#status" contains "Invalid username or password."
    And  "#loginPage" is visible

  Scenario: Unknown username does not reveal whether the account exists
    Given I fill "#username" with "nobody"
    And   I fill "#password" with "WrongPass99!"
    When I click the "Login" button
    Then "#status" does not contain "not found"
    And  "#status" does not contain "does not exist"

  Scenario: Password is cleared after a failed login
    Given I fill "#username" with "demo"
    And   I fill "#password" with "WrongPass99!"
    When I click the "Login" button
    Then "#password" has value ""

  Scenario: HTTP 423 lockout shows a rate-limit message
    Given the login API will respond with status 423
    When I fill "#username" with "demo"
    And  I fill "#password" with "WrongPass99!"
    And  I click the "Login" button
    Then "#status" contains "Too many failed attempts. Please try again later."

  # ── Reset Button ───────────────────────────────────────────────────────────

  Scenario: Reset clears both input fields
    Given I fill "#username" with "demo"
    And   I fill "#password" with "somepass"
    When I click the "Reset" button
    Then "#username" has value ""
    And  "#password" has value ""

  Scenario: Reset clears the status message
    Given I fill "#username" with "demo"
    And   I fill "#password" with "WrongPass99!"
    And   I click the "Login" button
    When I click the "Reset" button
    Then "#status" is empty text

  Scenario: Reset returns focus to the username field
    When I click the "Reset" button
    Then "#username" has focus

  # ── Logout ─────────────────────────────────────────────────────────────────

  Scenario: Logout returns to the login page
    Given I am logged in as "demo"
    When I click the "Logout" button
    Then "#loginPage" is visible
    And  "#homePage" is hidden

  Scenario: Logout returns focus to the username field
    Given I am logged in as "demo"
    When I click the "Logout" button
    Then "#username" has focus

  Scenario: Session is invalidated after logout
    Given I am logged in as "demo"
    When I click the "Logout" button
    And  I reload the page
    Then "#loginPage" is visible

  Scenario: Password field is empty after logout
    Given I am logged in as "demo"
    When I click the "Logout" button
    Then "#password" has value ""

  # ── Session Persistence ────────────────────────────────────────────────────

  Scenario: Active session is restored on page reload
    Given I am logged in as "demo"
    When I reload the page
    Then "#homePage" is visible

  Scenario: No session cookie means login page on reload
    When I reload the page
    Then "#loginPage" is visible

  # ── Keyboard Navigation ────────────────────────────────────────────────────

  Scenario: Enter key in the password field submits the form
    Given I fill "#username" with "demo"
    And   I fill "#password" with "C0dem!e@Secure#24"
    When I press "Enter" in the "#password" field
    Then "#homePage" is visible

  Scenario: Tab key cycles through form controls in correct order
    When I press Tab 3 times starting from "#username"
    Then "#resetBtn" has focus

  # ── Accessibility ──────────────────────────────────────────────────────────

  Scenario: Username input has a programmatic label
    Then a label with for "username" is visible

  Scenario: Password input has a programmatic label
    Then a label with for "password" is visible

  Scenario: Username error span is linked via aria-describedby
    Then "#username" has attribute "aria-describedby" equal to "usernameErr"

  Scenario: Password error span is linked via aria-describedby
    Then "#password" has attribute "aria-describedby" equal to "passwordErr"

  Scenario: Status region has role="status"
    Then "#status" has attribute "role" equal to "status"

  Scenario: Focused username input has a visible focus outline
    When "#username" receives focus
    Then "#username" has a non-zero outline

  # ── Security ───────────────────────────────────────────────────────────────

  Scenario: XSS payload in username is rendered as text not HTML
    Given the session API returns username "<img src=x onerror=alert(1)>"
    Then no script alert was triggered
    And  "#welcomeMsg" renders as plain text without child elements

  Scenario: Session cookie is not accessible via document.cookie
    Given I am logged in as "demo"
    Then "document.cookie" does not expose the session token

  Scenario: Login request uses POST method not GET
    Given I fill "#username" with "demo"
    And   I fill "#password" with "C0dem!e@Secure#24"
    And   I capture the next login request
    When I click the "Login" button
    Then the captured request used method "POST"
    And  the captured request URL does not contain "demo"

  Scenario: Auth responses carry Cache-Control no-store
    When I fill "#username" with "demo"
    And  I fill "#password" with "C0dem!e@Secure#24"
    And  I click the "Login" button
    Then the login response has "cache-control" header containing "no-store"
