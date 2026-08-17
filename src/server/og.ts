import { ImageResponse, loadGoogleFont } from "workers-og";

import { jpegDataUrl } from "#/server/image-source.ts";

const OG_WIDTH = 1200;

const OG_HEIGHT = 630;

const TILE_COLUMNS = 4;

const TILE_ROWS = 2;

const TILE_WIDTH = OG_WIDTH / TILE_COLUMNS;

const TILE_HEIGHT = OG_HEIGHT / TILE_ROWS;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

type RenderOgImageInput = {
  title: string;
  subheading: string | null;
  coverStorageKeys: string[];
};

const renderOgImage = async ({ title, subheading: sub, coverStorageKeys }: RenderOgImageInput) => {
  const heading = title.length > 40 ? `${title.slice(0, 40)}…` : title;
  const subheading = sub && sub.length > 60 ? `${sub.slice(0, 60)}…` : (sub ?? "");
  const tiled = coverStorageKeys.length > 1;

  const [boldFont, regularFont, covers] = await Promise.all([
    loadGoogleFont({ family: "Noto Sans JP", text: heading, weight: 700 }),
    loadGoogleFont({ family: "Noto Sans JP", text: subheading || "photos", weight: 400 }),
    Promise.all(
      coverStorageKeys.map((storageKey) =>
        jpegDataUrl(storageKey, {
          fit: "cover",
          height: tiled ? TILE_HEIGHT : OG_HEIGHT,
          width: tiled ? TILE_WIDTH : OG_WIDTH,
        }),
      ),
    ),
  ]);
  const sources = covers.filter((source) => source !== null);

  const tiles =
    tiled && sources.length > 0
      ? Array.from(
          { length: TILE_COLUMNS * TILE_ROWS },
          (_, index) => sources[index % sources.length],
        )
      : [];

  // タグ間の空白も子ノードとして数えられるため要素を隙間なく連結する
  const html = [
    `<div style="display:flex;position:relative;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;background:#111111;">`,
    sources.length === 0
      ? ""
      : tiled
        ? [
            `<div style="display:flex;flex-wrap:wrap;position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;">`,
            ...tiles.map(
              (tile) =>
                `<img src="${tile}" width="${TILE_WIDTH}" height="${TILE_HEIGHT}" style="width:${TILE_WIDTH}px;height:${TILE_HEIGHT}px;object-fit:cover;" />`,
            ),
            `</div>`,
            `<div style="display:flex;position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;background:linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.62) 60%, rgba(0,0,0,0.9) 100%);"></div>`,
          ].join("")
        : `<img src="${sources[0]}" width="${OG_WIDTH}" height="${OG_HEIGHT}" style="position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;object-fit:cover;" /><div style="display:flex;position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;background:linear-gradient(to bottom, rgba(0,0,0,0) 28%, rgba(0,0,0,0.72) 72%, rgba(0,0,0,0.95) 100%);"></div>`,
    `<div style="display:flex;flex-direction:column;position:absolute;left:72px;bottom:64px;width:${OG_WIDTH - 144}px;">`,
    `<div style="display:flex;font-family:'Noto Sans JP';font-weight:700;font-size:64px;line-height:1.25;color:#ffffff;">${escapeHtml(heading)}</div>`,
    subheading
      ? `<div style="display:flex;font-family:'Noto Sans JP';font-weight:400;font-size:30px;color:rgba(255,255,255,0.85);margin-top:18px;">${escapeHtml(subheading)}</div>`
      : "",
    `</div>`,
    `</div>`,
  ].join("");

  return new ImageResponse(html, {
    fonts: [
      { data: boldFont, name: "Noto Sans JP", style: "normal", weight: 700 },
      { data: regularFont, name: "Noto Sans JP", style: "normal", weight: 400 },
    ],
    height: OG_HEIGHT,
    width: OG_WIDTH,
  });
};

export const ogImageResponse = async (request: Request, input: RenderOgImageInput) => {
  const headers = {
    "Cache-Control": "public, max-age=86400",
    "Content-Type": "image/png",
    "X-Content-Type-Options": "nosniff",
  };
  const cache = await caches.open("og-image");
  const cached = await cache.match(request);
  // キャッシュとキャッシュに入れた Response はヘッダーが不変になり後段のミドルウェアが失敗する
  if (cached) {
    return new Response(await cached.arrayBuffer(), { headers });
  }

  const generated = await renderOgImage(input);
  const png = await generated.arrayBuffer();
  await cache.put(request, new Response(png, { headers }));
  return new Response(png, { headers });
};
