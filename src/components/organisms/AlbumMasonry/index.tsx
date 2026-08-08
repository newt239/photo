import { useMemo } from "react";

import { Link } from "@tanstack/react-router";
import { thumbHashToDataURL } from "thumbhash";

import { formatAlbumPeriod } from "#/lib/format.ts";
import { photoImageUrl } from "#/lib/image-url.ts";
import { masonryLayout } from "#/lib/masonry.ts";

import classes from "./AlbumMasonry.module.css";

import type { listPublicAlbums } from "#/server/public.ts";

export type AlbumMasonryItem = Awaited<ReturnType<typeof listPublicAlbums>>[number];

const EAGER_COUNT = 4;

export const AlbumMasonry = ({ albums }: { albums: AlbumMasonryItem[] }) => {
  // カバーが無いアルバムはプレースホルダーと同じ 4:3 として積む
  const sized = albums.map((album) => ({
    ...album,
    height: album.coverHeight ?? 3,
    width: album.coverWidth ?? 4,
  }));
  // 列数は CSS のコンテナクエリで決まるため 1〜4 列ぶんの位置を先に配っておく
  const layouts = [1, 2, 3, 4].map((columns) => masonryLayout(sized, columns));
  const positions = [
    `.${classes.canvas}{${layouts.map((layout, i) => `--h${i + 1}:${layout.totalHeight};`).join("")}}`,
    ...sized.map(
      (_, index) =>
        `.${classes.item}[data-index="${index}"]{${layouts
          .map((layout, i) => {
            const placed = layout.items[index];
            return placed ? `--c${i + 1}:${placed.column};--y${i + 1}:${placed.top};` : "";
          })
          .join("")}}`,
    ),
  ].join("");
  const blurs = useMemo(
    () =>
      new Map(
        albums.flatMap((album) =>
          album.coverPlaceholder
            ? [
                [
                  album.id,
                  thumbHashToDataURL(
                    Uint8Array.from(atob(album.coverPlaceholder), (c) => c.codePointAt(0) ?? 0),
                  ),
                ] as const,
              ]
            : [],
        ),
      ),
    [albums],
  );

  return (
    <div className={classes.gallery}>
      <style>{positions}</style>
      <div className={classes.canvas}>
        {sized.map((album, index) => {
          const coverKey = album.coverStorageKey;
          return (
            <Link
              key={album.id}
              to="/albums/$slug"
              params={{ slug: album.slug }}
              className={classes.item}
              data-index={index}
            >
              {coverKey ? (
                <img
                  src={photoImageUrl(coverKey, 640)}
                  srcSet={[640, 1024, 1600]
                    .map((candidate) => `${photoImageUrl(coverKey, candidate)} ${candidate}w`)
                    .join(", ")}
                  sizes="(min-width: 1408px) 25vw, (min-width: 1056px) 33vw, (min-width: 704px) 50vw, 100vw"
                  alt=""
                  loading={index < EAGER_COUNT ? "eager" : "lazy"}
                  fetchPriority={index < EAGER_COUNT ? "high" : undefined}
                  decoding="async"
                  style={{
                    aspectRatio: `${album.width} / ${album.height}`,
                    backgroundImage: blurs.get(album.id)
                      ? `url(${blurs.get(album.id)})`
                      : undefined,
                    backgroundSize: "cover",
                  }}
                />
              ) : (
                <div className={classes.placeholder} />
              )}
              <span className={classes.caption}>
                <span className={classes.title}>{album.title ?? "(無題)"}</span>
                {formatAlbumPeriod(album.periodStart, album.periodEnd) ? (
                  <span className={classes.description}>
                    {formatAlbumPeriod(album.periodStart, album.periodEnd)}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
