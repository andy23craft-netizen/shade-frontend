# Build the Frontend

* [ ] Read helpful docs:
  * [ ] Read `docs/technical-reference/bash-reference.md`
* [ ] Implement the feature docs:
  * [ ] Complete feature ticket `docs/tickets/FEAT-12_operational-and-browser-hardening.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-13_workflow-and-accessibility-tests.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-14_continuous-integration-quality-pipeline.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-15_podman-development-and-preview.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-16_versioned-release-artifacts.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-17_about-page.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-18_sorting-and-filtering.md` (category filter UI; shelf sort already in FEAT-10).
  * [ ] Complete feature ticket `docs/tickets/FEAT-19_wishlists.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-20_dashboard-metrics.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-21_display-only.md`.
  * [ ] Confirm that `product-docs/PLAN.md` is fully implemented.
* [ ] Add more functionality to the website
  * [ ] Finish the feature tickets in the backend
  * [ ] Run `make openapi` in the backend and update `../shade-backend/docs/API-for-FE.md`
  * [ ] Create new FE tickets
    * [ ] Augment `/books` with: filtering on category (shelf sort shipped with FEAT-10 API sync)
    * [ ] Augment `/dashboard` with: Dashboard reports
      * Missing section, missing category, missing shelf, missing pages, missing publisher, missing year, missing isbn
    * [ ] Add a new `/wishlists`: Show wishlists. Also add ability to add books to wishlists.
