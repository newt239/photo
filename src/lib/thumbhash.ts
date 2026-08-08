import { rgbaToThumbHash } from "thumbhash";

export const encodeThumbHash = async (source: Blob) => {
  try {
    const bitmap = await createImageBitmap(source);
    const scale = Math.min(100 / bitmap.width, 100 / bitmap.height, 1);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const hash = rgbaToThumbHash(width, height, context.getImageData(0, 0, width, height).data);
    return btoa(String.fromCodePoint(...hash));
  } catch {
    // プレースホルダーが無くても表示は壊れないため失敗は握りつぶす
    return null;
  }
};
