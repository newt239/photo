import { Link } from "@tanstack/react-router";

import classes from "./PublicAlbumMasonry.module.css";

import type { listPublicAlbums } from "#/server/public.ts";

export type PublicAlbumData = Awaited<ReturnType<typeof listPublicAlbums>>[number];

export const PublicAlbumMasonry = ({ albums }: { albums: PublicAlbumData[] }) => (
  <div className={classes.gallery}>
    {albums.map((album) => {
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
              src={`/api/i/${coverKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`}
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
);
