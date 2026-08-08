export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

// Images バインディングが変換できる入力の上限に合わせている
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
