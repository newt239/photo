import { env } from "#/env.ts";

export const photoImageUrl = (storageKey: string, width?: number) =>
  width === undefined
    ? `${env.VITE_IMAGE_BASE_URL}/${storageKey}`
    : `${env.VITE_IMAGE_BASE_URL}/cdn-cgi/image/width=${width},fit=scale-down,format=auto,quality=82/${storageKey}`;

export const photoSrcSet = (storageKey: string, widths: number[], maxWidth?: number) => {
  const usable = maxWidth === undefined ? widths : widths.filter((width) => width <= maxWidth);
  return usable.length > 0
    ? usable.map((width) => `${photoImageUrl(storageKey, width)} ${width}w`).join(", ")
    : undefined;
};
