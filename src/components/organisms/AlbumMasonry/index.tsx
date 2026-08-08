import { Link } from "@tanstack/react-router";

import { photoImageUrl } from "#/lib/image-url.ts";
import { useMasonryColumns } from "#/lib/use-masonry-columns.ts";

import classes from "./AlbumMasonry.module.css";

import type { listPublicAlbums } from "#/server/public.ts";

export type AlbumMasonryItem = Awaited<ReturnType<typeof listPublicAlbums>>[number];

export const AlbumMasonry = ({ albums }: { albums: AlbumMasonryItem[] }) => {
  const { columns, ref } = useMasonryColumns(352);

  return (
    <div className={classes.gallery} ref={ref}>
      {Array.from({ length: columns }, (_, column) => (
        <div key={column} className={classes.column}>
          {albums.map((album, i) => {
            if (i % columns !== column) {
              return null;
            }
            const coverKey = album.coverThumbnailKey ?? album.coverStorageKey;
            return (
              <Link
                key={album.id}
                to="/albums/$slug"
                params={{ slug: album.slug }}
                className={classes.item}
              >
                {coverKey && album.coverWidth && album.coverHeight ? (
                  <img
                    src={photoImageUrl(coverKey)}
                    alt=""
                    loading="lazy"
                    style={{ aspectRatio: `${album.coverWidth} / ${album.coverHeight}` }}
                  />
                ) : (
                  <div className={classes.placeholder} />
                )}
                <span className={classes.title}>{album.title ?? "(無題)"}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};
