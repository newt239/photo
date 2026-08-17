import { Text } from "@mantine/core";

import { PhotoCard, type PhotoCardData } from "#/components/molecules/PhotoCard";
import { masonryStyle } from "#/lib/masonry.ts";

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
  const positions = masonryStyle(photos, [1, 2, 3, 4, 5, 6, 7, 8], {
    canvas: classes.canvas,
    gap: true,
    item: classes.item,
  });

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
