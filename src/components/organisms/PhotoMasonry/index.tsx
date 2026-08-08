import { Text } from "@mantine/core";

import { PhotoCard, type PhotoCardData } from "#/components/molecules/PhotoCard";
import { masonryLayout } from "#/lib/masonry.ts";

import classes from "./PhotoMasonry.module.css";

export const PhotoMasonry = ({
  photos,
  albumSlug,
  emptyMessage = "写真はまだありません",
  selectedPhotoIds,
  onSelect,
}: {
  photos: PhotoCardData[];
  albumSlug?: string;
  emptyMessage?: string;
  selectedPhotoIds?: Set<string>;
  onSelect?: (photoId: string, extend: boolean) => void;
}) => {
  // 列数は CSS のコンテナクエリで決まるため 1〜8 列ぶんの位置を先に配っておく
  const layouts = [1, 2, 3, 4, 5, 6, 7, 8].map((columns) => masonryLayout(photos, columns));
  const positions = [
    `.${classes.canvas}{${layouts
      .map(
        (layout, i) =>
          `--h${i + 1}:${layout.totalHeight};--gr${i + 1}:${Math.max(0, layout.totalRows - 1)};`,
      )
      .join("")}}`,
    ...photos.map(
      (_, index) =>
        `.${classes.item}[data-index="${index}"]{${layouts
          .map((layout, i) => {
            const placed = layout.items[index];
            return placed
              ? `--c${i + 1}:${placed.column};--y${i + 1}:${placed.top};--r${i + 1}:${placed.rowsAbove};`
              : "";
          })
          .join("")}}`,
    ),
  ].join("");

  if (photos.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {emptyMessage}
      </Text>
    );
  }
  return (
    <div className={classes.masonry}>
      <style>{positions}</style>
      <div className={classes.canvas}>
        {photos.map((p, index) => (
          <div key={p.id} className={classes.item} data-index={index}>
            <PhotoCard
              photo={p}
              albumSlug={albumSlug}
              selected={selectedPhotoIds?.has(p.id)}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
