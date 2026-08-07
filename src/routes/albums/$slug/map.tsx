import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";

import { PublicAlbumMap } from "#/components/PublicAlbumMap";
import { PublicNotice } from "#/components/PublicNotice";

const PublicAlbumMapPage = () => {
  const { photos } = useLoaderData({ from: "/albums/$slug" });
  const geotagged = photos.flatMap((p) =>
    p.latitude === null || p.longitude === null
      ? []
      : [{ ...p, latitude: p.latitude, longitude: p.longitude }],
  );

  if (geotagged.length === 0) {
    return <PublicNotice>位置情報のある写真がありません</PublicNotice>;
  }
  return <PublicAlbumMap photos={geotagged} />;
};

export const Route = createFileRoute("/albums/$slug/map")({
  component: PublicAlbumMapPage,
  head: () => ({
    links: [{ href: leafletCss, rel: "stylesheet" }],
  }),
});
