# photo

個人向け写真管理アプリ。Cloudflare Workers 上で動作する TanStack Start ベースの SSR アプリ。

## 技術スタック

- **Framework**: TanStack Start (React 19, SSR)
- **UI**: Mantine + CSS Modules
- **Auth**: Clerk
- **DB**: Cloudflare D1 + Drizzle ORM
- **Storage**: Cloudflare R2
- **Runtime**: Cloudflare Workers
- **WebAssembly**: Rust (`crates/json-parser`) をブラウザの Web Worker 上で実行

## セットアップ

```bash
mise install
pnpm install
pnpm wasm:build
```

`.env.local` に以下を設定:

```
VITE_CLERK_PUBLISHABLE_KEY=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_TOKEN=...
```

## 開発コマンド

```bash
pnpm dev        # 開発サーバー (http://localhost:3000)
pnpm build      # 本番ビルド
pnpm preview    # ビルド成果物のプレビュー
pnpm codecheck  # typecheck + lint + format + knip
```

## WebAssembly (Rust)

クライアントサイドで大きな JSON を解析するための Rust クレートを `crates/json-parser` に置いている。ビルド成果物 `crates/json-parser/pkg` はコミットせず、TypeScript からは `@wasm/json-parser` エイリアスで参照する。実行はメインスレッドを塞がないよう `src/workers/json-parser.worker.ts` の Web Worker 内で行う。

前提ツールチェーン:

- rustup (未導入の場合は `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- wasm-pack (`mise.toml` で管理。`mise install` で導入される)

```bash
pnpm wasm:build      # リリースビルド
pnpm wasm:build:dev  # デバッグビルド (ビルドは速いが実行は遅い)
```

`pnpm build` には含まれないため、**初回および Rust 側を変更したときは手動で `pnpm wasm:build` を実行**する。`pkg` が無い状態では `pnpm typecheck` が `@wasm/json-parser` を解決できず失敗する。

`~/.mise.toml` などで rust を mise 管理下に置いている場合、`RUSTUP_TOOLCHAIN` が export され `rust-toolchain.toml` が無視される。その場合は使用中の toolchain に対してターゲットを追加する:

```bash
rustup target add wasm32-unknown-unknown
```

動作確認用のページを `/admin/debug/wasm` に用意している。

## データベース

Drizzle でスキーマ (`src/db/schema.ts`) からマイグレーション SQL を生成:

```bash
pnpm db:generate  # ./drizzle に出力
pnpm db:studio    # Drizzle Studio
```

D1 へのマイグレーション適用は wrangler 経由で実行:

```bash
# ローカル D1 (開発用)
pnpm wrangler d1 migrations apply photo --local

# 本番 D1
pnpm wrangler d1 migrations apply photo --remote
```

> `wrangler.jsonc` の `d1_databases[].migrations_dir` に `drizzle` を指定しているため、drizzle-kit が生成した SQL をそのまま wrangler が読み込む。

## デプロイ

```bash
pnpm wrangler deploy
```
