import { useRef, useState } from "react";

import { useIsomorphicEffect } from "@mantine/hooks";

export const useContainerWidth = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  // 列数はコンテナの実寸からしか決まらないため描画前に計測し ResizeObserver で追従する
  useIsomorphicEffect(() => {
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect.width ?? 0);
    });
    const container = ref.current;
    if (container) {
      setWidth(container.getBoundingClientRect().width);
      observer.observe(container);
    }
    return () => observer.disconnect();
  }, []);

  return { ref, width };
};

export const masonryLayout = <T extends { height: number; width: number }>(
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
