import { Button, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";

export const NotFound = () => (
  <Stack p="xl" gap="md" align="flex-start">
    <Stack gap={4}>
      <Title order={2}>ページが見つかりません</Title>
      <Text size="sm" c="dimmed">
        お探しのページは削除されたか、非公開になっている可能性があります
      </Text>
    </Stack>
    <Button variant="default" renderRoot={(props) => <Link {...props} to="/" />}>
      トップページに戻る
    </Button>
  </Stack>
);
