import { Group, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { ProfileSection } from "#/components/ProfileSection.tsx";
import { SignOutButton } from "#/components/SignOutButton.tsx";
import { ThemeSection } from "#/components/ThemeSection.tsx";

const SettingsPage = () => (
  <Stack p="xl" gap="xl">
    <Title order={2}>設定</Title>

    <Stack gap="sm">
      <Text fw={600} size="sm">
        プロフィール
      </Text>
      <ProfileSection />
    </Stack>

    <Stack gap="sm">
      <Text fw={600} size="sm">
        カラーテーマ
      </Text>
      <ThemeSection />
    </Stack>

    <Stack gap="sm">
      <Text fw={600} size="sm">
        アカウント
      </Text>
      <Group>
        <SignOutButton />
      </Group>
    </Stack>
  </Stack>
);

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "設定 | photos.newt239.dev" }] }),
});
