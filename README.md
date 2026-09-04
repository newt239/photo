# fernweh.newt239.dev

個人向け写真管理アプリ。Cloudflare Workers 上で動作する TanStack Start ベースの SSR アプリ。

## 技術スタック

TanStack Start / React / Mantine / Clerk / Cloudflare D1 + Drizzle ORM / Cloudflare R2 / Cloudflare Workers

## セットアップ

```bash
pnpm install
```

`.env.local` に以下を設定する。

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
