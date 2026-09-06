---
name: ui-ux-engineering
description: Build polished, accessible, responsive SaaS interfaces for the learning and certification platform. Use when creating or substantially modifying pages, dashboards, forms, course cards, player screens, navigation, dialogs or other user-facing UI.
---

# UI/UX Engineering Skill

## Goal

Produce UI that looks intentionally designed rather than generated page-by-page.

Before implementing a new screen:

1. Inspect existing visual patterns.
2. Reuse existing components.
3. Identify the primary user action.
4. Design loading, empty, error and success states.
5. Check responsive behavior.
6. Check keyboard accessibility.

## Visual hierarchy

Every screen should clearly communicate:

1. Where am I?
2. What can I do here?
3. What is the primary action?
4. What is the current state?

Do not create decorative elements that compete with the primary action.

## Course dashboard

Prefer showing:

- course thumbnail
- course title
- progress
- current video
- continue button
- completion state

Do not overload course cards with irrelevant metadata.

## Course player

The player page should clearly distinguish:

- current video
- completed videos
- locked videos
- available videos
- course progress

The current lesson must be visually obvious.

Locked content must explain why it is locked.

## Forms

Use clear labels and inline validation.

Do not depend on placeholder text as the only field label.

## Feedback

Use appropriate loading indicators and non-blocking feedback.

Avoid excessive toast notifications.

## Accessibility

Follow current WCAG guidance.

Check:

- semantic HTML
- keyboard navigation
- focus states
- contrast
- labels
- screen-reader names
- reduced motion
- mobile touch targets

## Responsive behavior

Design mobile behavior intentionally.

Do not simply shrink the desktop layout.

Important screens:

- dashboard
- add course
- course player
- certificate viewer
- authentication

must all work comfortably on mobile.

## Documentation

Consult the official Tailwind documentation for current utility behavior and responsive patterns.

Consult current W3C WCAG guidance for accessibility decisions.

If using a component library, consult its official accessibility documentation before customizing interaction behavior.
