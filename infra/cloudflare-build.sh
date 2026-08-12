#!/usr/bin/env bash
set -euo pipefail

if [ "${WORKERS_CI_BRANCH:-main}" != "main" ]; then
  export VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y3VycmVudC1zbmFrZS0xNy5jbGVyay5hY2NvdW50cy5kZXYk
fi

pnpm run build
