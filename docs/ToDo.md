# Build the Frontend

* [ ] Download free IDE: WebStorm
  * [ ] Download plugins: 
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
* Build out the CI/CD for this project
  * Build with Make
    * Which primarily invokes Yarn commands
  * Package into a podman container for convenience
  * Zip website files into a tarball
  * Use Ansible to deploy onto the remote
  * Use Ansible to "install" (i.e., unzip & mv) these executable files into the correct directory
  * Use Ansible to wrap into a `systemd` service that can be easily managed

