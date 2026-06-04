import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * 從 Supabase 表載入清單；若資料庫尚無資料則回退到 fallback。
 * map: 把資料庫列轉成 UI 期望的形狀。
 */
export function useDbList<TUi, TRow = any>(
  table: string,
  fallback: TUi[],
  map: (row: TRow) => TUi,
  options: { order?: { column: string; ascending?: boolean } } = {}
) {
  const [rows, setRows] = useState<TUi[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabase.from(table as any).select("*");
      if (options.order) q = q.order(options.order.column, { ascending: options.order.ascending ?? true });
      const { data, error } = await q;
      if (cancelled) return;
      if (!error && data && data.length > 0) {
        setRows(data.map(map as any));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return { rows, loading, setRows };
}
