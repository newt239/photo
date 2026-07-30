#!/usr/bin/env bash
set -euo pipefail

WASM_PACK_VERSION=0.15.0

export PATH="$HOME/.cargo/bin:$PATH"

if ! command -v cargo > /dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs |
    sh -s -- -y --profile minimal --no-modify-path
fi

if ! command -v wasm-pack > /dev/null 2>&1; then
  curl -sSfL "https://github.com/rustwasm/wasm-pack/releases/download/v${WASM_PACK_VERSION}/wasm-pack-v${WASM_PACK_VERSION}-x86_64-unknown-linux-musl.tar.gz" |
    tar xz -C "$HOME/.cargo/bin" --strip-components=1 --wildcards '*/wasm-pack'
fi

pnpm run wasm:build
pnpm run build
