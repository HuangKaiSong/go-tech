import { defaultHomeBlocks } from '@/app/components/blockDefaults';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { loadPageBlocks } from '@/app/lib/pageBlocks';
import HeroSection from './components/HeroSection';
import IntroSection from './components/IntroSection';
import PricingSection from './components/PricingSection';
import StatsSection from './components/StatsSection';
import StepsSection from './components/StepsSection';
import TargetAudienceSection from './components/TargetAudienceSection';
import TestimonialSection from './components/TestimonialSection';

function getBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined');
  }

  return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
}

export default async function Home() {
  const blocks = await loadPageBlocks('home', defaultHomeBlocks);
  let packages: Packages[] = [];
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/go-tech/platform/platformPackage/enabledList`);

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      packages = [];
    } else {
      const packagesData = (await response.json()) as HttpBaseResponse<Packages[]>;

      // 检查响应是否包含正确的数据结构
      if (packagesData && typeof packagesData === 'object' && Array.isArray(packagesData.data)) {
        packages = packagesData.data.slice(0, 3);
      } else {
        console.warn('Unexpected API response format:', packagesData);
        packages = [];
      }
    }
  } catch (error) {
    console.error('Error fetching packages:', error);
    packages = [];
  }

  const heroBackground = blocks?.find(block => block.type === 'hero')?.backgroundImage || '';

  return (
    <div className="min-h-screen bg-background">
      <Header heroBg={heroBackground} initialBlocks={blocks} />
      <main>
        <HeroSection initialBlocks={blocks} />
        <IntroSection initialBlocks={blocks} />
        <PricingSection packages={packages || []} />
        <TargetAudienceSection initialBlocks={blocks} />
        <StepsSection />
        <StatsSection />
        <TestimonialSection initialBlocks={blocks} />
      </main>

      <Footer />
    </div>
  );
}
