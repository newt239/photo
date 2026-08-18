export const photoDetailLink = (
  photoId: string,
  albumSlug: string | undefined,
  order: "asc" | "desc",
) =>
  albumSlug === undefined
    ? ({ params: { photoId }, search: { order }, to: "/admin/photos/$photoId" } as const)
    : ({
        params: { photoId, slug: albumSlug },
        search: { order },
        to: "/admin/albums/$slug/photos/$photoId",
      } as const);
