const masonryLayout = <T extends { height: number; width: number }>(
  items: T[],
  columns: number,
) => {
  const lanes = Array.from({ length: Math.max(1, columns) }, () => ({ count: 0, height: 0 }));
  const placed = items.map((item) => {
    let lane = lanes[0] ?? { count: 0, height: 0 };
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
export const masonryStyle = (
  items: { height: number; width: number }[],
  columnCounts: number[],
  classNames: { canvas: string | undefined; item: string | undefined },
) => {
  const layouts = columnCounts.map((columns) => masonryLayout(items, columns));
  return [
    `.${classNames.canvas}{${layouts
      .map(
        (layout, i) =>
          `--h${i + 1}:${layout.totalHeight};--gr${i + 1}:${Math.max(0, layout.totalRows - 1)};`,
      )
      .join("")}}`,
    ...items.map(
      (_, index) =>
        `.${classNames.item}[data-index="${index}"]{${layouts
          .map((layout, i) => {
            const placed = layout.items[index];
            return placed
              ? `--c${i + 1}:${placed.column};--y${i + 1}:${placed.top};--r${i + 1}:${placed.rowsAbove};`
              : "";
          })
          .join("")}}`,
    ),
  ].join("");
};
