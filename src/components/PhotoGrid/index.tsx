import { Text } from "@mantine/core";

import { PhotoCard, type PhotoCardData } from "#/components/PhotoCard";
import { useMasonryColumns } from "#/lib/use-masonry-columns.ts";

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
  const { columns, ref } = useMasonryColumns(240);

  if (photos.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {emptyMessage}
      </Text>
    );
  }
  return (
    <div className={classes.masonry} ref={ref}>
      {Array.from({ length: columns }, (_, column) => (
        <div key={column} className={classes.column}>
          {photos.map((p, i) =>
            i % columns === column ? (
              <PhotoCard
                key={p.id}
                photo={p}
                albumSlug={albumSlug}
                selected={selectedPhotoIds?.has(p.id)}
                onSelect={onSelect}
              />
            ) : null,
          )}
        </div>
      ))}
    </div>
  );
};
