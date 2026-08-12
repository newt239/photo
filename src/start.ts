import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

// このファイルはクライアントのバンドルにも入るため env.ts のサーバー変数には触れない
const previewClerkKeys = import.meta.env.SSR
  ? {
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY_PREVIEW,
      secretKey: process.env.CLERK_SECRET_KEY_PREVIEW,
    }
  : {};

const securityHeadersMiddleware = createMiddleware({ type: "request" }).server(async ({ next }) => {
  const result = await next();
  // 元の Response はヘッダが immutable な場合があるため作り直してから付与する
  const response = new Response(result.response.body, result.response);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  return { ...result, response };
});

export const startInstance = createStart(() => ({
  requestMiddleware: [
    securityHeadersMiddleware,
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" }),
    clerkMiddleware(previewClerkKeys),
  ],
}));
