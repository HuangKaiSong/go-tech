import { readFileSync } from 'node:fs';
import { richDocumentSchema, textOf } from '@go-tech/manual-content/model';
import { describe, expect, it, vi } from 'vitest';
import { legacyBlogBody } from '@/db/seeds/blog';
import { blogPosts } from '@/db/seeds/blog-defaults';
vi.mock('@/db', () => ({ getDb: vi.fn() }));
describe('blog migration', () => {
  it('retains the content, lists and original illustrations of all six articles', () => {
    expect(blogPosts).toHaveLength(6);
    for (const post of blogPosts) {
      const body = legacyBlogBody(post.sections);
      expect(richDocumentSchema.safeParse(body).success).toBe(true);
      for (const section of post.sections) {
        expect(textOf(body.doc)).toContain(section.heading);
        for (const paragraph of section.body) expect(textOf(body.doc)).toContain(paragraph);
        if (section.image) expect(JSON.stringify(body)).toContain(section.image);
      }
    }
  });
  it('only adds blog tables and supplies comments and query indexes', () => {
    const sql = readFileSync('drizzle/0009_blog_content.sql', 'utf8');
    expect(sql.match(/CREATE TABLE/g)).toHaveLength(5);
    expect(sql).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM/);
    expect(sql).toContain('idx_blog_public_order');
    expect(sql).toContain('idx_blog_category_order');
    for (const line of sql.split('\n').filter(entry => /^\s*`[a-z_]+`\s/.test(entry)))
      expect(line).toContain('COMMENT');
  });
});
