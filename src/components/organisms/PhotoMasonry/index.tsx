import { Text } from "@mantine/core";

import { PhotoCard, type PhotoCardData } from "#/components/molecules/PhotoCard";
import { masonryLayout, useContainerWidth } from "#/lib/masonry.ts";

import classes from "./PhotoMasonry.module.css";

const GAP = "var(--mantine-spacing-md)";

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
  const { ref, width } = useContainerWidth();
  const columns = width === 0 ? 4 : Math.max(1, Math.floor(width / 240));
  const layout = masonryLayout(photos, columns);
  const columnWidth = `((100cqw - ${columns - 1} * ${GAP}) / ${columns})`;

  if (photos.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {emptyMessage}
      </Text>
    );
  }
  return (
    <div className={classes.masonry} ref={ref}>
      <div
        className={classes.canvas}
        style={{
          height: `calc(${columnWidth} * ${layout.totalHeight} + ${GAP} * ${Math.max(0, layout.totalRows - 1)})`,
        }}
      >
        {layout.items.map((p) => (
          <div
            key={p.id}
            className={classes.item}
            style={{
              left: `calc((${columnWidth} + ${GAP}) * ${p.column})`,
              top: `calc(${columnWidth} * ${p.top} + ${GAP} * ${p.rowsAbove})`,
              width: `calc(${columnWidth})`,
            }}
          >
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
