export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const THUMBNAIL_MAX_EDGE = 1024;
