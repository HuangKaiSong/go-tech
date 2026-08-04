import { relations } from 'drizzle-orm';
import { platformCustomer } from '../external/platform_customer';
import { fbCategory, fbSubCategory } from './fb_categories';
import { fbComment } from './fb_comments';
import { fbFeature } from './fb_feature';
import { fbVote } from './fb_vote';

export const fbUserRelations = relations(platformCustomer, ({ many }) => ({
  features: many(fbFeature),
  votes: many(fbVote),
  comments: many(fbComment)
}));

export const fbCategoryRelations = relations(fbCategory, ({ many }) => ({
  subCategories: many(fbSubCategory),
  features: many(fbFeature)
}));

export const fbSubCategoryRelations = relations(fbSubCategory, ({ many, one }) => ({
  category: one(fbCategory, {
    fields: [fbSubCategory.categoryId],
    references: [fbCategory.id]
  }),
  features: many(fbFeature)
}));

export const fbFeatureRelations = relations(fbFeature, ({ many, one }) => ({
  category: one(fbCategory, {
    fields: [fbFeature.categoryId],
    references: [fbCategory.id]
  }),
  subCategory: one(fbSubCategory, {
    fields: [fbFeature.subCategoryId],
    references: [fbSubCategory.id]
  }),
  author: one(platformCustomer, {
    fields: [fbFeature.authorId],
    references: [platformCustomer.id]
  }),
  votes: many(fbVote),
  comments: many(fbComment)
}));

export const fbVoteRelations = relations(fbVote, ({ one }) => ({
  feature: one(fbFeature, {
    fields: [fbVote.featureId],
    references: [fbFeature.id]
  }),
  user: one(platformCustomer, {
    fields: [fbVote.userId],
    references: [platformCustomer.id]
  })
}));

export const fbCommentRelations = relations(fbComment, ({ many, one }) => ({
  feature: one(fbFeature, {
    fields: [fbComment.featureId],
    references: [fbFeature.id]
  }),
  author: one(platformCustomer, {
    fields: [fbComment.authorId],
    references: [platformCustomer.id]
  }),
  parent: one(fbComment, {
    fields: [fbComment.parentId],
    references: [fbComment.id],
    relationName: 'comment_replies'
  }),
  replies: many(fbComment, { relationName: 'comment_replies' })
}));
