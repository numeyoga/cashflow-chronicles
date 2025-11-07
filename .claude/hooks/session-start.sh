#!/bin/bash
set -euo pipefail

# Install Elixir SDK and dependencies
echo "Installing Elixir SDK..."

# Update package manager (tolerate failures due to sandbox restrictions)
apt-get update -qq 2>/dev/null || true

# Install Elixir (which includes Erlang as a dependency)
apt-get install -y -qq elixir 2>/dev/null || {
  echo "Note: Package installation failed, but hook will continue"
  echo "Elixir SDK installation skipped (may already be available)"
}

# Verify installation
if command -v elixir &> /dev/null; then
  echo "Elixir installation complete"
  elixir --version
else
  echo "Warning: Elixir not available after installation attempt"
  exit 1
fi
