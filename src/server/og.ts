import { env } from "cloudflare:workers";
import { ImageResponse, loadGoogleFont } from "workers-og";

const OG_WIDTH = 1200;

const OG_HEIGHT = 630;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

const coverDataUrl = async (storageKey: string) => {
  const object = await env.MY_BUCKET.get(storageKey);
  if (!object) {
    return null;
  }
  // WebP を resvg が読めないため Images バインディングで JPEG に変換する
  const source = await object.blob();
  const transformed = await env.IMAGES.input(source.stream())
    .transform({ fit: "cover", height: OG_HEIGHT, width: OG_WIDTH })
    .output({ format: "image/jpeg", quality: 80 });
  const bytes = new Uint8Array(await transformed.response().arrayBuffer());
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
};

type RenderOgImageInput = {
  title: string;
  description: string | null;
  coverStorageKey: string | null;
};

const renderOgImage = async ({ title, description, coverStorageKey }: RenderOgImageInput) => {
  const heading = truncate(title, 40);
  const subheading = description ? truncate(description, 60) : "";

  const [boldFont, regularFont, cover] = await Promise.all([
    loadGoogleFont({ family: "Noto Sans JP", text: heading, weight: 700 }),
    loadGoogleFont({ family: "Noto Sans JP", text: subheading || "photos", weight: 400 }),
    coverStorageKey ? coverDataUrl(coverStorageKey).catch(() => null) : null,
  ]);

  // タグ間の空白も子ノードとして数えられるため要素を隙間なく連結する
  const html = [
    `<div style="display:flex;position:relative;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;background:#111111;">`,
    cover
      ? `<img src="${cover}" width="${OG_WIDTH}" height="${OG_HEIGHT}" style="position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;object-fit:cover;" /><div style="display:flex;position:absolute;top:0;left:0;width:${OG_WIDTH}px;height:${OG_HEIGHT}px;background:linear-gradient(to bottom, rgba(0,0,0,0) 28%, rgba(0,0,0,0.72) 72%, rgba(0,0,0,0.95) 100%);"></div>`
      : "",
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
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": "image/png",
    "X-Content-Type-Options": "nosniff",
  };
  const cache = await caches.open("og");
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
