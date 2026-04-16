import { SimpleGrid, Text } from "@mantine/core";

import { PhotoCard, type PhotoCardData } from "./PhotoCard";

export const PhotoGrid = ({
  photos,
  emptyMessage = "写真はまだありません",
}: Readonly<{
  photos: readonly PhotoCardData[];
  emptyMessage?: string;
}>) => {
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
        <PhotoCard key={p.id} photo={p} />
      ))}
    </SimpleGrid>
  );
};
