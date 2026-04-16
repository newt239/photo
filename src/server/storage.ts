import { AwsClient } from 'aws4fetch'
import { env } from '#/env.ts'

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
}

export function extFromMime(mime: string): string {
  return MIME_EXT[mime.toLowerCase()] ?? 'bin'
}

export function buildOriginalKey(
  userId: string,
  photoId: string,
  mime: string,
): string {
  return `users/${userId}/photos/${photoId}/original.${extFromMime(mime)}`
}

export function buildThumbnailKey(userId: string, photoId: string): string {
  return `users/${userId}/photos/${photoId}/thumb.webp`
}

export function keyOwnerId(storageKey: string): string | null {
  const match = storageKey.match(/^users\/([^/]+)\//)
  return match ? match[1] : null
}

function r2Client(): AwsClient {
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  })
}

const R2_BUCKET_NAME = 'photo'

function r2Endpoint(key: string): string {
  return `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`
}

export async function signPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300,
): Promise<string> {
  const client = r2Client()
  const url = new URL(r2Endpoint(key))
  url.searchParams.set('X-Amz-Expires', String(expiresInSeconds))
  const signed = await client.sign(
    new Request(url.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    }),
    { aws: { signQuery: true } },
  )
  return signed.url
}
