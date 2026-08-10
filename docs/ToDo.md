# Build the Frontend

* [ ] Download free IDE: WebStorm
  * [ ] Download plugins: Key Promoter X, Mario Progress Bar (or similar), plantuml4idea, Docker, HTML Tools, Live Edit,
        Refactor-X, Editorconfig, ESLint, JavaScript and TypeScript, JavaScript Debugger, JSHint, Node.js, Prettier,
        React, Styled Components & Styled JSX, TSLint, Vite, Webpack, JSON, Markdown, Shell Script, YAML, CSS, PostCSS,
        Tailwind CSS
  * Note that I don't think any of these are mandatory. And many of these may already be installed.
* [ ] Read helpful docs:
  * [ ] Read `README.md`
  * [ ] Read `docs/MAINTAINERS.md`
* [ ] Implement the feature docs:
  * [ ] Complete feature ticket `docs/tickets/FEAT-01_application-shell-and-shared-ui.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-02_runtime-configuration-and-connection.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-03_typed-api-and-server-state.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-04_active-collection-and-book-details.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-05_book-form-and-creation.md`.
  * [ ] Complete feature ticket `docs/tickets/FEAT-06_isbn-scanner-capture.md`.
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
