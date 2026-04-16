import { Card, Text } from "@mantine/core";

import classes from "./PhotoCard.module.css";

export type PhotoCardData = {
  readonly id: string;
  readonly title: string | null;
  readonly storageKey: string;
  readonly thumbnailKey: string | null;
  readonly width: number;
  readonly height: number;
};

export const photoImageUrl = (key: string): string => `/api/i/${key}`;

export const PhotoCard = ({ photo }: Readonly<{ photo: PhotoCardData }>) => {
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
