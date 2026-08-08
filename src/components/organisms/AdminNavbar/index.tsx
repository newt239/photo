import { AppShell, Divider, Group, NavLink, ScrollArea, Text } from "@mantine/core";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  FolderIcon,
  FolderPlusIcon,
  ImagesIcon,
  MapPinIcon,
  SettingsIcon,
  UploadIcon,
} from "lucide-react";

type AdminNavbarProps = {
  albums: { id: string; slug: string; title: string | null }[];
  onNavigate: () => void;
};

export const AdminNavbar = ({ albums, onNavigate }: AdminNavbarProps) => {
  const matchRoute = useMatchRoute();

  return (
    <AppShell.Navbar>
      <AppShell.Section py="xs">
        <NavLink
          component={Link}
          to="/admin"
          activeOptions={{ exact: true }}
          label="すべての写真"
          leftSection={<ImagesIcon size={16} />}
          active={Boolean(matchRoute({ to: "/admin" }))}
          onClick={onNavigate}
        />
      </AppShell.Section>

      <Divider />

      <AppShell.Section grow component={ScrollArea} py="xs">
        <Group justify="space-between" px="md" pb={4} wrap="nowrap">
          <Text size="xs" fw={600} c="dimmed">
            アルバム
          </Text>
          <Text component={Link} to="/admin/albums" size="xs" c="blue" onClick={onNavigate}>
            一覧
          </Text>
        </Group>
        {albums.length === 0 ? (
          <Text size="xs" c="dimmed" px="md">
            アルバムはまだありません
          </Text>
        ) : (
          albums.map((album) => (
            <NavLink
              key={album.id}
              renderRoot={(props) => (
                <Link {...props} to="/admin/albums/$slug" params={{ slug: album.slug }} />
              )}
              label={album.title ?? "(無題)"}
              leftSection={<FolderIcon size={16} />}
              active={Boolean(
                matchRoute({ params: { slug: album.slug }, to: "/admin/albums/$slug" }),
              )}
              onClick={onNavigate}
            />
          ))
        )}
      </AppShell.Section>

      <Divider />

      <AppShell.Section py="xs">
        <NavLink
          component={Link}
          to="/admin/photos/upload"
          label="写真をアップロードする"
          leftSection={<UploadIcon size={16} />}
          active={Boolean(matchRoute({ to: "/admin/photos/upload" }))}
          onClick={onNavigate}
        />
        <NavLink
          component={Link}
          to="/admin/albums/new"
          label="アルバムを作成する"
          leftSection={<FolderPlusIcon size={16} />}
          active={Boolean(matchRoute({ to: "/admin/albums/new" }))}
          onClick={onNavigate}
        />
        <NavLink
          component={Link}
          to="/admin/photos/geotag"
          label="位置情報を設定する"
          leftSection={<MapPinIcon size={16} />}
          active={Boolean(matchRoute({ to: "/admin/photos/geotag" }))}
          onClick={onNavigate}
        />
        <Divider my="xs" />
        <NavLink
          component={Link}
          to="/admin/settings"
          label="設定"
          leftSection={<SettingsIcon size={16} />}
          active={Boolean(matchRoute({ to: "/admin/settings" }))}
          onClick={onNavigate}
        />
      </AppShell.Section>
    </AppShell.Navbar>
  );
};
