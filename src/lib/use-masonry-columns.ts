import { useRef, useState } from "react";

import { useIsomorphicEffect } from "@mantine/hooks";

export const useMasonryColumns = (columnWidth: number) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(0);
  const [width, setWidth] = useState(0);

  // 列数はコンテナの実寸からしか決まらないため描画前に計測し ResizeObserver で追従する
  useIsomorphicEffect(() => {
    const apply = (next: number) => {
      setWidth(next);
      setColumns(Math.max(1, Math.floor(next / columnWidth)));
    };
    const observer = new ResizeObserver((entries) => {
      apply(entries[0]?.contentRect.width ?? 0);
    });
    const container = ref.current;
    if (container) {
      apply(container.getBoundingClientRect().width);
      observer.observe(container);
    }
    return () => observer.disconnect();
  }, [columnWidth]);

  return { columns, ref, width };
};
