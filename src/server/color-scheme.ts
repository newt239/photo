import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import type { MantineColorScheme } from '@mantine/core'
import { COLOR_SCHEME_COOKIE, isColorScheme } from '#/lib/color-scheme.ts'

export const getColorSchemeCookie = createServerFn({ method: 'GET' }).handler(
  (): MantineColorScheme => {
    const value = getCookie(COLOR_SCHEME_COOKIE)
    return isColorScheme(value) ? value : 'auto'
  },
)
