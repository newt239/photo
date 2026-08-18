# fernweh.newt239.dev

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
mise install
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
pnpm codecheck  # typecheck + lint + format + knip
```

## Cloudflare Workers Builds

ダッシュボードの build command に以下を指定している。

```bash
bash infra/cloudflare-build.sh
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

## 共有シートからのアップロード

`public/manifest.json` の `share_target` と `public/sw.js` により、インストールした PWA が共有シートに現れる。共有されたファイルは Service Worker が Cache API に退避し、アップロード画面が取り出して通常のアップロード経路に流す。iOS Safari は `share_target` を未サポートのため、Android / Chrome OS / デスクトップ Chrome でのみ利用できる。
