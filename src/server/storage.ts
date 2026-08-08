import { AwsClient } from "aws4fetch";

import { env } from "#/env.ts";

export const MIME_EXT: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const signPutUrl = async (key: string, contentType: string, expiresInSeconds = 300) => {
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    region: "auto",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
  });
  const url = new URL(`https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/photo/${key}`);
  url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));
  const signed = await client.sign(
    new Request(url.toString(), {
      headers: { "Content-Type": contentType },
      method: "PUT",
    }),
    { aws: { signQuery: true } },
  );
  return signed.url;
};
