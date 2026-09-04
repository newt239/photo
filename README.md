# fernweh.newt239.dev

個人向け写真管理アプリ。Cloudflare Workers 上で動作する TanStack Start ベースの SSR アプリ。

## 技術スタック

TanStack Start (React 19) / Mantine / Clerk / Cloudflare D1 + Drizzle ORM / Cloudflare R2 / Cloudflare Workers

## セットアップ

```bash
pnpm install
```

pnpm 12 はネイティブバイナリのため pnpm 11 以下からは自動で切り替わらない。手元が pnpm 11 以下なら一度だけ次を実行する。

```bash
curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=12.3.1 sh -
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

設計方針・デプロイ・データベース運用の詳細は [CLAUDE.md](./CLAUDE.md) を参照。
