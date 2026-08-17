import { Group, Pagination, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { z } from "zod";

import { FilterHeader } from "#/components/molecules/FilterHeader";
import { PhotoFilterBar, type PhotoFilters } from "#/components/molecules/PhotoFilterBar";
import { PhotoLibrary } from "#/components/organisms/PhotoLibrary";
import { listCameraModels, listMyPhotos } from "#/server/photo-list.ts";

const AdminIndexPage = () => {
  const { cameras, photos, total } = Route.useLoaderData();
  const { albums } = useLoaderData({ from: "/admin" });
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false);
  const { order, page, perPage, view } = search;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const changeFilters = (patch: PhotoFilters) => {
    navigate({ replace: true, search: (prev) => ({ ...prev, ...patch, page: 1 }) });
  };
  const appliedCount = [
    search.album,
    search.camera,
    search.geo,
    search.missing,
    search.month,
    search.q,
  ].filter((value) => value !== undefined).length;

  return (
    <Stack p="xl" gap="md">
      <FilterHeader
        title="写真"
        appliedCount={appliedCount}
        opened={filterOpened}
        onToggle={toggleFilter}
      />

      <PhotoFilterBar
        filters={search}
        albums={albums}
        cameras={cameras}
        opened={filterOpened}
        appliedCount={appliedCount}
        onChange={changeFilters}
      />

      <PhotoLibrary
        photos={photos}
        albums={albums}
        order={order}
        view={view}
        onOrderChange={(next) => {
          navigate({ replace: true, search: (prev) => ({ ...prev, order: next, page: 1 }) });
        }}
        onViewChange={(next) => {
          navigate({ replace: true, search: (prev) => ({ ...prev, view: next }) });
        }}
        emptyMessage={total === 0 ? "条件に合う写真はありません" : undefined}
      />

      {total > 0 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {`${total} 枚中 ${from}〜${to} 枚`}
          </Text>
          <Pagination
            total={Math.ceil(total / perPage)}
            value={page}
            onChange={(next) => {
              navigate({ search: (prev) => ({ ...prev, page: next }) });
            }}
          />
        </Group>
      )}
    </Stack>
  );
};

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
  head: () => ({ meta: [{ title: "写真 | photos.newt239.dev" }] }),
  loader: async ({
    deps,
  }: {
    deps: {
      album?: string;
      camera?: string;
      geo?: "with" | "without";
      missing?: "caption" | "alt";
      month?: string;
      order: "asc" | "desc";
      page: number;
      perPage: number;
      q?: string;
    };
  }) => {
    const [result, cameras] = await Promise.all([
      listMyPhotos({
        data: {
          album: deps.album,
          camera: deps.camera,
          geo: deps.geo,
          limit: deps.perPage,
          missing: deps.missing,
          month: deps.month,
          offset: (deps.page - 1) * deps.perPage,
          order: deps.order,
          q: deps.q,
        },
      }),
      listCameraModels(),
    ]);
    if (!result.success) {
      throw notFound();
    }
    return { cameras, photos: result.photos, total: result.total };
  },
  loaderDeps: ({ search }) => ({
    album: search.album,
    camera: search.camera,
    geo: search.geo,
    missing: search.missing,
    month: search.month,
    order: search.order,
    page: search.page,
    perPage: search.perPage,
    q: search.q,
  }),
  validateSearch: z.object({
    album: z.string().optional(),
    camera: z.string().optional(),
    geo: z.enum(["with", "without"]).optional(),
    missing: z.enum(["caption", "alt"]).optional(),
    month: z
      .string()
      .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/)
      .optional(),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.number().int().min(1).catch(1).default(1),
    perPage: z.number().int().min(12).max(200).catch(60).default(60),
    q: z.string().max(100).optional(),
    view: z.enum(["grid", "table"]).default("grid"),
  }),
});
