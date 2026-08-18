import { AwsClient } from "aws4fetch";

import { env } from "#/env.ts";

import type { ALLOWED_MIME_TYPES } from "#/lib/upload-constraints.ts";

export const MIME_EXT: Record<(typeof ALLOWED_MIME_TYPES)[number], string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const signPutUrl = async (key: string, contentType: string) => {
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    region: "auto",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
  });
  const url = new URL(`https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/photo/${key}`);
  url.searchParams.set("X-Amz-Expires", "300");
  const signed = await client.sign(
    new Request(url.toString(), {
      headers: { "Content-Type": contentType },
      method: "PUT",
    }),
    { aws: { signQuery: true } },
  );
  return signed.url;
};
