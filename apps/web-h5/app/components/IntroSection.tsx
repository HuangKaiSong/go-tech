'use client'

import { useIframeContext } from "@/contexts/IframeContext";

const IntroSection = () => {
  const { hasIframe } = useIframeContext();

  return (
    <section className="py-25 bg-background">
      <div
        className={`container mx-auto px-4 flex flex-col gap-10 items-center ${hasIframe ? "cursor-editor" : ""}`}
      >
        <h2 className="text-4xl font-bold text-foreground mb-4 relative w-fit">
          租務管理系統，一站式解決方案！
          <div className="h-0.75 w-4/5 absolute -bottom-2 bg-primary left-1/2 -translate-x-1/2"></div>
        </h2>

        <div className="text-foreground text-[30px] max-w-2xl mx-auto leading-relaxed">
          <div>簡化流程，提高效率，讓您的租務管理更輕鬆！</div>
          <div>隨時隨地掌握租務動態，安心管理，省心生活。</div>
        </div>
      </div>
    </section>
  )
}

export default IntroSection