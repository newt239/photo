# photo

個人向け写真管理アプリ。Cloudflare Workers 上で動作する TanStack Start ベースの SSR アプリ。

## 技術スタック

- **Framework**: TanStack Start (React 19, SSR)
- **UI**: Mantine + CSS Modules
- **Auth**: Clerk
- **DB**: Cloudflare D1 + Drizzle ORM
- **Storage**: Cloudflare R2
- **Runtime**: Cloudflare Workers

## セットアップ

```bash
pnpm install
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
pnpm test       # Vitest
pnpm codecheck  # typecheck + lint + format
```

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
