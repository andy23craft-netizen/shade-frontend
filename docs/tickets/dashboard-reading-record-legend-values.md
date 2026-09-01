# Remove Numeric Values from Reading Record Chart Legend

## Repository

Frontend

## Observed behavior

On the dashboard's `Reading Record` card, the chart legend displays numeric quantities for `Read` and `Unread`. The same quantities already appear in the larger information area below the chart, so the legend values are redundant.

## Desired behavior

- Keep the `Read` and `Unread` labels in the chart legend so it continues to explain the chart segments.
- Remove the numeric quantities from the legend itself.
- Continue displaying the actual `Read` and `Unread` quantities in the larger information area below the chart.

The legend should communicate what the segments represent; the larger information area should communicate their values.

## Planning request

Inspect the current frontend implementation and produce an implementation plan for review, including appropriate visual and behavioral validation. Do not modify application source code, tests, configuration, or other implementation files until the plan has been reviewed and explicitly approved.

Before producing your implementation plan, review the current V2 documentation in your repository. Treat the current documents as authoritative over older assumptions or previous versions. Consider whether this ticket changes, resolves, clarifies, or adds anything to those documents. Include any required V2 documentation updates in your proposed plan.

Planning/design/requirements documentation updates are part of this planning phase and should be completed before review. Report any concerns, dependencies, conflicts, or recommended scope changes, then stop and wait for approval.

## Acceptance criteria for the future implementation

- The legend contains the `Read` and `Unread` labels without their numeric quantities.
- The information area below the chart continues to show both quantities.
- The chart remains understandable and otherwise behaves as before.

## Planning outcome

### Recommendation and scope

Implement this as a small frontend patch in `DashboardPage`. The legend currently repeats linked `dashboard.read` and
`dashboard.unread` values that are already exposed as linked values in the `Books Read` and `Books Unread` metrics
immediately below. Keep the colored keys and visible labels, but render only `Read` and `Unread` in the legend.

This is presentational de-duplication, not a V2 feature. It does not change the V2 analytics scope or API contract, so
no V2 requirements update is needed.

### Implementation plan

1. Replace each legend entry's linked numeric value plus lowercase noun with a plain visible label (`Read` and
   `Unread`) beside the existing non-color-only key treatment.
2. Leave the pie percentage, chart accessible name, metric definitions, linked numeric values below the chart, and
   `/books?is_read=` destinations unchanged.
3. Update `DashboardPage` tests to assert that the legend contains the two labels without quantities or links while
   the metrics still show and link both API-provided quantities.
4. Add or update a dashboard visual assertion/screenshot at desktop and narrow viewport widths to catch spacing or
   wrapping regressions. Retain the existing accessibility scan and run focused tests followed by `make check`.

### Concerns and dependencies

No backend dependency exists. Tests should distinguish legend content from the repeated words and values elsewhere in
the same card by querying within the legend and metrics containers.
