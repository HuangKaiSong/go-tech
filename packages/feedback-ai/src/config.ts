function required(name: string, fallbackName?: string) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);

  if (!value) {
    const fallbackHint = fallbackName ? `（也兼容 ${fallbackName}）` : '';
    throw new Error(`缺少环境变量 ${name}${fallbackHint}，请参考 apps/aide/.env.example`);
  }

  return value;
}

function positiveInteger(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} 必须是正整数，当前值为 ${raw}`);
  }

  return value;
}

export function getMySQLConfig() {
  return {
    connectionString: required('MYSQL_DATABASE_URL', 'DATABASE_URL')
  };
}

export function getVectorConfig() {
  const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('缺少 EMBEDDING_API_KEY（也兼容 OPENAI_API_KEY），DeepSeek 聊天接口不提供嵌入模型');
  }

  return {
    postgresUrl: required('POSTGRES_URL'),
    embeddingApiKey: apiKey,
    embeddingBaseUrl: process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
  };
}

export function getChatConfig() {
  return {
    apiKey: required('DEEPSEEK_API_KEY'),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
  };
}

export function getRagConfig() {
  const chunkSize = positiveInteger('RAG_CHUNK_SIZE', 800);
  const chunkOverlap = positiveInteger('RAG_CHUNK_OVERLAP', 120);

  if (chunkOverlap >= chunkSize) {
    throw new Error('RAG_CHUNK_OVERLAP 必须小于 RAG_CHUNK_SIZE');
  }

  return {
    chunkSize,
    chunkOverlap,
    knowledgeLimit: positiveInteger('RAG_KNOWLEDGE_LIMIT', 4),
    memoryLimit: positiveInteger('RAG_MEMORY_LIMIT', 3),
    shortTermMaxTurns: positiveInteger('SHORT_TERM_MAX_TURNS', 8)
  };
}
