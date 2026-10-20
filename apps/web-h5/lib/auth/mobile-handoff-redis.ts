import Redis from 'ioredis';

const globalForRedis = globalThis as typeof globalThis & {
  pmsHandoffRedis?: { client: Redis; connecting?: Promise<Redis> };
};

/** 每个 Node worker 复用一个连接；Redis 不可用时快速失败，不缓存凭证写命令。 */
export async function getMobileHandoffRedis() {
  let state = globalForRedis.pmsHandoffRedis;
  if (!state || state.client.status === 'end') {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is required');
    const client = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 5_000,
      commandTimeout: 5_000,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      retryStrategy: () => null
    });
    // ioredis 要求处理 error 事件；接口统一返回通用错误，不记录连接凭证。
    client.on('error', () => {});
    state = { client };
    globalForRedis.pmsHandoffRedis = state;
  }
  if (state.client.status === 'ready') return state.client;
  if (state.connecting) return state.connecting;
  const current = state;
  const connecting = current.client
    .connect()
    .then(() => current.client)
    .finally(() => {
      current.connecting = undefined;
    });
  current.connecting = connecting;
  return connecting;
}
