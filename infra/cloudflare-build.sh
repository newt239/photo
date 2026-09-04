#!/usr/bin/env bash
set -euo pipefail

# Workers Builds のイメージは pnpm 10 系で、pnpm 12 はネイティブバイナリのため packageManager 経由で切り替わらない
if ! pnpm --version 2>/dev/null | grep -q '^12\.'; then
  curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=12.3.1 SHELL=bash sh -
  export PATH="$HOME/.local/share/pnpm:$PATH"
fi

if [ "${WORKERS_CI_BRANCH:-main}" != "main" ]; then
  export VITE_CLERK_PUBLISHABLE_KEY="${VITE_CLERK_PUBLISHABLE_KEY_PREVIEW:?プレビューには VITE_CLERK_PUBLISHABLE_KEY_PREVIEW が必要です}"
fi

pnpm install --frozen-lockfile
pnpm run build
