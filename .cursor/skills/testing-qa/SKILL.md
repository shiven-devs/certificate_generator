---
name: testing-qa
description: Plan and execute unit, integration, security and end-to-end tests for the learning platform. Use after implementing significant features, before completing phases, or when debugging regressions.
---

# Testing & QA Skill

## Testing philosophy

Test business rules, not implementation details.

Prioritize behavior that affects:

- authentication
- authorization
- progress integrity
- unlocking
- completion
- certificates

## Unit tests

Test:

- YouTube URL parsing
- completion calculations
- progress acceptance/rejection
- session validation
- validation schemas
- course unlock rules

## Integration tests

Test:

- signup
- login
- logout
- second login invalidating previous session
- course resolution
- enrollment
- heartbeat
- completion
- certificate eligibility

## Authorization tests

Attempt:

- user A accessing user B's enrollment
- user A downloading user B's certificate
- direct access to locked videos
- fabricated user IDs
- modified course IDs

These tests should fail safely.

## End-to-end tests

Use browser automation for important user flows:

1. Signup
2. Login
3. Add course
4. Preview metadata
5. Start course
6. Complete lesson
7. Unlock next lesson
8. Complete course
9. Generate certificate
10. Download certificate

## Anti-cheat tests

Attempt:

- >1.5x playback
- seeking
- fabricated progress requests
- repeated requests
- direct API requests
- manipulated completion state

## Test completion criteria

A feature is not complete until:

- TypeScript passes
- lint passes
- relevant tests pass
- authorization cases pass
- error cases are handled
- responsive UI is checked for user-facing features

## Documentation

Use the current official Vitest documentation for unit/integration testing where Vitest is selected.

Use the current official Playwright documentation for browser end-to-end tests.

Prefer official documentation over old tutorials.
