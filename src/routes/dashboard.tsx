import { Paper, Stack, Text, Title } from "@mantine/core";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { fetchAuth } from "../server/auth";

const DashboardPage = () => {
  const { userId } = Route.useLoaderData();
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
  );
};

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ params: { _splat: "" }, to: "/login/$" });
    }
    return { userId };
  },
  component: DashboardPage,
  loader: ({ context }) => ({ userId: context.userId }),
});
