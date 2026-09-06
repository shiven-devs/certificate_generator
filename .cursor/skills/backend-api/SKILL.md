---
name: backend-api
description: Implement secure, maintainable Next.js API routes, Zod validation, service layers, MongoDB operations, error handling, rate limiting and consistent API contracts. Use whenever creating or modifying backend/API/database functionality.
---

# Backend API Skill

## Architecture

Use:

Route Handler
→ Authentication
→ Validation
→ Authorization
→ Service
→ Repository/Model

Keep HTTP concerns separate from business logic.

## Validation

Define Zod schemas for every external input.

Validate before:

- database access
- external API calls
- business logic

Use schema-derived TypeScript types where practical.

## Errors

Use stable application error codes.

Never leak internal exceptions directly to clients.

Convert expected errors into meaningful HTTP responses.

Unexpected errors should be logged safely and returned as generic internal errors.

## MongoDB

Use Mongoose consistently.

Create indexes intentionally.

Important indexes for this project include lookup and uniqueness constraints around:

- User.email
- Course.youtubeId
- Enrollment.user + Enrollment.course

Use atomic operations when concurrent requests could modify the same progress state.

## Authentication

Every protected route must derive the current user from the authenticated session.

Never accept a userId from the request body as authoritative.

## Authorization

Check ownership before returning or modifying user-specific resources.

## Rate limiting

Identify endpoints vulnerable to abuse.

Prioritize:

- login
- signup
- course metadata resolution
- heartbeat
- certificate generation

Use the simplest correct implementation for the deployment environment, but design the interface so the limiter can later be replaced with a distributed implementation.

## Documentation

Use official Next.js Route Handler documentation for HTTP/API behavior.

Use official Zod documentation for validation.

Use official Mongoose documentation for schemas, indexes, queries and transactions.

Do not invent framework APIs from memory.

## Verification

After backend changes:

1. typecheck
2. lint
3. run relevant tests
4. manually test success case
5. manually test unauthorized case
6. manually test malformed input
