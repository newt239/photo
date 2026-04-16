import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

import viteReact from '@vitejs/plugin-react'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ['@clerk/react', '@clerk/shared', '@clerk/tanstack-react-start'],
  },
  plugins: [
    tanstackStart(),
    viteReact(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
  ],
})

export default config
