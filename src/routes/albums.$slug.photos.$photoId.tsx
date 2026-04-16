import { Anchor } from "@mantine/core";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { PhotoDetailView } from "#/components/PhotoDetailView.tsx";
import { fetchAuth } from "#/server/auth.ts";
import { getPhoto } from "#/server/photos.ts";

type PhotoDetail = Awaited<ReturnType<typeof getPhoto>>;

const AlbumPhotoDetailPage = () => {
  const photo = Route.useLoaderData();
  const { slug } = Route.useParams();
  return (
    <PhotoDetailView
      photo={photo}
      backLink={
        <Anchor
          size="sm"
          renderRoot={(props) => <Link {...props} to="/albums/$slug" params={{ slug }} />}
        >
          ← アルバムに戻る
        </Anchor>
      }
    />
  );
};

export const Route = createFileRoute("/albums/$slug/photos/$photoId")({
  beforeLoad: async () => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ params: { _splat: "" }, to: "/login/$" });
    }
    return { userId };
  },
  component: AlbumPhotoDetailPage,
  loader: async ({
    params,
  }: {
    readonly params: { readonly slug: string; readonly photoId: string };
  }): Promise<PhotoDetail> => getPhoto({ data: { id: params.photoId } }),
});
