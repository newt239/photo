import { createFileRoute } from '@tanstack/react-router'
import { Paper, Text, Title } from '@mantine/core'
import classes from './about.module.css'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className={classes.main}>
      <Paper withBorder radius="lg" p="xl">
        <Text tt="uppercase" size="xs" fw={700} c="dimmed" mb="xs">
          About
        </Text>
        <Title order={1} mb="md">
          A small starter with room to grow.
        </Title>
        <Text c="dimmed">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </Text>
      </Paper>
    </main>
  )
}
