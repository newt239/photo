import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: text().primaryKey(),
    email: text().notNull(),
    displayName: text('display_name'),
    imageUrl: text('image_url'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
)

export const photos = sqliteTable(
  'photos',
  {
    id: text().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text(),
    storageKey: text('storage_key').notNull(),
    thumbnailKey: text('thumbnail_key'),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    visibility: text({ enum: ['public', 'private'] }).notNull(),
    takenAt: integer('taken_at', { mode: 'timestamp' }),
    uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    latitude: real(),
    longitude: real(),
    altitude: real(),
    cameraMake: text('camera_make'),
    cameraModel: text('camera_model'),
    lensModel: text('lens_model'),
    focalLength: real('focal_length'),
    aperture: real(),
    shutterSpeed: text('shutter_speed'),
    iso: integer(),
    orientation: integer(),
    rawExif: text('raw_exif'),
  },
  (t) => [
    index('photos_user_id_idx').on(t.userId),
    index('photos_taken_at_idx').on(t.takenAt),
    index('photos_lat_lng_idx').on(t.latitude, t.longitude),
  ],
)

export const albums = sqliteTable(
  'albums',
  {
    id: text().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text(),
    slug: text().notNull(),
    description: text(),
    coverPhotoId: text('cover_photo_id').references(() => photos.id, {
      onDelete: 'set null',
    }),
    visibility: text({ enum: ['public', 'private'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex('albums_slug_idx').on(t.slug),
    index('albums_user_id_idx').on(t.userId),
  ],
)

export const albumPhotos = sqliteTable(
  'album_photos',
  {
    albumId: text('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    photoId: text('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order'),
    addedAt: integer('added_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.photoId] }),
    index('album_photos_photo_id_idx').on(t.photoId),
  ],
)

export const albumShares = sqliteTable(
  'album_shares',
  {
    albumId: text('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.userId] }),
    index('album_shares_user_id_idx').on(t.userId),
  ],
)

export const photoShares = sqliteTable(
  'photo_shares',
  {
    photoId: text('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    primaryKey({ columns: [t.photoId, t.userId] }),
    index('photo_shares_user_id_idx').on(t.userId),
  ],
)
