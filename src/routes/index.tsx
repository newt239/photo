import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Group, List, Paper, Text, Title } from '@mantine/core'
import classes from './index.module.css'

export const Route = createFileRoute('/')({ component: App })

const FEATURES: Array<[string, string]> = [
  ['Type-Safe Routing', 'Routes and links stay in sync across every page.'],
  [
    'Server Functions',
    'Call server code from your UI without creating API boilerplate.',
  ],
  [
    'Streaming by Default',
    'Ship progressively rendered responses for faster experiences.',
  ],
  [
    'CSS Modules',
    'Style components with scoped CSS Modules for simple maintenance.',
  ],
]

function App() {
  return (
    <main className={classes.main}>
      <Paper withBorder radius="lg" p="xl" className={classes.hero}>
        <Text tt="uppercase" size="xs" fw={700} c="dimmed" mb="xs">
          TanStack Start Base Template
        </Text>
        <Title order={1} mb="md">
          Start simple, ship quickly.
        </Title>
        <Text mb="lg" c="dimmed">
          This base starter intentionally keeps things light: two routes, clean
          structure, and the essentials you need to build from scratch.
        </Text>
        <Group>
          <Button component="a" href="/about">
            About This Starter
          </Button>
          <Button
            component="a"
            href="https://tanstack.com/router"
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
          >
            Router Guide
          </Button>
        </Group>
      </Paper>

      <section className={classes.grid}>
        {FEATURES.map(([title, desc]) => (
          <Card key={title} withBorder radius="md" padding="md">
            <Text fw={600} mb="xs">
              {title}
            </Text>
            <Text size="sm" c="dimmed">
              {desc}
            </Text>
          </Card>
        ))}
      </section>

      <Paper withBorder radius="lg" p="lg">
        <Text tt="uppercase" size="xs" fw={700} c="dimmed" mb="xs">
          Quick Start
        </Text>
        <List size="sm" c="dimmed">
          <List.Item>
            Edit <code>src/routes/index.tsx</code> to customize the home page.
          </List.Item>
          <List.Item>
            Update <code>src/components/Header.tsx</code> and{' '}
            <code>src/components/Footer.tsx</code> for brand links.
          </List.Item>
          <List.Item>
            Add routes in <code>src/routes</code> and styles via CSS Modules.
          </List.Item>
        </List>
      </Paper>
    </main>
  )
}
