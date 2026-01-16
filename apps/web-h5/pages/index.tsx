import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import TargetAudienceSection from "@/components/TargetAudienceSection";
import StepsSection from "@/components/StepsSection";
import StatsSection from "@/components/StatsSection";
import TestimonialSection from "@/components/TestimonialSection";
import heroBackground from "@/assets/background.webp";

import { SoftwareApplicationJsonLd } from "next-seo";

import Footer from "@/components/Footer";
import { useIframeContext } from "@/contexts/IframeContext";
export default function Home() {
  const { hasIframe } = useIframeContext()
  return (
     <div className="min-h-screen bg-background">
      <SoftwareApplicationJsonLd
        type="WebApplication"
        name="Home Page Title"
        description="Home page description of the page"
      />
      <Header heroBg={heroBackground} />
      <main>
        <HeroSection />
        <section className="py-25 bg-background">
          <div className={`container mx-auto px-4 flex flex-col gap-10 items-center ${hasIframe ? 'cursor-editor' : ''}`}>
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
        <PricingSection />
        <TargetAudienceSection />
        <StepsSection />
        <StatsSection />
        <TestimonialSection />
      </main>

      <Footer />
    </div>
  );
}
