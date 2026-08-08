# Clarifications on Prod Setup

Prod Machine Details:
* Raspberry Pi 5
* Raspberry Pi OS 6.3; based on Debian Trixie

```bash
#!/bin/bash

set -euo pipefail

# Phase 0: Table Settings

sudo apt update
sudo apt install -y curl ca-certificates

# Phase 1: Install Node

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash

# Load nvm into the current shell
. "$HOME/.nvm/nvm.sh"

# Install Node 26
nvm install 26

# Make it the default
nvm alias default 26

node --version
# Expect v26.7.0

npm --version
# Expect 0.40.4


# Phase 2: Install Yarn

npm install -g corepack
corepack enable

COREPACK_ENABLE_DOWNLOAD_PROMPT=0 yarn set version stable
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 yarn --version
# Expect 4.18.0
```
