import Head from "next/head";
import { useMemo } from "react";

export default function Refund() {
  const url = useMemo(() => {
    return "https://go-techs.com/terms/refund.docx";
  }, []);

  return (
    <div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
        style={{ width: "100%", height: "100vh" }}
        frameBorder="0"
      />
    </div>
  );
}
