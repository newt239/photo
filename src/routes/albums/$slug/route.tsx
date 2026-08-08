import {
  Outlet,
  createFileRoute,
  notFound,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";

import { AlbumViewerControls } from "#/components/organisms/AlbumViewerControls";
import { env } from "#/env.ts";
import { getPublicAlbumBySlug } from "#/server/public.ts";

const PublicAlbumLayout = () => {
  const { album, photos } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { size } = Route.useSearch();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const mode = matchRoute({ params: { slug }, to: "/albums/$slug/map" }) ? "map" : "photo";

  return (
    <>
      <main id="main">
        <Outlet />
      </main>
      <AlbumViewerControls
        title={album.title}
        description={album.description}
        hasGeotagged={photos.some((p) => p.latitude !== null && p.longitude !== null)}
        mode={mode}
        size={size}
        onModeChange={(next) => {
          navigate({
            params: { slug },
            search: (prev) => prev,
            to: next === "map" ? "/albums/$slug/map" : "/albums/$slug",
          });
        }}
        onSizeChange={(next) => {
          navigate({
            params: { slug },
            replace: true,
            search: (prev) => ({ ...prev, size: next }),
            to: "/albums/$slug",
          });
        }}
      />
    </>
  );
};

export const Route = createFileRoute("/albums/$slug")({
  component: PublicAlbumLayout,
  head: ({ loaderData, params }) => {
    const title = loaderData?.album.title ?? "アルバム";
    const url = `${env.VITE_SITE_URL}/albums/${encodeURIComponent(params.slug)}`;
    const version = loaderData ? new Date(loaderData.album.updatedAt).getTime() : 0;
    return {
      meta: [
        { title: `${title} | photos.newt239.dev` },
        { content: title, property: "og:title" },
        { content: url, property: "og:url" },
        {
          content: `${env.VITE_SITE_URL}/api/og/albums/${encodeURIComponent(params.slug)}?v=${version}`,
          property: "og:image",
        },
        ...(loaderData?.album.description
          ? [
              { content: loaderData.album.description, name: "description" },
              { content: loaderData.album.description, property: "og:description" },
            ]
          : []),
      ],
    };
  },
  loader: async ({ params }: { params: { slug: string } }) => {
    const result = await getPublicAlbumBySlug({ data: { slug: params.slug } });
    if (!result) {
      throw notFound();
    }
    return result;
  },
  validateSearch: z.object({ size: z.number().int().min(1).max(12).optional() }),
});
