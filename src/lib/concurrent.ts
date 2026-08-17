export const runConcurrently = async <T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) => {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: limit }, async () => {
      for (;;) {
        const item = queue.shift();
        if (item === undefined) {
          return;
        }
        // 同時実行数を抑えるためキューから 1 件ずつ取り出して処理する
        // eslint-disable-next-line no-await-in-loop
        await worker(item);
      }
    }),
  );
};
