// import { useTranslations } from "next-intl"
// import "./index.css"

// type PrivacySection = {
//   title: string
//   paragraphs?: string[]
//   items?: string[]
// }

// export default function Privacy() {
//   const t = useTranslations("Privacy_Policy")
//   const sections = t.raw("sections") as PrivacySection[]

//   return (
//     <div className="privacy-page">
//       <main className="privacy-wrapper">
//         <article className="privacy-card">
//           <header className="privacy-header">
//             <h1>{t("title")}</h1>
//             <p>{t("foreword")}</p>
//             <p>{t("languageVersion")}</p>
//           </header>

//           <div className="privacy-content">
//             {sections.map((section) => (
//               <section key={section.title} className="privacy-section">
//                 <h2>{section.title}</h2>

//                 {section.paragraphs?.map((paragraph) => (
//                   <p key={paragraph}>{paragraph}</p>
//                 ))}

//                 {section.items ? (
//                   <ul>
//                     {section.items.map((item) => (
//                       <li key={item}>{item}</li>
//                     ))}
//                   </ul>
//                 ) : null}
//               </section>
//             ))}
//           </div>
//         </article>
//       </main>
//     </div>
//   )
// }

import Head from 'next/head';
import { useMemo } from 'react';

export default function Refund() {
  const url = useMemo(() => {
    return 'https://go-techs.com/terms/privacy.docx';
  }, []);

  return (
    <div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
        style={{ width: '100%', height: '100vh' }}
        frameBorder="0"
        sandbox=""
      />
    </div>
  );
}
