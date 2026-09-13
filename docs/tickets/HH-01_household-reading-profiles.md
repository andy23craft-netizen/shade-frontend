# HH-01 -- Household reading profiles

**Status:** Proposed

**Dependency group:** Household reading profiles.

**Depends on:** Backend HH-01's checked-in OpenAPI and supplementary frontend contract guidance; generated API
types; existing book, album, dashboard, and Manage Collection surfaces.

## Objective

Allow an opted-in household library to keep personal reading and listening state for named household members, while
preserving the current single-reader experience for libraries that have no non-owner members.

## Product decisions

- Add a **Household readers** control to Manage Collection. It lists the owner and all non-owner household members,
  with an empty state that explains household reading is optional.
- Creating a household member requires a visible, accessible name field. Submit the trimmed display name to the
  backend; do not generate, infer, or substitute a name. The UI must explain that names must be unique within the
  household, ignoring letter case.
- The owner profile is always present. Its display name may be renamed, but it cannot be removed.
- Non-owner members may be added, renamed, and removed. Removal must require an explicit data-preserving choice:
  reassign the member's personal records to one remaining profile, or permanently delete those records. Do not
  expose a destructive default or call removal without the selected backend-supported outcome.
- Keep all household-specific controls absent until at least one non-owner profile exists. In single-reader mode,
  existing dashboard, book, and album flows retain their current visual and interaction model.
- When enabled, provide one accessible active-reader selector wherever a user views a personal dashboard metric or
  can perform a personal read, unread, played, unplayed, completion, rating, or review action. Make the selected
  name unmistakable immediately before a write.
- Store active-reader preference only for the current tenant and device, using the existing frontend preference
  convention if one exists. If the saved profile no longer exists, use the owner and replace/clear the stale value.
  Do not add account synchronization or a new cross-device preference service.
- Clearly distinguish profile-specific reading/listening metrics from tenant-wide inventory and circulation metrics.
  The dashboard must render the profile identity supplied by the backend with personal metrics and must never merge
  personal totals across profiles.

## Acceptance criteria

- [ ] A tenant without non-owner household members has no Household readers, active-reader, or extra dashboard
      controls, and behaves as the current single-reader product.
- [ ] Manage Collection provides an accessible Household readers entry point with loading, empty, error, and
      populated states.
- [ ] A user can create any number of non-owner members by entering each member's name; blank/whitespace-only and
      case-insensitive duplicate names receive clear, non-destructive validation feedback.
- [ ] A user can rename the owner or a non-owner member; owner removal is unavailable and non-owner removal requires
      an explicit reassignment target or permanent-delete decision before submission.
- [ ] After the first non-owner member is created, profile-aware controls appear for personal book and album actions
      and on Reading and Listening dashboards; the selected active reader is announced and keyboard operable.
- [ ] The owner and a non-owner member can display and write independent completion/read-or-played state, completion
      dates, ratings, and reviews for the same catalog item, as defined by the backend contract.
- [ ] Switching active reader updates only profile-scoped detail/action state and personal analytics; shared
      catalog, placement, availability, and loan values remain visibly tenant-wide.
- [ ] Removing the active profile clears or safely falls back from the local preference to the owner without a broken
      selector, stale profile write, or loss of unsaved action-form input.
- [ ] API validation/conflict/removal errors preserve unsaved member-management and reading-action input, are
      announced accessibly, and do not imply that a failed change succeeded.
- [ ] Tests cover opt-in visibility, named creation, trim/duplicate validation, rename, protected removal choices,
      preference fallback, profile-scoped transport/query invalidation, dashboard labeling, and keyboard/screen-reader
      behavior.

## Frontend implementation notes

- Do not implement transport shapes, identifiers, query parameters, or removal outcomes until backend HH-01 updates
  the checked-in OpenAPI and frontend guidance. Generate types and extend the existing API client and React Query
  hooks; do not add an ad-hoc fetch client or hand-maintained contract types.
- Thread the selected profile explicitly through every new personal-state read/write and its React Query key. Keep
  shared catalog, shelf, wishlist, availability, and loan keys/profile behavior unchanged unless the published
  contract explicitly makes a response profile-aware.
- Preserve unsaved rating/review/completion form data through profile-management mutation failures. On an intentional
  reader switch, require the normal existing unsaved-change behavior rather than silently submitting, discarding, or
  applying one profile's draft to another.
- Treat the backend's owner/profile identity and dashboard metric classification as authoritative. Do not derive
  household state from names, client-side counts, legacy top-level read/played fields, or browser storage.
- Reuse existing Manage Collection navigation, forms, dialogs, status/error announcements, responsive layouts, and
  dashboard components. The selectors and profile-management flow must remain usable at narrow widths.

## Out of scope

Login accounts, authentication or permissions, invitations, avatars, parental controls, privacy controls,
household-specific loans/shelves/wishlists/collections, cross-device active-reader synchronization, and an aggregate
all-household dashboard.
