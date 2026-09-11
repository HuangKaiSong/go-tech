import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Head from 'next/head';
import { cookies } from 'next/headers';
import { FilePreview } from '@/app/components/FilePreview';

export default async function Refund() {
  const cookie = await cookies();
  const local = cookie.get('GO_TECH_LANGUAGE');
  const fileName = local?.value === 'en' ? 'refund-en.docx' : 'refund.docx';

  // public 目录下的文件在服务端读取时，不能用 URL 路径（/terms/xxx.docx），
  // 需要用 process.cwd()（指向应用根目录 apps/web-h5）拼出真实文件系统路径。
  // docx 是二进制（ZIP）文件，必须按 Buffer 读取；@file-viewer 的 file 只接受
  // ArrayBuffer / Blob，Node Buffer 是 Uint8Array 子类，需先转成 ArrayBuffer
  const filePath = path.join(process.cwd(), 'public', 'terms', fileName);
  const file = await readFile(filePath);
  const fileArrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;

  return (
    <div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
      {/* <iframe
        src={`https://docs.google.com/viewerng/viewer?url=/terms/${fileName}&embedded=true`}
        style={{ width: '100%', height: '100vh' }}
        frameBorder="0"
      /> */}

      <FilePreview file={fileArrayBuffer} filename={fileName} />
    </div>
  );
}
