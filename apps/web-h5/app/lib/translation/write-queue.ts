let queue: Promise<void> = Promise.resolve();

/**
 * 将文件写入操作加入全局队列
 * 保证所有写操作严格按顺序执行，避免并发覆盖
 */
export function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  // 将当前操作追加到队列末尾
  const result = queue.then(() => fn());

  // 关键：无论 result 成功或失败，队列都要继续向后执行
  // 但要把错误原样抛给调用方
  queue = result.then(() => { }, () => { }).catch(() => { });

  return result;
}
