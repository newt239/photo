const masonryLayout = <T extends { height: number; width: number }>(
  items: T[],
  columns: number,
) => {
  const lanes = Array.from({ length: Math.max(1, columns) }, () => ({ count: 0, height: 0 }));
  const placed = items.map((item) => {
    let [lane] = lanes;
    for (const candidate of lanes) {
      if (candidate.height < lane.height) {
        lane = candidate;
      }
    }
    const position = { column: lanes.indexOf(lane), rowsAbove: lane.count, top: lane.height };
    lane.count += 1;
    lane.height += item.height / item.width;
    return { ...item, ...position };
  });

  return {
    items: placed,
    totalHeight: Math.max(...lanes.map((lane) => lane.height)),
    totalRows: Math.max(...lanes.map((lane) => lane.count)),
  };
};

// 列数は CSS のコンテナクエリで決まるため候補ごとの位置を CSS カスタムプロパティとして先に配る
// 行数は行間に余白を持つ一覧だけが必要とするため gap を渡されたときだけ出力する
export const masonryStyle = (
  items: { height: number; width: number }[],
  columnCounts: number[],
  {
    canvas,
    gap = false,
    item,
  }: { canvas: string | undefined; gap?: boolean; item: string | undefined },
) => {
  const layouts = columnCounts.map((columns) => masonryLayout(items, columns));
  return [
    `.${canvas}{${layouts
      .map(
        (layout, i) =>
          `--h${i + 1}:${layout.totalHeight};${gap ? `--gr${i + 1}:${Math.max(0, layout.totalRows - 1)};` : ""}`,
      )
      .join("")}}`,
    ...items.map(
      (_, index) =>
        `.${item}[data-index="${index}"]{${layouts
          .map((layout, i) => {
            const placed = layout.items[index];
            return `--c${i + 1}:${placed.column};--y${i + 1}:${placed.top};${gap ? `--r${i + 1}:${placed.rowsAbove};` : ""}`;
          })
          .join("")}}`,
    ),
  ].join("");
};
