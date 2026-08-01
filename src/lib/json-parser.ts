export type CountKeysRequest = { payload: string; type: "countKeys" };

export type CountKeysResponse = { ok: true; value: number } | { error: string; ok: false };
