# Place Add Category After Existing Categories

## Repository

Frontend

## Observed behavior

The category-selection UI places `Add Category` before existing categories. During keyboard navigation, this makes it possible to activate category creation when the user's intent is to select an existing category.

## Desired behavior

- Existing category options appear first.
- `Add Category` appears after all existing category options.
- Keyboard/tab order follows the same logical sequence.
- Category creation remains readily accessible; this is a placement and navigation change, not removal of the feature.

## Planning request

Inspect the current frontend implementation and produce an implementation plan for review. Include how the proposed behavior will be validated, particularly for keyboard navigation and focus order. Do not modify application source code, tests, configuration, or other implementation files until the plan has been reviewed and explicitly approved.

Before producing your implementation plan, review the current V2 documentation in your repository. Treat the current documents as authoritative over older assumptions or previous versions. Consider whether this ticket changes, resolves, clarifies, or adds anything to those documents. Include any required V2 documentation updates in your proposed plan.

Planning/design/requirements documentation updates are part of this planning phase and should be completed before review. Report any concerns, dependencies, conflicts, or recommended scope changes, then stop and wait for approval.

## Acceptance criteria for the future implementation

- Every existing category precedes `Add Category` visually and in keyboard navigation order.
- Users can still readily invoke category creation.
- Existing category selection behavior is otherwise preserved.

## Planning outcome

### Recommendation and scope

Implement this as a small frontend patch. The ordering defect is present in both category-creation surfaces: the shared
`BookForm` used by Add/Edit Book and the per-row category picker in Bulk Add. Both currently render the conditional
create button before the filtered category options. The fix should cover both surfaces so keyboard behavior does not
change depending on the intake workflow.

This is ordinary interaction polish rather than V2 scope. The V2 product documents do not prescribe category-picker
action ordering, and no V2 requirements change is needed.

### Implementation plan

1. In `BookForm`, render the existing filtered category option list before the existing conditional create-category
   button. Preserve filtering, selected state, inline category editing, loading/disabled behavior, and category-create
   mutation handling.
2. Make the equivalent render-order change in `BulkAddPage` for each review-row category picker. Preserve the current
   shared search state, exact-match suppression, pending label, and newly created category selection behavior.
3. Do not introduce positive `tabindex` values or manual focus movement. Native DOM order should remain the visual and
   sequential keyboard order: search input, each matching category control (including its Edit control where present),
   then Add Category.
4. Extend the existing `BookForm` and `BulkAddPage` tests to assert DOM order and a keyboard Tab sequence when creation
   is available. Retain selection and category-creation regression coverage.
5. Add or extend the applicable Playwright flow to open a picker, search for a term that leaves existing matches while
   permitting creation, and verify focus reaches all matches before the create action. Run focused tests, then the
   canonical `make check` gate.

### Concerns and dependencies

No backend or data-contract change is required. The plan intentionally applies to both currently implemented creation
surfaces; limiting it to Add/Edit Book would leave Bulk Add inconsistent with the acceptance criteria.
