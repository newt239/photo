import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core'

import Footer from '../components/Footer'
import Header from '../components/Header'

import ClerkProvider from '../integrations/clerk/provider'
import { cookieColorSchemeManager } from '#/lib/color-scheme.ts'
import { getColorSchemeCookie } from '#/server/color-scheme.ts'

import mantineCoreCss from '@mantine/core/styles.css?url'
import mantineDropzoneCss from '@mantine/dropzone/styles.css?url'
import appCss from '../styles.css?url'

const colorSchemeManager = cookieColorSchemeManager()

export const Route = createRootRoute({
  loader: async () => ({
    colorScheme: await getColorSchemeCookie(),
  }),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: mantineCoreCss,
      },
      {
        rel: 'stylesheet',
        href: mantineDropzoneCss,
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { colorScheme } = Route.useLoaderData()
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme={colorScheme} />
        <HeadContent />
      </head>
      <body>
        <MantineProvider
          defaultColorScheme={colorScheme}
          colorSchemeManager={colorSchemeManager}
        >
          <ClerkProvider>
            <Header />
            {children}
            <Footer />
          </ClerkProvider>
        </MantineProvider>
        <Scripts />
      </body>
    </html>
  )
}
