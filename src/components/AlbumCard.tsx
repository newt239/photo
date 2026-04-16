import { Card, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import classes from "./AlbumCard.module.css";
import { photoImageUrl } from "./PhotoCard";

export type AlbumCardData = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  visibility: "public" | "private";
  coverThumbnailKey: string | null;
  coverStorageKey: string | null;
  photoCount: number;
};

export const AlbumCard = ({ album }: { album: AlbumCardData }) => {
  const coverKey = album.coverThumbnailKey ?? album.coverStorageKey;
  return (
    <Link to="/albums/$slug" params={{ slug: album.slug }} className={classes.link}>
      <Card withBorder radius="md" padding={0} className={classes.card}>
        <div className={classes.cover}>
          {coverKey ? (
            <img src={photoImageUrl(coverKey)} alt="" loading="lazy" />
          ) : (
            <div className={classes.placeholder}>
              <Text size="xs" c="dimmed">
                No cover
              </Text>
            </div>
          )}
        </div>
        <Stack gap={2} px="sm" py="xs">
          <Text fw={600} truncate>
            {album.title ?? "(無題)"}
          </Text>
          <Text size="xs" c="dimmed">
            {album.photoCount} 枚・
            {album.visibility === "public" ? "公開" : "非公開"}
          </Text>
        </Stack>
      </Card>
    </Link>
  );
};
