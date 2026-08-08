import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import leafletCss from "leaflet/dist/leaflet.css?url";

import { Notice } from "#/components/atoms/Notice";
import { PhotoMap } from "#/components/organisms/PhotoMap";

const PublicAlbumMapPage = () => {
  const { photos } = useLoaderData({ from: "/albums/$slug" });
  const geotagged = photos.flatMap((p) =>
    p.latitude === null || p.longitude === null
      ? []
      : [{ ...p, latitude: p.latitude, longitude: p.longitude }],
  );

  if (geotagged.length === 0) {
    return <Notice>位置情報のある写真がありません</Notice>;
  }
  return <PhotoMap photos={geotagged} />;
};

export const Route = createFileRoute("/albums/$slug/map")({
  component: PublicAlbumMapPage,
  head: () => ({
    links: [{ href: leafletCss, rel: "stylesheet" }],
  }),
});
