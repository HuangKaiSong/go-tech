import Head from 'next/head';
import { cookies } from 'next/headers';

export default async function Refund() {
  let url = 'https://go-techs.com/terms/privacy.docx';
  const cookie = await cookies();
  const local = cookie.get('GO_TECH_LANGUAGE');
  if (local?.value === 'en') {
    url = 'https://go-techs.com/terms/privacy-en.docx';
  }

  return (
    <div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
      <iframe
        src={`https://docs.google.com/viewerng/viewer?url=${url}&embedded=true`}
        style={{ width: '100%', height: '100vh' }}
        frameBorder="0"
      />
    </div>
  );
}
