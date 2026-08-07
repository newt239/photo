import { SimpleGrid, Text } from "@mantine/core";

import { PhotoCard, type PhotoCardData } from "./PhotoCard";

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
    <SimpleGrid cols={{ base: 2, md: 4, sm: 3 }} spacing="md">
      {photos.map((p) => (
        <PhotoCard
          key={p.id}
          photo={p}
          albumSlug={albumSlug}
          selected={selectedPhotoIds?.has(p.id)}
          onSelect={onSelect}
        />
      ))}
    </SimpleGrid>
  );
};
