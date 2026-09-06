---
name: nextjs-architecture
description: Design and implement Next.js App Router features using correct Server/Client Component boundaries, routing, data fetching, caching, loading states and server-side behavior. Use whenever modifying Next.js pages, layouts, route handlers or application architecture.
---

# Next.js Architecture Skill

## When to use

Use this skill when:

- creating pages
- creating layouts
- modifying App Router structure
- creating Route Handlers
- deciding Server vs Client Components
- implementing data fetching
- implementing loading/error states
- optimizing Next.js rendering
- debugging Next.js routing/rendering issues

## Core guidance

Use Server Components by default.

Use Client Components only when browser APIs, local interactive state, event handlers, or third-party client-only libraries require them.

Keep client boundaries as small as practical.

Do not make an entire route a Client Component just because one child needs browser APIs.

For API endpoints, use Next.js Route Handlers according to the current framework documentation.

Keep domain/business logic outside UI components.

## Before changing architecture

Inspect:

- app/
- layouts
- existing server/client boundaries
- API routes
- shared components
- data fetching utilities

Reuse existing patterns where they are sound.

## Data fetching

Prefer server-side data fetching where appropriate.

Avoid unnecessary client → API → server → database round trips when a Server Component can safely perform the required server-side work.

For user-specific data, enforce authentication server-side.

Never expose server-only secrets to client components.

## Documentation

Consult the current official Next.js documentation before implementing framework-specific behavior.

Important documentation areas:

- App Router
- Server and Client Components
- Route Handlers
- Loading UI
- Error Handling
- Caching and Revalidation
- Forms/Server Actions when relevant

Do not rely on outdated Next.js tutorials when the current official documentation differs.

## Verification

After implementation:

- run TypeScript checks
- run linting
- test the affected route
- test loading and error states
- test mobile behavior for user-facing changes
