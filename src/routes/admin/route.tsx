import { AppShell, Burger, Divider, Group, NavLink, ScrollArea, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Outlet, createFileRoute, redirect, useMatchRoute } from "@tanstack/react-router";

import { listMyAlbums } from "#/server/albums.ts";
import { fetchAuth } from "#/server/auth.ts";

const AdminLayout = () => {
  const { albums } = Route.useLoaderData();
  const [opened, { toggle, close }] = useDisclosure(false);
  const matchRoute = useMatchRoute();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ breakpoint: "sm", collapsed: { mobile: !opened }, width: 240 }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text component={Link} to="/admin" fw={700} c="inherit" td="none">
            photos.newt239.dev
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section py="xs">
          <NavLink
            component={Link}
            to="/admin"
            activeOptions={{ exact: true }}
            label="すべての写真"
            active={Boolean(matchRoute({ to: "/admin" }))}
            onClick={close}
          />
        </AppShell.Section>

        <Divider />

        <AppShell.Section grow component={ScrollArea} py="xs">
          <Group justify="space-between" px="md" pb={4} wrap="nowrap">
            <Text size="xs" fw={600} c="dimmed">
              アルバム
            </Text>
            <Text component={Link} to="/admin/albums" size="xs" c="blue" onClick={close}>
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
                active={Boolean(
                  matchRoute({ params: { slug: album.slug }, to: "/admin/albums/$slug" }),
                )}
                onClick={close}
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
            active={Boolean(matchRoute({ to: "/admin/photos/upload" }))}
            onClick={close}
          />
          <NavLink
            component={Link}
            to="/admin/albums/new"
            label="アルバムを作成する"
            active={Boolean(matchRoute({ to: "/admin/albums/new" }))}
            onClick={close}
          />
          <NavLink
            component={Link}
            to="/admin/photos/geotag"
            label="位置情報を設定する"
            active={Boolean(matchRoute({ to: "/admin/photos/geotag" }))}
            onClick={close}
          />
          <Divider my="xs" />
          <NavLink
            component={Link}
            to="/admin/settings"
            label="設定"
            active={Boolean(matchRoute({ to: "/admin/settings" }))}
            onClick={close}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ params: { _splat: "" }, to: "/login/$" });
    }
    return { userId };
  },
  component: AdminLayout,
  loader: async () => ({
    albums: await listMyAlbums({ data: {} }),
  }),
});
