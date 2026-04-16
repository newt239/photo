import { nanoid } from 'nanoid'

export function slugify(input: string): string {
  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'album'
}

export function uniqueSlug(title: string): string {
  return `${slugify(title)}-${nanoid(6)}`
}
