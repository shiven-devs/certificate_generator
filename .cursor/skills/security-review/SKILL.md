---
name: security-review
description: Perform an adversarial security review of authentication, authorization, APIs, database access, external integrations and user-owned resources. Use before completing security-sensitive features, releases or refactors.
---

# Security Review Skill

Review the changed code as if the browser is controlled by an attacker.

## Check authentication

- Can an unauthenticated user reach protected endpoints?
- Can an expired/invalidated session still operate?
- Are session cookies configured securely?

## Check authorization

For every resource:

- Who owns it?
- Where is ownership checked?
- Can an attacker replace the ID in the URL/body/query?

Look specifically for IDOR vulnerabilities.

## Check input validation

Verify every externally controlled value is validated.

Check:

- type
- length
- allowed values
- format
- relationships

## Check injection

Inspect database queries, URL handling, file generation and external API calls for injection risks.

## Check XSS

Inspect:

- HTML rendering
- user-generated content
- course titles
- names
- URLs
- certificate content

Do not dangerously inject arbitrary content without a clear reason.

## Check CSRF/session security

Review cookie-based authentication and state-changing endpoints.

## Check abuse

Review:

- rate limiting
- replay
- brute force
- resource exhaustion
- expensive external API calls

## Check secrets

Search for accidental credentials in:

- source code
- logs
- client bundles
- configuration committed to Git

## Check user-owned resources

Specifically test:

- courses
- enrollments
- progress
- certificates

## Output

When reviewing, report:

1. Finding
2. Severity
3. Exploit scenario
4. Affected code
5. Recommended fix
6. Whether a regression test should be added

Use OWASP security guidance as the primary reference.
