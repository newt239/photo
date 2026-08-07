import { Text } from "@mantine/core";

import { PhotoCard, type PhotoCardData } from "./PhotoCard";
import classes from "./PhotoGrid.module.css";

export const PhotoGrid = ({
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
  onSelect?: (photoId: string) => void;
}) => {
  if (photos.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {emptyMessage}
      </Text>
    );
  }
  return (
    <div className={classes.masonry}>
      {photos.map((p) => (
        <div key={p.id} className={classes.item}>
          <PhotoCard
            photo={p}
            albumSlug={albumSlug}
            selected={selectedPhotoIds?.has(p.id)}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
};
