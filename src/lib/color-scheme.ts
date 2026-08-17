import type { MantineColorSchemeManager } from "@mantine/core";

export const COLOR_SCHEME_COOKIE = "mantine-color-scheme-value";

const ONE_YEAR = 60 * 60 * 24 * 365;

export const cookieColorSchemeManager = (): MantineColorSchemeManager => ({
  clear: () => {
    if (typeof document === "undefined") {
      return;
    }
    document.cookie = `${COLOR_SCHEME_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  },
  get: (defaultValue) => {
    if (typeof document === "undefined") {
      return defaultValue;
    }
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COLOR_SCHEME_COOKIE}=`));
    if (!match) {
      return defaultValue;
    }
    const value = decodeURIComponent(match.slice(COLOR_SCHEME_COOKIE.length + 1));
    return value === "light" || value === "dark" || value === "auto" ? value : defaultValue;
  },
  set: (value) => {
    if (typeof document === "undefined") {
      return;
    }
    document.cookie = `${COLOR_SCHEME_COOKIE}=${value}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
  },
  subscribe: () => {},
  unsubscribe: () => {},
});
