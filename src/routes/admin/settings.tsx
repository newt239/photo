import { Group, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { SignOutButton } from "#/components/atoms/SignOutButton";
import { ColorSchemeControl } from "#/components/molecules/ColorSchemeControl";
import { UserProfile } from "#/components/molecules/UserProfile";
import { PlaceholderBackfill } from "#/components/organisms/PlaceholderBackfill";

const SettingsPage = () => (
  <Stack p="xl" gap="xl">
    <Title order={2}>設定</Title>

    <Stack gap="sm">
      <Text fw={600} size="sm">
        プロフィール
      </Text>
      <UserProfile />
    </Stack>

    <Stack gap="sm">
      <Text fw={600} size="sm">
        カラーテーマ
      </Text>
      <ColorSchemeControl />
    </Stack>

    <Stack gap="sm">
      <Text fw={600} size="sm">
        画像のプレースホルダー
      </Text>
      <Text size="sm" c="dimmed">
        公開ページで写真が届くまでに表示するぼかし画像を、未生成の写真に対してまとめて作ります
      </Text>
      <PlaceholderBackfill />
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
