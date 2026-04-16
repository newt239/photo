import { Anchor } from "@mantine/core";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { PhotoDetailView } from "#/components/PhotoDetailView.tsx";
import { fetchAuth } from "#/server/auth.ts";
import { getPhoto } from "#/server/photos.ts";

type PhotoDetail = Awaited<ReturnType<typeof getPhoto>>;

const PhotoDetailPage = () => {
  const photo = Route.useLoaderData();
  return (
    <PhotoDetailView
      photo={photo}
      backLink={
        <Anchor component={Link} to="/photos" size="sm">
          ← 写真一覧に戻る
        </Anchor>
      }
    />
  );
};

export const Route = createFileRoute("/photos/$photoId")({
  beforeLoad: async () => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ params: { _splat: "" }, to: "/login/$" });
    }
    return { userId };
  },
  component: PhotoDetailPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "写真"} | Photo` }],
  }),
  loader: async ({
    params,
  }: {
    readonly params: { readonly photoId: string };
  }): Promise<PhotoDetail> => getPhoto({ data: { id: params.photoId } }),
});
