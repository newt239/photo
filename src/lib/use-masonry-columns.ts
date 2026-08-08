import { useRef, useState } from "react";

import { useIsomorphicEffect } from "@mantine/hooks";

export const useMasonryColumns = (columnWidth: number) => {
  const ref = useRef<HTMLDivElement | null>(null);
  // 計測前は 0 を返し、誤った列数で一度描画してから並べ直すちらつきを防ぐ
  const [columns, setColumns] = useState(0);
  const [width, setWidth] = useState(0);

  // 列数はコンテナの実寸から決まるため、DOM API の ResizeObserver で監視する
  // ResizeObserver の初回コールバックは描画後に走るため、
  // 描画前に実行される useIsomorphicEffect の中で同期的に一度計測する
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
