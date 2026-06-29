export async function sendToBetterStack(level: string, message: any, extra = {}) {
  if (process.env.NODE_ENV === 'development') return
  // 从环境变量读取配置
  const LOG_SOURCE_TOKEN = process.env.NEXT_PUBLIC_BETTERSTACK_SOURCE_TOKEN;
  const LOG_INGEST_URL = process.env.NEXT_PUBLIC_BETTERSTACK_INGEST_URL as string;

  const logEntry = {
    message: `[${level.toUpperCase()}] ${message}`,
    dt: new Date().toISOString(),
    level,
    // 将额外上下文合并到日志主体中
    ...extra
  };

  try {
    await fetch(LOG_INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOG_SOURCE_TOKEN}`
      },
      body: JSON.stringify(logEntry)
    });
  } catch (error) {
    // 上报失败时降级到控制台，避免阻塞主流程
    console.error('Failed to send log to BetterStack:', error);
  }
}
