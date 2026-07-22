import { useEffect, useRef, useState } from "react";

// 简单的内存缓存（仅客户端内部去重，非共享）
const clientCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string>>();

export function useDynamicTranslation(text: string, locale: string = "zh-hk") {
  const [translated, setTranslated] = useState<string>(text); // 初始显示原文
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    // // 如果 locale 等于默认语言，直接返回原文
    // // 默认语言从环境变量或配置读取，这里假设为 'zh-hk'，可统一导入
    // if (locale === "zh-hk") {
    //   setTranslated(text);
    //   setLoading(false);
    //   setError(null);
    //   return;
    // }

    const cacheKey = `${text}:${locale}`;

    // 检查客户端缓存
    if (clientCache.has(cacheKey)) {
      setTranslated(clientCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    // 检查是否已有相同请求正在进行
    if (pendingFetches.has(cacheKey)) {
      setLoading(true);
      pendingFetches.get(cacheKey)!
        .then((result) => {
          if (isMounted.current) {
            setTranslated(result);
            clientCache.set(cacheKey, result);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted.current) {
            setError(err);
            setLoading(false);
            // 降级返回原文
            setTranslated(text);
          }
        });
      return;
    }

    // 发起新请求
    setLoading(true);
    const fetchPromise = fetch(`/api/translate?text=${encodeURIComponent(text)}&locale=${encodeURIComponent(locale)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.result) {
          return data.result;
        }
        throw new Error("Invalid response");

      });

    pendingFetches.set(cacheKey, fetchPromise);

    fetchPromise
      .then((result) => {
        if (isMounted.current) {
          setTranslated(result);
          clientCache.set(cacheKey, result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setError(err);
          setLoading(false);
          setTranslated(text); // 降级
        }
      })
      .finally(() => {
        pendingFetches.delete(cacheKey);
      });
  }, [text, locale]);

  // 清理
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return { translated, loading, error };
}
