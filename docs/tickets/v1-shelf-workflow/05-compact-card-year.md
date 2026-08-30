# Ticket 05: Fix compact shelf-card publication-year clipping

## Problem

Publication year is clipped in the compact book-card layout shown within shelf showcases.

## Requirements

- Keep the complete publication year readable at supported viewport sizes.
- Prevent overlap with adjacent metadata and controls.
- Do not introduce horizontal scrolling.
- Avoid materially increasing compact-card height.
- Preserve readable behavior for missing and non-year publication-date values.

## Acceptance criteria

- Four-digit years are fully visible on desktop and mobile shelf cards.
- Long neighboring metadata does not overlap or clip the year.
- Cards without publication dates retain correct spacing.
- Visual regression coverage or rendered screenshots verify the relevant breakpoints.

