import { Badge, Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { ChevronDownIcon, ChevronUpIcon, FilterIcon } from "lucide-react";
import { z } from "zod";

import { AlbumCard } from "#/components/molecules/AlbumCard";
import { AlbumFilterBar, type AlbumFilters } from "#/components/molecules/AlbumFilterBar";
import { listMyAlbums } from "#/server/albums.ts";

const AlbumsIndexPage = () => {
  const { albums } = Route.useLoaderData();
  const { albums: allAlbums } = useLoaderData({ from: "/admin" });
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false);
  const years = [
    ...new Set(
      allAlbums.flatMap((album) => (album.periodStart ? [album.periodStart.slice(0, 4)] : [])),
    ),
  ].toSorted((a, b) => b.localeCompare(a));
  const appliedCount = [search.q, search.year].filter((value) => value !== undefined).length;

  return (
    <Stack p="xl" gap="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Title order={2}>アルバム</Title>
        <Group gap="sm">
          {appliedCount > 0 && <Badge variant="light">{`${appliedCount} 件の条件`}</Badge>}
          <Button
            variant="default"
            leftSection={<FilterIcon size={16} />}
            rightSection={
              filterOpened ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
            }
            onClick={toggleFilter}
          >
            絞り込む
          </Button>
        </Group>
      </Group>

      <AlbumFilterBar
        filters={search}
        years={years}
        opened={filterOpened}
        appliedCount={appliedCount}
        onChange={(patch: AlbumFilters) => {
          navigate({ replace: true, search: (prev) => ({ ...prev, ...patch }) });
        }}
      />

      {albums.length === 0 ? (
        <Text c="dimmed" size="sm">
          {appliedCount > 0 ? "条件に合うアルバムはありません" : "アルバムはまだありません"}
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, md: 4, sm: 3 }} spacing="md">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};

export const Route = createFileRoute("/admin/albums/")({
  component: AlbumsIndexPage,
  head: () => ({ meta: [{ title: "アルバム | photos.newt239.dev" }] }),
  loader: async ({ deps }: { deps: { q?: string; year?: string } }) => {
    const result = await listMyAlbums({ data: { q: deps.q, year: deps.year } });
    if (!result.success) {
      throw notFound();
    }
    return { albums: result.albums };
  },
  loaderDeps: ({ search }) => ({ q: search.q, year: search.year }),
  validateSearch: z.object({
    q: z.string().max(100).optional(),
    year: z
      .string()
      .regex(/^\d{4}$/)
      .optional(),
  }),
});
