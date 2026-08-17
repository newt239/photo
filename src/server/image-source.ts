import { env } from "cloudflare:workers";

export const jpegDataUrl = async (
  storageKey: string,
  transform: { fit: "cover" | "scale-down"; width: number; height?: number },
) => {
  const object = await env.MY_BUCKET.get(storageKey);
  if (!object) {
    return null;
  }
  // WebP を resvg が読めず HEIC もそのままでは扱えないため Images バインディングで JPEG に変換する
  const source = await object.blob();
  const transformed = await env.IMAGES.input(source.stream())
    .transform(transform)
    .output({ format: "image/jpeg", quality: 80 })
    .catch(() => null);
  if (!transformed) {
    return null;
  }
  const bytes = new Uint8Array(await transformed.response().arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCodePoint(...bytes.subarray(offset, offset + 8192));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
};
