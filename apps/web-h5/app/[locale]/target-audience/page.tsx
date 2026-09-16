import type { PackageBizCode } from '@go-tech/types';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/v2/Header';
import { defaultTargetAudience } from '../../components/blockDefaults';
import { DynamicText } from '../../components/DynamicI18nText';
import HeroSection from '../../components/HeroSection';
import { loadPageBlocks } from '../../lib/pageBlocks';
import { targetAudienceContent } from './target-audience-content';

const TargetAudience = async ({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) => {
  const [blocks, query] = await Promise.all([loadPageBlocks('target-audience', defaultTargetAudience), searchParams]);
  const requestedProduct = Array.isArray(query.product) ? query.product[0] : query.product;
  const product: PackageBizCode = requestedProduct === 'hr' ? 'hr' : 'pms';
  const content = targetAudienceContent[product];

  const hasIframe = false;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main data-product={product}>
        {/* Hero Section */}
        <HeroSection
          initialBlocks={blocks}
          page="target-audience"
          productSwitcherPlacement="below-hero"
          renderOnly="hero"
        />

        {/* Audience Cards */}
        <section id="audience-cards" className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className={`grid md:grid-cols-3 gap-8 ${hasIframe ? 'cursor-editor' : ''}`}>
              {content.audiences.map(audience => (
                <div
                  key={audience.sort}
                  className="bg-background rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="bg-primary py-3 px-4">
                    <h3 className="text-primary-foreground font-semibold text-center">
                      <DynamicText text={audience.title} />
                    </h3>
                  </div>
                  <div className="h-48 overflow-hidden relative">
                    <Image
                      src={audience.image || audience.initialSrc || '/images/audience-individual.jpg'}
                      alt={audience.title}
                      loading="lazy"
                      fill
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      ✓ <DynamicText text={audience.description} />
                    </p>
                    <div className="flex justify-center mt-6">
                      <ChevronDown className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className={`space-y-8 ${hasIframe ? 'cursor-editor' : ''}`}>
              {content.features.map(feature => (
                <div key={feature.number} className="bg-secondary rounded-xl p-6 md:p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold">{feature.number}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-primary">
                      <DynamicText text={feature.title} />
                    </h3>
                  </div>
                  <div className="pl-14 space-y-3">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      <DynamicText text={feature.description} />
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      <DynamicText text={feature.subDescription} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="overflow-x-auto">
              <table
                className={`w-full bg-background rounded-xl overflow-hidden shadow-lg ${hasIframe ? 'cursor-editor' : ''}`}
              >
                <thead>
                  <tr>
                    <th className="p-4 text-left font-semibold text-foreground bg-muted">
                      <DynamicText text="管理環節" />
                    </th>
                    <th className="p-4 text-left font-semibold text-primary-foreground bg-primary">
                      <DynamicText text="沒有系統的傳統方式" />
                    </th>
                    <th className="p-4 text-left font-semibold text-primary-foreground bg-primary/80">
                      <DynamicText text={content.comparisonTitle} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {content.comparisonData.map(row => (
                    <tr key={row.category} className="border-t border-border">
                      <td className="p-4 font-medium text-foreground bg-muted">
                        <DynamicText text={row.category} />
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <DynamicText text={row.traditional} />
                      </td>
                      <td className="p-4 text-sm text-muted-foreground bg-primary/5">
                        <DynamicText text={row.system} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TargetAudience;
