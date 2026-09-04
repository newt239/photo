#!/usr/bin/env bash
set -euo pipefail

if [ "${WORKERS_CI_BRANCH:-main}" != "main" ]; then
  export VITE_CLERK_PUBLISHABLE_KEY="${VITE_CLERK_PUBLISHABLE_KEY_PREVIEW:?プレビューには VITE_CLERK_PUBLISHABLE_KEY_PREVIEW が必要です}"
fi

pnpm run build
