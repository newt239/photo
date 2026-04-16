import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core'

import Footer from '../components/Footer'
import Header from '../components/Header'

import ClerkProvider from '../integrations/clerk/provider'

import mantineCoreCss from '@mantine/core/styles.css?url'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
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
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <HeadContent />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
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
