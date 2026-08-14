# Build the Frontend

* [ ] Read helpful docs:
  * [ ] Read `docs/technical-reference/basic-concepts.md`
* [ ] Implement the feature docs:
  * [ ] Complete feature ticket `docs/tickets/FEAT-08_checkin-and-loan-history.md`.
  * [ ] Complete the manual checklist to ensure Feat-06 is working: `docs/baselines/FEAT-06_isbn-scanner-capture.md`
  * [ ] Complete feature ticket `docs/tickets/FEAT-09_reading-tracking.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-10_book-edit-delete-and-restore.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-11_library-dashboard.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-12_operational-and-browser-hardening.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-13_workflow-and-accessibility-tests.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-14_continuous-integration-quality-pipeline.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-15_podman-development-and-preview.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-16_versioned-release-artifacts.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-17_about-page.md`.
  * [ ] Confirm that `product-docs/PLAN.md` is fully implemented.
* [ ] Build out the CI/CD for this project
  * [ ] Package into a podman container for convenience
    * [ ] Follow patterns in `../shade-backend/ci/`
    * [ ] For prod: Zip the website's deployable files into a tarball
    * [ ] For dev: Build a Podman container. Another project will run this in Podman Compose with the BE.
* [ ] Add more functionality to the website
  * [ ] Finish the feature tickets in the backend
  * [ ] Run `make openapi` in the backend and update `../shade-backend/docs/API-for-FE.md`
  * [ ] Create new FE tickets
    * [ ] Augment `/books` with: filtering on category & sorting on shelf
    * [ ] Augment `/dashboard` with: Dashboard reports
      * Missing section, missing category, missing shelf, missing pages, missing publisher, missing year, missing isbn
    * [ ] Add a new `/wishlists`: Show wishlists. Also add ability to add books to wishlists.
