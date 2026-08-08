// バンドル対象外の Service Worker で Worker のグローバル型が解決できないため無効化する
/* eslint-disable typescript/no-unsafe-argument, typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access, typescript/no-unsafe-return */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "POST" || url.pathname !== "/admin/photos/upload") {
    return;
  }
  event.respondWith(
    (async () => {
      const form = await event.request.formData();
      const files = [];
      for (const value of form.getAll("photos")) {
        if (value instanceof File) {
          files.push(value);
        }
      }
      const cache = await caches.open("share-target");
      await Promise.all(
        files.map((file, index) =>
          cache.put(
            new Request(`/__share/${index}`),
            new Response(file, {
              headers: {
                "content-type": file.type || "application/octet-stream",
                "x-filename": encodeURIComponent(file.name),
              },
            }),
          ),
        ),
      );
      return Response.redirect("/admin/photos/upload", 303);
    })(),
  );
});
