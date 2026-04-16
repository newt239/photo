import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    accountId: "35694f79a0a603c122414db751bea422",
    databaseId: "25507ef0-d4a4-46e0-92c0-d5f568d21f06",
    token: process.env.CLOUDFLARE_TOKEN!
  },
})
