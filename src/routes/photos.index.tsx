import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button, Group, Stack, Title } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { fetchAuth } from '#/server/auth.ts'
import { listMyPhotos } from '#/server/photos.ts'
import { PhotoGrid } from '#/components/PhotoGrid.tsx'

export const Route = createFileRoute('/photos/')({
  beforeLoad: async () => {
    const { userId } = await fetchAuth()
    if (!userId) {
      throw redirect({ to: '/login/$', params: { _splat: '' } })
    }
    return { userId }
  },
  loader: async () => {
    const photos = await listMyPhotos()
    return { photos }
  },
  component: PhotosIndexPage,
})

function PhotosIndexPage() {
  const { photos } = Route.useLoaderData()
  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Group justify="space-between">
        <Title order={2}>写真</Title>
        <Button component={Link} to="/photos/upload">
          アップロード
        </Button>
      </Group>
      <PhotoGrid photos={photos} />
    </Stack>
  )
}
