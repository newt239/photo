import { Card, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import classes from "./PhotoCard.module.css";

export type PhotoCardData = {
  id: string;
  caption: string | null;
  alt: string | null;
  storageKey: string;
  thumbnailKey: string | null;
  width: number;
  height: number;
};

type PhotoCardProps = {
  photo: PhotoCardData;
  albumSlug?: string;
};

export const PhotoCard = ({ photo, albumSlug }: PhotoCardProps) => {
  const key = photo.thumbnailKey ?? photo.storageKey;
  const src = `/api/i/${key.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/")}`;
  const card = (
    <Card withBorder radius="md" padding={0} className={classes.card}>
      <div className={classes.thumb} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <img src={src} alt={photo.alt ?? photo.caption ?? ""} loading="lazy" />
      </div>
      {photo.caption && (
        <Text className={classes.caption} size="sm" truncate px="sm" py="xs">
          {photo.caption}
        </Text>
      )}
    </Card>
  );
  return albumSlug === undefined ? (
    <Link to="/admin/photos/$photoId" params={{ photoId: photo.id }} className={classes.link}>
      {card}
    </Link>
  ) : (
    <Link
      to="/admin/albums/$slug/photos/$photoId"
      params={{ photoId: photo.id, slug: albumSlug }}
      className={classes.link}
    >
      {card}
    </Link>
  );
};
