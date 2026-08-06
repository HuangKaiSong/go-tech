import { Document } from '@langchain/core/documents';
import mysql, { type RowDataPacket } from 'mysql2/promise';

import { getMySQLConfig } from './config';

interface FeatureRow extends RowDataPacket {
  category_name: string | null;
  comment_count: number;
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

export async function loadDocumentsFromMySQL() {
  const connection = await mysql.createConnection(getMySQLConfig().connectionString);

  try {
    // 获取 fb_category、fb_comment、fb_feature、fb_sub_category、fb_vote。
    const [rows] = await connection.execute<FeatureRow[]>(`
      SELECT
        f.id,
        f.title,
        f.description,
        f.status,
        f.like_count,
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
        GROUP_CONCAT(com.content SEPARATOR ' | ') AS official_replies
      FROM fb_feature f
      LEFT JOIN fb_category c ON f.category_id = c.id
      LEFT JOIN fb_sub_category sc ON f.sub_category_id = sc.id
      LEFT JOIN fb_comment com ON com.feature_id = f.id
        AND com.is_official = 1
        AND com.is_visible = 1
        AND com.hidden_at IS NULL
        AND com.deleted_at IS NULL
      WHERE f.deleted_at IS NULL
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);

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
      if (row.shipped_at) content += `\n上線時間：${row.shipped_at.toISOString()}`;
      if (row.version) content += `\n版本：${row.version}`;
      content += `\n描述：${row.description || ''}`;
      if (row.official_replies) {
        content += `\n官方回覆：${row.official_replies}`;
      }

      return new Document({
        pageContent: content,
        metadata: {
          feature_id: row.id,
          category: row.category_name,
          comment_count: row.comment_count,
          sub_category: row.sub_category_name,
          status: row.status,
          like_count: row.like_count,
          shipped_at: row.shipped_at?.toISOString() ?? null,
          version: row.version
        }
      });
    });

    console.log(`从 MySQL 读取 ${docs.length} 条记录`);
    return docs;
  } finally {
    await connection.end();
  }
}
