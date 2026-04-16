import { createFileRoute, redirect } from '@tanstack/react-router'
import { Paper, Stack, Text, Title } from '@mantine/core'
import { fetchAuth } from '../server/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { userId } = await fetchAuth()
    if (!userId) {
      throw redirect({ to: '/login/$', params: { _splat: '' } })
    }
    return { userId }
  },
  loader: ({ context }) => ({ userId: context.userId }),
  component: DashboardPage,
})

function DashboardPage() {
  const { userId } = Route.useLoaderData()
  return (
    <Stack p="xl" gap="md">
      <Title order={2}>Dashboard</Title>
      <Paper withBorder radius="md" p="lg">
        <Text size="sm" c="dimmed">
          Signed in as
        </Text>
        <Text ff="monospace">{userId}</Text>
      </Paper>
    </Stack>
  )
}
