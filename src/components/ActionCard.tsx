import { Card, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

export const ActionCard = ({
  to,
  title,
  description,
}: {
  to: "/admin/photos/upload" | "/admin/albums/new" | "/admin/settings";
  title: string;
  description: string;
}) => (
  <Card component={Link} to={to} withBorder radius="md" padding="md" style={{ height: "100%" }}>
    <Text fw={600} mb={4}>
      {title}
    </Text>
    <Text size="sm" c="dimmed">
      {description}
    </Text>
  </Card>
);
