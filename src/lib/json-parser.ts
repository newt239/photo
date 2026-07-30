export type CountKeysRequest = { payload: string; type: "countKeys" };

export type CountKeysResponse = { ok: true; value: number } | { error: string; ok: false };

export const createJsonParserWorker = () =>
  new Worker(new URL("../workers/json-parser.worker.ts", import.meta.url), { type: "module" });

export const countTopLevelKeys = async (worker: Worker, text: string) =>
  new Promise<number>((resolve, reject) => {
    const handleMessage = (event: MessageEvent<CountKeysResponse>) => {
      worker.removeEventListener("error", handleError);
      if (event.data.ok) {
        resolve(event.data.value);
      } else {
        reject(new Error(event.data.error));
      }
    };
    const handleError = (event: ErrorEvent) => {
      worker.removeEventListener("message", handleMessage);
      reject(new Error(event.message));
    };

    worker.addEventListener("message", handleMessage, { once: true });
    worker.addEventListener("error", handleError, { once: true });

    const request: CountKeysRequest = { payload: text, type: "countKeys" };
    worker.postMessage(request);
  });
