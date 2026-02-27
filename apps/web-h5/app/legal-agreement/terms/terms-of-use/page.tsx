import { useTranslations } from "next-intl"
import "./index.css"

type PrivacySection = {
  title: string
  paragraphs?: string[]
  items?: string[]
}

export default function TermsOfUse() {
  const t = useTranslations("Terms_of_Use")
  const sections = t.raw("sections") as PrivacySection[]

  return (
    <div className="privacy-page">
      <main className="privacy-wrapper">
        <article className="privacy-card">
          <header className="privacy-header">
            <h1>{t("title")}</h1>
            <p>{t("foreword")}</p>
            <p>{t("languageVersion")}</p>
          </header>

          <div className="privacy-content">
            {sections.map((section) => (
              <section key={section.title} className="privacy-section">
                <h2>{section.title}</h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.items ? (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </article>
      </main>
    </div>
  )
}
