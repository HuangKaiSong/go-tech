import { Document } from '@langchain/core/documents';
import mysql, { type RowDataPacket } from 'mysql2/promise';

import { getMySQLConfig } from './config';

interface FeatureRow extends RowDataPacket {
  category_name: string | null;
  comment_count: number;
  deleted_at: Date | null;
  deleted_comment_count: number;
  deleted_comments: string | null;
  description: string | null;
  id: number;
  like_count: number;
  official_replies: string | null;
  shipped_at: Date | null;
  status: string;
  sub_category_name: string | null;
  title: string;
  version: string | null;
}

async function loadDocuments(featureId?: number) {
  const connection = await mysql.createConnection(getMySQLConfig().connectionString);

  try {
    // 获取 fb_category、fb_comment、fb_feature、fb_sub_category、fb_vote。
    const featureCondition = featureId === undefined ? '' : 'AND f.id = ?';
    const [rows] = await connection.execute<FeatureRow[]>(
      `
      SELECT
        f.id,
        f.title,
        f.description,
        f.status,
        f.like_count,
        f.deleted_at,
        f.shipped_at,
        f.version,
        c.name AS category_name,
        sc.name AS sub_category_name,
        (
          SELECT COUNT(*)
          FROM fb_comment visible_comment
          WHERE visible_comment.feature_id = f.id
            AND visible_comment.deleted_at IS NULL
            AND visible_comment.is_visible = 1
            AND visible_comment.hidden_at IS NULL
        ) AS comment_count,
        (
          SELECT COUNT(*)
          FROM fb_comment deleted_comment
          WHERE deleted_comment.feature_id = f.id
            AND deleted_comment.deleted_at IS NOT NULL
        ) AS deleted_comment_count,
        (
          SELECT GROUP_CONCAT(
            CONCAT('[comment_id=', deleted_comment.id, '] ', deleted_comment.content)
            ORDER BY deleted_comment.deleted_at DESC
            SEPARATOR ' | '
          )
          FROM fb_comment deleted_comment
          WHERE deleted_comment.feature_id = f.id
            AND deleted_comment.deleted_at IS NOT NULL
        ) AS deleted_comments,
        GROUP_CONCAT(com.content SEPARATOR ' | ') AS official_replies
      FROM fb_feature f
      LEFT JOIN fb_category c ON f.category_id = c.id
      LEFT JOIN fb_sub_category sc ON f.sub_category_id = sc.id
      LEFT JOIN fb_comment com ON com.feature_id = f.id
        AND com.is_official = 1
        AND com.is_visible = 1
        AND com.hidden_at IS NULL
        AND com.deleted_at IS NULL
      WHERE 1 = 1
        ${featureCondition}
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `,
      featureId === undefined ? [] : [featureId]
    );

    const statusMap: Record<string, string> = {
      pending: '待評估',
      developing: '開發中',
      shipped: '已完成'
    };

    const docs: Document[] = rows.map(row => {
      // 构造语义文本。
      let content = `標題：${row.title}\n`;
      content += `分類：${row.category_name || ''}`;
      if (row.sub_category_name) content += ` > ${row.sub_category_name}`;
      content += `\n狀態：${statusMap[row.status] || row.status}`;
      content += `\n點讚數：${row.like_count}`;
      content += `\n評論數：${row.comment_count}`;
      content += `\n資料狀態：${row.deleted_at ? '已移至回收站（被刪除）' : '有效資料'}`;
      if (row.deleted_at) content += `\n刪除時間：${row.deleted_at.toISOString()}`;
      content += `\n回收站評論數：${row.deleted_comment_count}`;
      if (row.shipped_at) content += `\n上線時間：${row.shipped_at.toISOString()}`;
      if (row.version) content += `\n版本：${row.version}`;
      content += `\n描述：${row.description || ''}`;
      if (row.official_replies) {
        content += `\n官方回覆：${row.official_replies}`;
      }
      if (row.deleted_comments) {
        content += `\n回收站評論：${row.deleted_comments}`;
      }

      return new Document({
        pageContent: content,
        metadata: {
          feature_id: row.id,
          category: row.category_name,
          comment_count: row.comment_count,
          deleted_at: row.deleted_at?.toISOString() ?? null,
          deleted_comment_count: row.deleted_comment_count,
          is_deleted: Boolean(row.deleted_at),
          sub_category: row.sub_category_name,
          status: row.status,
          like_count: row.like_count,
          shipped_at: row.shipped_at?.toISOString() ?? null,
          version: row.version
        }
      });
    });

    return docs;
  } finally {
    await connection.end();
  }
}

export async function loadDocumentsFromMySQL() {
  const documents = await loadDocuments();
  console.log(`从 MySQL 读取 ${documents.length} 条记录`);
  return documents;
}

export async function loadDocumentFromMySQL(featureId: number) {
  const documents = await loadDocuments(featureId);
  return documents[0];
}
