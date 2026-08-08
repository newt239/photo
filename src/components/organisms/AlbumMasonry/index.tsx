import { Link } from "@tanstack/react-router";

import { photoImageUrl } from "#/lib/image-url.ts";
import { masonryLayout, useContainerWidth } from "#/lib/masonry.ts";

import classes from "./AlbumMasonry.module.css";

import type { listPublicAlbums } from "#/server/public.ts";

export type AlbumMasonryItem = Awaited<ReturnType<typeof listPublicAlbums>>[number];

const EAGER_COUNT = 4;

export const AlbumMasonry = ({ albums }: { albums: AlbumMasonryItem[] }) => {
  const { ref, width } = useContainerWidth();
  const columns = width === 0 ? 3 : Math.max(1, Math.floor(width / 352));
  // カバーが無いアルバムはプレースホルダーと同じ 4:3 として積む
  const layout = masonryLayout(
    albums.map((album) => ({
      ...album,
      height: album.coverHeight ?? 3,
      width: album.coverWidth ?? 4,
    })),
    columns,
  );

  return (
    <div className={classes.gallery} ref={ref}>
      <div
        className={classes.canvas}
        style={{ height: `${(layout.totalHeight * 100) / columns}cqw` }}
      >
        {layout.items.map((album, index) => {
          const coverKey = album.coverThumbnailKey ?? album.coverStorageKey;
          return (
            <Link
              key={album.id}
              to="/albums/$slug"
              params={{ slug: album.slug }}
              className={classes.item}
              style={{
                left: `${(album.column * 100) / columns}%`,
                top: `${(album.top * 100) / columns}cqw`,
                width: `${100 / columns}%`,
              }}
            >
              {coverKey ? (
                <img
                  src={photoImageUrl(coverKey)}
                  alt=""
                  loading={index < EAGER_COUNT ? "eager" : "lazy"}
                  fetchPriority={index < EAGER_COUNT ? "high" : undefined}
                  decoding="async"
                  style={{ aspectRatio: `${album.width} / ${album.height}` }}
                />
              ) : (
                <div className={classes.placeholder} />
              )}
              <span className={classes.caption}>
                <span className={classes.title}>{album.title ?? "(無題)"}</span>
                {album.description ? (
                  <span className={classes.description}>{album.description}</span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
