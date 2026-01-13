import { GetStaticProps } from "next";
import { SoftwareApplicationJsonLd } from "next-seo";
import { Html, Head, Main, NextScript } from "next/document";
const Document: GetStaticProps = (props) => {
  return (
    <Html lang={props.locale} suppressHydrationWarning={true}>
      <Head>
      </Head>
      <body suppressHydrationWarning className="bg-white dark:bg-gray-950 text-black dark:text-white antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

export default Document;
