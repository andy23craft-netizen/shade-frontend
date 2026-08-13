# Build the Frontend

* [ ] Read helpful docs:
  * [ ] Read `docs/technical-reference/basic-concepts.md`
* [ ] Implement the feature docs:
  * [x] Complete feature ticket `docs/tickets/FEAT-04_active-collection-and-book-details.md`.
  * [x] Complete feature ticket `docs/tickets/FEAT-05_book-form-and-creation.md`.
  * [x] Complete feature ticket `docs/tickets/FEAT-06_isbn-scanner-capture.md`.
  * [ ] Complete the manual checklist to ensure Feat-06 is working: `docs/baselines/FEAT-06_isbn-scanner-capture.md`
  * [ ] Complete feature ticket `docs/tickets/FEAT-07_checkout-workflow.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-08_checkin-and-loan-history.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-09_reading-tracking.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-10_book-edit-delete-and-restore.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-11_library-dashboard.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-12_operational-and-browser-hardening.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-13_workflow-and-accessibility-tests.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-14_continuous-integration-quality-pipeline.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-15_podman-development-and-preview.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-16_versioned-release-artifacts.md`.
  * [ ] Confirm that `product-docs/PLAN.md` is fully implemented.
* [ ] Build out the CI/CD for this project
  * [ ] Package into a podman container for convenience
    * [ ] Follow patterns in `../shade-backend/ci/`
    * [ ] For prod: Zip the website's deployable files into a tarball
    * [ ] For dev: Build a Podman container. Another project will run this in Podman Compose with the BE.
