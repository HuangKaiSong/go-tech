import type { Metadata } from 'next';
import ManualContent from './manual-content';

export const metadata: Metadata = { title: '操作手冊 | GO-TECHS' };

export default function ManualPage() {
  return <ManualContent />;
}
