import { createFileRoute, redirect } from '@tanstack/react-router'
import { Paper, Stack, Title } from '@mantine/core'
import { fetchAuth } from '#/server/auth.ts'
import { UploadDropzone } from '#/components/UploadDropzone.tsx'

export const Route = createFileRoute('/photos/upload')({
  beforeLoad: async () => {
    const { userId } = await fetchAuth()
    if (!userId) {
      throw redirect({ to: '/login/$', params: { _splat: '' } })
    }
    return { userId }
  },
  component: PhotosUploadPage,
})

function PhotosUploadPage() {
  return (
    <Stack p="xl" gap="md" maw={900} mx="auto">
      <Title order={2}>写真をアップロード</Title>
      <Paper withBorder radius="md" p="lg">
        <UploadDropzone />
      </Paper>
    </Stack>
  )
}
