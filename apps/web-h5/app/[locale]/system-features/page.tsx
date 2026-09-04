import type { PackageBizCode } from '@go-tech/types';
import { CheckCircle2 } from 'lucide-react';
import { defaultSystemFeaturesBlocks } from '@/app/components/blockDefaults';
import { loadPageBlocks } from '@/app/lib/pageBlocks';
import { DynamicText } from '../../components/DynamicI18nText';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import HeroSection from '../../components/HeroSection';
import PmsPreviewSections from './pms-preview-sections';
import { getSystemFeaturesContent } from './system-features-content';

const SystemFeatures = async ({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) => {
  const [blocks, query] = await Promise.all([
    loadPageBlocks('system-features', defaultSystemFeaturesBlocks),
    searchParams
  ]);
  const requestedProduct = Array.isArray(query.product) ? query.product[0] : query.product;
  const product: PackageBizCode = requestedProduct === 'hr' ? 'hr' : 'pms';
  const c = getSystemFeaturesContent(product, blocks);

  const heroBackground = blocks?.find(block => block.type === 'hero')?.backgroundImage || '';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header heroBg={heroBackground} initialBlocks={blocks} />
      <main data-product={product}>
        <HeroSection initialBlocks={blocks} page="system-features" renderOnly="hero" />

        <section id="system-overview" aria-labelledby="system-overview-title" className="py-16 md:py-24 bg-[#FFF9F3]">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span className="inline-block text-sm font-medium tracking-widest text-[#F5734A] uppercase mb-3">
                  System Overview
                </span>
                <h2 id="system-overview-title" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  <DynamicText text={c.overviewTitle} />
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  <DynamicText text={c.overviewDesc} />
                </p>
              </div>

              {/* Module Intros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {c.modules.map((m, i) => (
                  <div
                    key={m.title}
                    className="group relative bg-white rounded-3xl p-8 border border-transparent hover:border-[#F5734A]/30 hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <div className="absolute top-6 right-6 text-xs font-semibold tracking-wider text-[#F5734A]/50 uppercase">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: '#FFEEDF' }}
                    >
                      <m.icon className="w-7 h-7" style={{ color: '#F5734A' }} strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <div className="text-xs font-semibold tracking-widest text-[#F5734A] uppercase mb-2">{m.tag}</div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      <DynamicText text={m.title} />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      <DynamicText text={m.desc} />
                    </p>
                    <ul className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-5 border-t border-border/60">
                      {m.points.map(p => (
                        <li key={p} className="flex items-center gap-2 text-sm text-foreground/80">
                          <CheckCircle2
                            className="w-4 h-4 shrink-0"
                            style={{ color: '#F5734A' }}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          <DynamicText text={p} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Key Metrics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {c.metrics.map(m => (
                  <div
                    key={m.label}
                    className="bg-white/70 rounded-2xl px-5 py-6 text-center border border-[#F5734A]/10"
                  >
                    <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#F5734A' }}>
                      <DynamicText text={m.value} />
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      <DynamicText text={m.label} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Platform Benefits */}
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {c.benefits.map(b => (
                    <div key={b.title} className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#FFEEDF' }}
                      >
                        <b.icon className="w-6 h-6" style={{ color: '#F5734A' }} strokeWidth={1.8} aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-foreground mb-1">
                          <DynamicText text={b.title} />
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          <DynamicText text={b.desc} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="all-system-features" aria-labelledby="all-system-features-title" className="py-16 md:py-24 flex-1">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 id="all-system-features-title" className="text-3xl font-bold text-foreground mb-4">
                <DynamicText text={c.featuresTitle} />
              </h2>
              <p className="text-muted-foreground mb-12">
                <DynamicText text={c.featuresDesc} />
              </p>

              <div className="space-y-14">
                {c.featureGroups.map(group => (
                  <div key={group.title} data-feature-group={group.title}>
                    {c.featureGroups.length > 1 && (
                      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-border">
                        <h3 className="text-xl font-bold text-foreground">
                          <DynamicText text={group.title} />
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          <DynamicText text={group.desc} />
                        </p>
                      </div>
                    )}
                    <ul className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                      {group.items.map(feature => (
                        <li key={feature.label} className="group flex flex-col items-start rounded-2xl">
                          <div className="w-full aspect-4/3 rounded-2xl flex items-center justify-center mb-4 bg-[#F9F9F9] transition-colors duration-300 group-hover:bg-[#FFEEDF]">
                            <feature.icon
                              className="w-20 h-20 text-[#F5734A] transition-transform duration-300 group-hover:scale-110"
                              strokeWidth={1.5}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="text-lg font-bold text-foreground">
                            <DynamicText text={feature.label} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {c.showPreviews && <PmsPreviewSections />}
      </main>

      <Footer />
    </div>
  );
};

export default SystemFeatures;
