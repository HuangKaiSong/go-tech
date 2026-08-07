import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pool } from 'pg';

import { getVectorConfig } from './config';

const TABLE_NAME = 'aide_vectors';
const COLLECTION_TABLE_NAME = 'aide_collections';
const COLLECTION_ID_FOREIGN_KEY = 'aide_vectors_collection_id_fkey';

export interface VectorStores {
  close: () => Promise<void>;
  deleteKnowledgeByFeatureId: (featureId: number, exceptSyncVersion?: string) => Promise<number>;
  findKnowledgeByComments: (minimum: number, inclusive?: boolean, limit?: number) => Promise<Document[]>;
  findKnowledgeByLikes: (minimum: number, inclusive?: boolean, limit?: number) => Promise<Document[]>;
  findTrashKnowledge: (limit?: number) => Promise<TrashKnowledgeResult>;
  knowledge: PGVectorStore;
  longTermMemory: PGVectorStore;
}

export interface TrashKnowledgeResult {
  deletedComments: number;
  deletedFeatures: number;
  documents: Document[];
  total: number;
}

async function ensureSchema(pool: Pool) {
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      text text,
      metadata jsonb,
      embedding vector
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${COLLECTION_TABLE_NAME} (
      uuid uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      name character varying,
      cmetadata jsonb
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_${COLLECTION_TABLE_NAME}_name
    ON ${COLLECTION_TABLE_NAME}(name);
  `);
  await pool.query(`
    ALTER TABLE ${TABLE_NAME}
    ADD COLUMN IF NOT EXISTS collection_id uuid;
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '${COLLECTION_ID_FOREIGN_KEY}'
          AND conrelid = '${TABLE_NAME}'::regclass
      ) THEN
        ALTER TABLE ${TABLE_NAME}
        ADD CONSTRAINT ${COLLECTION_ID_FOREIGN_KEY}
        FOREIGN KEY (collection_id)
        REFERENCES ${COLLECTION_TABLE_NAME}(uuid)
        ON DELETE CASCADE;
      END IF;
    END
    $$;
  `);
}

export async function createVectorStores(): Promise<VectorStores> {
  const config = getVectorConfig();
  const pool = new Pool({ connectionString: config.postgresUrl });
  const embeddings = new OpenAIEmbeddings({
    model: config.embeddingModel,
    apiKey: config.embeddingApiKey,
    configuration: {
      baseURL: config.embeddingBaseUrl
    }
  });
  const sharedConfig = {
    pool,
    tableName: TABLE_NAME,
    collectionTableName: COLLECTION_TABLE_NAME,
    skipInitializationCheck: true,
    distanceStrategy: 'cosine' as const,
    scoreNormalization: 'similarity' as const
  };

  try {
    await ensureSchema(pool);
    const knowledge = await PGVectorStore.initialize(embeddings, {
      ...sharedConfig,
      collectionName: 'aide_knowledge'
    });
    const longTermMemory = await PGVectorStore.initialize(embeddings, {
      ...sharedConfig,
      collectionName: 'aide_long_term_memory'
    });

    let closed = false;
    const close = async () => {
      if (closed) return;
      closed = true;
      knowledge.client?.release();
      longTermMemory.client?.release();
      await pool.end();
    };
    const findKnowledgeByLikes = async (minimum: number, inclusive = false, limit = 100) => {
      const comparator = inclusive ? '>=' : '>';
      const safeLimit = Math.min(Math.max(limit, 1), 100);
      const result = await pool.query<{ metadata: Record<string, unknown>; text: string }>(
        `
          WITH matched AS (
            SELECT DISTINCT ON (vectors.metadata->>'feature_id')
              vectors.text,
              vectors.metadata
            FROM ${TABLE_NAME} vectors
            INNER JOIN ${COLLECTION_TABLE_NAME} collections
              ON collections.uuid = vectors.collection_id
            WHERE collections.name = $1
              AND COALESCE((vectors.metadata->>'is_deleted')::boolean, false) = false
              AND vectors.metadata->>'like_count' ~ '^[0-9]+$'
              AND (vectors.metadata->>'like_count')::integer ${comparator} $2
            ORDER BY
              vectors.metadata->>'feature_id',
              COALESCE((vectors.metadata->>'chunk_index')::integer, 0)
          )
          SELECT text, metadata
          FROM matched
          ORDER BY (metadata->>'like_count')::integer DESC
          LIMIT $3;
        `,
        ['aide_knowledge', minimum, safeLimit]
      );

      return result.rows.map(
        row =>
          new Document({
            pageContent: row.text,
            metadata: row.metadata
          })
      );
    };

    const findKnowledgeByComments = async (minimum: number, inclusive = false, limit = 100) => {
      const comparator = inclusive ? '>=' : '>';
      const safeLimit = Math.min(Math.max(limit, 1), 100);
      const result = await pool.query<{ metadata: Record<string, unknown>; text: string }>(
        `
          WITH matched AS (
            SELECT DISTINCT ON (vectors.metadata->>'feature_id')
              vectors.text,
              vectors.metadata
            FROM ${TABLE_NAME} vectors
            INNER JOIN ${COLLECTION_TABLE_NAME} collections
              ON collections.uuid = vectors.collection_id
            WHERE collections.name = $1
              AND COALESCE((vectors.metadata->>'is_deleted')::boolean, false) = false
              AND vectors.metadata->>'comment_count' ~ '^[0-9]+$'
              AND (vectors.metadata->>'comment_count')::integer ${comparator} $2
            ORDER BY
              vectors.metadata->>'feature_id',
              COALESCE((vectors.metadata->>'chunk_index')::integer, 0)
          )
          SELECT text, metadata
          FROM matched
          ORDER BY (metadata->>'comment_count')::integer DESC
          LIMIT $3;
        `,
        ['aide_knowledge', minimum, safeLimit]
      );

      return result.rows.map(
        row =>
          new Document({
            pageContent: row.text,
            metadata: row.metadata
          })
      );
    };
    const findTrashKnowledge = async (limit = 100): Promise<TrashKnowledgeResult> => {
      const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
      const result = await pool.query<{
        deleted_comments: number | string;
        deleted_features: number | string;
        metadata: Record<string, unknown>;
        text: string;
      }>(
        `
          WITH features AS (
            SELECT DISTINCT ON (vectors.metadata->>'feature_id')
              vectors.text,
              vectors.metadata
            FROM ${TABLE_NAME} vectors
            INNER JOIN ${COLLECTION_TABLE_NAME} collections
              ON collections.uuid = vectors.collection_id
            WHERE collections.name = $1
            ORDER BY
              vectors.metadata->>'feature_id',
              COALESCE((vectors.metadata->>'chunk_index')::integer, 0)
          ), trash AS (
            SELECT
              text,
              metadata,
              CASE WHEN COALESCE((metadata->>'is_deleted')::boolean, false) THEN 1 ELSE 0 END AS deleted_feature,
              CASE
                WHEN metadata->>'deleted_comment_count' ~ '^[0-9]+$'
                  THEN (metadata->>'deleted_comment_count')::integer
                ELSE 0
              END AS deleted_comments
            FROM features
          )
          SELECT
            text,
            metadata,
            SUM(deleted_feature) OVER () AS deleted_features,
            SUM(deleted_comments) OVER () AS deleted_comments
          FROM trash
          WHERE deleted_feature = 1 OR deleted_comments > 0
          ORDER BY metadata->>'deleted_at' DESC NULLS LAST, metadata->>'feature_id'
          LIMIT $2;
        `,
        ['aide_knowledge', safeLimit]
      );
      const deletedFeatures = Number(result.rows[0]?.deleted_features ?? 0);
      const deletedComments = Number(result.rows[0]?.deleted_comments ?? 0);

      return {
        deletedComments,
        deletedFeatures,
        documents: result.rows.map(
          row =>
            new Document({
              pageContent: row.text,
              metadata: row.metadata
            })
        ),
        total: deletedFeatures + deletedComments
      };
    };
    const deleteKnowledgeByFeatureId = async (featureId: number, exceptSyncVersion?: string) => {
      const result = await pool.query(
        `
          DELETE FROM ${TABLE_NAME} vectors
          USING ${COLLECTION_TABLE_NAME} collections
          WHERE collections.uuid = vectors.collection_id
            AND collections.name = $1
            AND vectors.metadata->>'feature_id' = $2
            AND ($3::text IS NULL OR vectors.metadata->>'sync_version' IS DISTINCT FROM $3);
        `,
        ['aide_knowledge', String(featureId), exceptSyncVersion ?? null]
      );
      return result.rowCount ?? 0;
    };

    return {
      knowledge,
      longTermMemory,
      deleteKnowledgeByFeatureId,
      findKnowledgeByComments,
      findKnowledgeByLikes,
      findTrashKnowledge,
      close
    };
  } catch (error) {
    await pool.end();
    throw error;
  }
}
