import { useState } from 'react'
import {
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import {
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { fetchAuth } from '#/server/auth.ts'
import { createAlbum } from '#/server/albums.ts'

export const Route = createFileRoute('/albums/new')({
  beforeLoad: async () => {
    const { userId } = await fetchAuth()
    if (!userId) {
      throw redirect({ to: '/login/$', params: { _splat: '' } })
    }
    return { userId }
  },
  component: NewAlbumPage,
})

function NewAlbumPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (title.trim().length === 0 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { slug } = await createAlbum({
        data: {
          title: title.trim(),
          description: description.trim() || null,
          visibility,
        },
      })
      await navigate({ to: '/albums/$slug', params: { slug } })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack p="xl" gap="md" maw={680} mx="auto">
      <Title order={2}>新しいアルバム</Title>
      <Paper withBorder radius="md" p="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="タイトル"
              required
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              maxLength={200}
            />
            <Textarea
              label="説明"
              autosize
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              maxLength={2000}
            />
            <div>
              <SegmentedControl
                value={visibility}
                onChange={(v) => setVisibility(v as 'private' | 'public')}
                data={[
                  { label: '非公開', value: 'private' },
                  { label: '公開', value: 'public' },
                ]}
              />
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <Group justify="flex-end">
              <Button
                type="submit"
                loading={submitting}
                disabled={title.trim().length === 0}
              >
                作成
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}
