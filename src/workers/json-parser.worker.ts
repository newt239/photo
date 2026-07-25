import init, {
  count_top_level_keys as countTopLevelKeys,
  init_panic_hook as initPanicHook,
} from "@wasm/json-parser";

import type { CountKeysRequest, CountKeysResponse } from "#/lib/json-parser.ts";

let ready: Promise<void> | null = null;

const ensureReady = async () => {
  ready ??= init().then(() => {
    initPanicHook();
  });
  return ready;
};

self.addEventListener("message", async (event: MessageEvent<CountKeysRequest>) => {
  try {
    await ensureReady();
    const response: CountKeysResponse = {
      ok: true,
      value: countTopLevelKeys(event.data.payload),
    };
    self.postMessage(response);
  } catch (error) {
    const response: CountKeysResponse = {
      error: error instanceof Error ? error.message : String(error),
      ok: false,
    };
    self.postMessage(response);
  }
});
