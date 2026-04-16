import { useMemo, useState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { fetchAuth } from '#/server/auth.ts'
import { getAlbumBySlug } from '#/server/albums.ts'
import { PhotoCard } from '#/components/PhotoCard.tsx'
import { AddPhotosToAlbumModal } from '#/components/AddPhotosToAlbumModal.tsx'

export const Route = createFileRoute('/albums/$slug')({
  beforeLoad: async () => {
    const { userId } = await fetchAuth()
    if (!userId) {
      throw redirect({ to: '/login/$', params: { _splat: '' } })
    }
    return { userId }
  },
  loader: async ({ params }) => {
    const data = await getAlbumBySlug({ data: { slug: params.slug } })
    return data
  },
  component: AlbumDetailPage,
})

function AlbumDetailPage() {
  const { album, photos } = Route.useLoaderData()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const existingIds = useMemo(
    () => new Set(photos.map((p) => p.id)),
    [photos],
  )

  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Stack gap={4}>
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>{album.title ?? '(無題)'}</Title>
            <Group gap="xs">
              <Badge variant="light">
                {album.visibility === 'public' ? '公開' : '非公開'}
              </Badge>
              <Text size="sm" c="dimmed">
                {photos.length} 枚
              </Text>
            </Group>
          </Stack>
          <Button onClick={() => setModalOpen(true)}>写真を追加</Button>
        </Group>
        {album.description && (
          <Text size="sm" c="dimmed">
            {album.description}
          </Text>
        )}
      </Stack>

      {photos.length === 0 ? (
        <Text c="dimmed" size="sm">
          このアルバムにはまだ写真がありません
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          {photos.map((p) => (
            <PhotoCard
              key={p.id}
              photo={{
                id: p.id,
                title: p.title,
                storageKey: p.storageKey,
                thumbnailKey: p.thumbnailKey,
                width: p.width,
                height: p.height,
              }}
            />
          ))}
        </SimpleGrid>
      )}

      <AddPhotosToAlbumModal
        albumId={album.id}
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        existingPhotoIds={existingIds}
        onAdded={() => router.invalidate()}
      />
    </Stack>
  )
}
