import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { fetchAuth } from '#/server/auth.ts'
import { listMyAlbums } from '#/server/albums.ts'
import { AlbumCard } from '#/components/AlbumCard.tsx'

export const Route = createFileRoute('/albums/')({
  beforeLoad: async () => {
    const { userId } = await fetchAuth()
    if (!userId) {
      throw redirect({ to: '/login/$', params: { _splat: '' } })
    }
    return { userId }
  },
  loader: async () => {
    const albums = await listMyAlbums()
    return { albums }
  },
  component: AlbumsIndexPage,
})

function AlbumsIndexPage() {
  const { albums } = Route.useLoaderData()
  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Group justify="space-between">
        <Title order={2}>アルバム</Title>
        <Button component={Link} to="/albums/new">
          新規作成
        </Button>
      </Group>
      {albums.length === 0 ? (
        <Text c="dimmed" size="sm">
          アルバムはまだありません
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  )
}
