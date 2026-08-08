import {
  Outlet,
  createFileRoute,
  notFound,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";

import { AlbumViewerControls } from "#/components/organisms/AlbumViewerControls";
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
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.album.title ?? "アルバム"} | photos.newt239.dev` }],
  }),
  loader: async ({ params }: { params: { slug: string } }) => {
    const result = await getPublicAlbumBySlug({ data: { slug: params.slug } });
    if (!result) {
      throw notFound();
    }
    return result;
  },
  validateSearch: z.object({ size: z.number().int().min(1).max(12).default(3) }),
});
