#!/bin/bash
set -euo pipefail

echo "Installing Elixir SDK with asdf version manager..."

# Update package manager
apt-get update -qq 2>/dev/null || true

# Install dependencies for compiling Erlang and Elixir
apt-get install -y -qq git curl build-essential autoconf \
  m4 libncurses5-dev libssl-dev unixodbc-dev \
  2>/dev/null || true

# Install asdf
if [ ! -d "$HOME/.asdf" ]; then
  git clone https://github.com/asdf-vm/asdf.git "$HOME/.asdf" --branch v0.14.0 2>/dev/null || true
fi

# Source asdf
export ASDF_DIR="$HOME/.asdf"
source "$ASDF_DIR/asdf.sh" 2>/dev/null || true

# Add asdf plugins
asdf plugin add erlang https://github.com/asdf-vm/asdf-erlang.git 2>/dev/null || true
asdf plugin add elixir https://github.com/asdf-vm/asdf-elixir.git 2>/dev/null || true

# Install Erlang 28.1
echo "Installing Erlang 28.1..."
asdf install erlang 28.1 2>/dev/null || {
  echo "Erlang installation may take several minutes..."
  asdf install erlang 28.1
}

# Install Elixir 1.19.2
echo "Installing Elixir 1.19.2..."
asdf install elixir 1.19.2 2>/dev/null || {
  echo "Elixir installation may take several minutes..."
  asdf install elixir 1.19.2
}

# Set global versions
asdf global erlang 28.1
asdf global elixir 1.19.2

echo "Elixir SDK installation complete"

# Persist asdf configuration for session
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export ASDF_DIR="$HOME/.asdf"' >> "$CLAUDE_ENV_FILE"
  echo 'source "$ASDF_DIR/asdf.sh"' >> "$CLAUDE_ENV_FILE"
fi

# Verify installation
elixir --version

# Fetch Elixir dependencies if mix.exs exists
if [ -f "$CLAUDE_PROJECT_DIR/mix.exs" ]; then
  echo "Fetching Elixir dependencies..."
  cd "$CLAUDE_PROJECT_DIR"
  mix deps.get
else
  echo "No mix.exs found, skipping dependency fetch"
fi
