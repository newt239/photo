import { env } from "#/env.ts";

export const photoImageUrl = (storageKey: string, width?: number) =>
  width === undefined
    ? `${env.VITE_IMAGE_BASE_URL}/${storageKey}`
    : `${env.VITE_IMAGE_BASE_URL}/cdn-cgi/image/width=${width},fit=scale-down,format=auto,quality=82/${storageKey}`;
