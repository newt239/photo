export const photoDetailLink = (photoId: string, albumSlug?: string) =>
  albumSlug === undefined
    ? ({ params: { photoId }, to: "/admin/photos/$photoId" } as const)
    : ({
        params: { photoId, slug: albumSlug },
        to: "/admin/albums/$slug/photos/$photoId",
      } as const);
