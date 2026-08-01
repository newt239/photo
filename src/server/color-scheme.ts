import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

import { COLOR_SCHEME_COOKIE } from "#/lib/color-scheme.ts";

import type { MantineColorScheme } from "@mantine/core";

export const getColorSchemeCookie = createServerFn({ method: "GET" }).handler(
  (): MantineColorScheme => {
    const value = getCookie(COLOR_SCHEME_COOKIE);
    return value === "light" || value === "dark" || value === "auto" ? value : "auto";
  },
);
