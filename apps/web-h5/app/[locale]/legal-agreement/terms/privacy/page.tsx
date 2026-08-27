import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Head from 'next/head';
import { cookies } from 'next/headers';
import { FilePreview } from '@/app/components/FilePreview';

export default async function Refund() {
  const cookie = await cookies();
  const local = cookie.get('GO_TECH_LANGUAGE');
  const fileName: string = local?.value === 'en' ? 'privacy-en.docx' : 'privacy.docx';

  const filePath = path.join(process.cwd(), 'public', 'terms', fileName);
  const file = await readFile(filePath);
  const fileArrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;

  return (
    <div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <FilePreview file={fileArrayBuffer} filename={fileName} />
    </div>
  );
}
