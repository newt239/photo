import { useEffect, useRef, useState } from "react";

export const useMasonryColumns = (columnWidth: number) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(1);
  const [width, setWidth] = useState(0);

  // 列数はコンテナの実寸から決まるため、DOM API の ResizeObserver で監視する
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setWidth(next);
      setColumns(Math.max(1, Math.floor(next / columnWidth)));
    });
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [columnWidth]);

  return { columns, ref, width };
};
