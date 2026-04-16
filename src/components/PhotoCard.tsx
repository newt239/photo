import { Card, Text } from "@mantine/core";

import classes from "./PhotoCard.module.css";

export type PhotoCardData = {
  id: string;
  title: string | null;
  storageKey: string;
  thumbnailKey: string | null;
  width: number;
  height: number;
};

export const photoImageUrl = (key: string): string => {
  return `/api/i/${key}`;
};

export const PhotoCard = ({ photo }: { photo: PhotoCardData }) => {
  const src = photoImageUrl(photo.thumbnailKey ?? photo.storageKey);
  return (
    <Card withBorder radius="md" padding={0} className={classes.card}>
      <div className={classes.thumb} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <img src={src} alt={photo.title ?? ""} loading="lazy" />
      </div>
      {photo.title && (
        <Text className={classes.title} size="sm" truncate px="sm" py="xs">
          {photo.title}
        </Text>
      )}
    </Card>
  );
};
