import type { Metadata } from 'next';
import BlogContent from './blog-content';

export const metadata: Metadata = {
  title: '博客 Blog | GO-TECHS',
  description: '最新香港租務及人事條例、實務指南與 Go Techs 產品動態，助您管理更合規、更輕鬆。'
};

export default function BlogPage() {
  return <BlogContent />;
}
