import { connection } from 'next/server';
import { Suspense } from 'react';
import { defaultHomeBlocks } from '@/app/components/blockDefaults';
import FeaturedPricingSection from '@/app/components/featured-pricing-section';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import PricingSectionSkeleton from '@/app/components/pricing-section-skeleton';
import { loadPageBlocks } from '@/app/lib/pageBlocks';
import HeroSection from '../components/HeroSection';
import IntroSection from '../components/IntroSection';
import StatsSection from '../components/StatsSection';
import StepsSection from '../components/StepsSection';
import TargetAudienceSection from '../components/TargetAudienceSection';
import TestimonialSection from '../components/TestimonialSection';

export default async function Home({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) {
  const blocks = await loadPageBlocks('home', defaultHomeBlocks);
  await connection();
  const { product } = await searchParams;
  const requestedProduct = Array.isArray(product) ? product[0] : product;
  const heroBlock = blocks.find(block => block.type === 'hero');
  const productKey =
    requestedProduct === 'hr' || requestedProduct === 'pms' ? requestedProduct : heroBlock?.defaultProduct;
  const productBackground = heroBlock?.products?.find(item => item.key === productKey)?.backgroundImage;

  const heroBackground = productBackground || heroBlock?.backgroundImage || '';

  return (
    <div className="min-h-screen bg-background">
      <Header heroBg={heroBackground} initialBlocks={blocks} />
      <main>
        <HeroSection initialBlocks={blocks} />
        <IntroSection initialBlocks={blocks} />
        <Suspense fallback={<PricingSectionSkeleton />}>
          <FeaturedPricingSection />
        </Suspense>
        <TargetAudienceSection initialBlocks={blocks} />
        <StepsSection />
        <StatsSection />
        <TestimonialSection initialBlocks={blocks} />
      </main>

      <Footer />
    </div>
  );
}
