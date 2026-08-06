import { randomUUID } from 'node:crypto';

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { getRagConfig } from './config';
import { loadDocumentsFromMySQL } from './load-mysql';
import { createVectorStores } from './vector-store';

const MYSQL_SOURCE = 'mysql_feature';

export async function ingest() {
  const ragConfig = getRagConfig();
  const documents = await loadDocumentsFromMySQL();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: ragConfig.chunkSize,
    chunkOverlap: ragConfig.chunkOverlap,
    separators: ['\n\n', '\n', '。', '！', '？', ';', '；', ' ', '']
  });
  const chunks = await splitter.splitDocuments(documents);

  for (const [index, chunk] of chunks.entries()) {
    chunk.metadata = {
      ...chunk.metadata,
      source: MYSQL_SOURCE,
      chunk_index: index,
      ingested_at: new Date().toISOString()
    };
  }

  const stores = await createVectorStores();

  try {
    // ingest 是一次完整同步：先清除旧的 MySQL 知识切片，避免重复和过期内容。
    await stores.knowledge.delete({ filter: { source: MYSQL_SOURCE } });

    if (chunks.length > 0) {
      await stores.knowledge.addDocuments(chunks, {
        ids: chunks.map(() => randomUUID())
      });
    }
  } finally {
    await stores.close();
  }

  console.log(`知识库同步完成：${documents.length} 篇文档，${chunks.length} 个切片`);
  return { documentCount: documents.length, chunkCount: chunks.length };
}
