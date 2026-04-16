import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "25507ef0-d4a4-46e0-92c0-d5f568d21f06",
    token: process.env.CLOUDFLARE_TOKEN!
  },
})
