import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import mantineCoreCss from "@mantine/core/styles.css?url";
import mantineDropzoneCss from "@mantine/dropzone/styles.css?url";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { env } from "#/env.ts";
import { cookieColorSchemeManager } from "#/lib/color-scheme.ts";
import { ClerkProvider } from "#/providers/ClerkProvider.tsx";
import { getColorSchemeCookie } from "#/server/color-scheme.ts";
import appCss from "#/styles.css?url";

const colorSchemeManager = cookieColorSchemeManager();

const RootDocument = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme } = Route.useLoaderData();
  return (
    <html lang="ja" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme={colorScheme} />
        <HeadContent />
      </head>
      <body>
        <a className="skip-link" href="#main">
          本文へスキップする
        </a>
        <MantineProvider defaultColorScheme={colorScheme} colorSchemeManager={colorSchemeManager}>
          <ClerkProvider>{children}</ClerkProvider>
        </MantineProvider>
        <Scripts />
      </body>
    </html>
  );
};

export const Route = createRootRoute({
  head: () => ({
    links: [
      {
        href: mantineCoreCss,
        rel: "stylesheet",
      },
      {
        href: mantineDropzoneCss,
        rel: "stylesheet",
      },
      {
        href: appCss,
        rel: "stylesheet",
      },
      {
        href: "/favicon.svg",
        rel: "icon",
        type: "image/svg+xml",
      },
      {
        href: "/favicon.ico",
        rel: "icon",
        sizes: "48x48",
      },
      {
        href: "/apple-touch-icon.png",
        rel: "apple-touch-icon",
      },
      {
        href: "/manifest.json",
        rel: "manifest",
      },
    ],
    meta: [
      {
        // HTML の meta charset は仕様上 "utf-8" である必要がある
        // eslint-disable-next-line unicorn/text-encoding-identifier-case
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
        name: "viewport",
      },
      {
        title: "photos.newt239.dev",
      },
      {
        content: "photos.newt239.dev",
        property: "og:site_name",
      },
      {
        content: "website",
        property: "og:type",
      },
      {
        content: "photos.newt239.dev",
        property: "og:title",
      },
      {
        content: `${env.VITE_SITE_URL}/api/og`,
        property: "og:image",
      },
      {
        content: "1200",
        property: "og:image:width",
      },
      {
        content: "630",
        property: "og:image:height",
      },
      {
        content: "summary_large_image",
        name: "twitter:card",
      },
    ],
    scripts: env.VITE_GA_MEASUREMENT_ID
      ? [
          {
            async: true,
            src: `https://www.googletagmanager.com/gtag/js?id=${env.VITE_GA_MEASUREMENT_ID}`,
          },
          {
            children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${env.VITE_GA_MEASUREMENT_ID}");`,
          },
        ]
      : [],
  }),
  loader: async () => ({
    colorScheme: await getColorSchemeCookie(),
  }),
  shellComponent: RootDocument,
});
