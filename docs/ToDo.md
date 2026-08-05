# Build the Frontend

* Stack:
  * TypeScript, React, Node.js, Yarn, Vite
* Pages
  * Dashboard
  * Check out book
  * Check In book
  * Admin Management UI
* Notes
  * BE API expects a Bearer Token in the Authorization header
* Build out the CI/CD for this project
  * Build with Make
    * Which primarily invokes Yarn commands
  * Package into a podman container for convenience
  * Zip website files into a tarball
  * Use Ansible to deploy onto the remote
  * Use Ansible to "install" (i.e., unzip & mv) these executable files into the correct directory
  * Use Ansible to wrap into a `systemd` service that can be easily managed

