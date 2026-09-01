'use client';

import { Button } from '@go-tech/web-ui';
import { Building2, Users } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { type CSSProperties, useEffect, useState } from 'react';
import Slider from 'react-slick';
import Link from '@/app/components/Link';
// oxlint-disable-next-line import/no-unassigned-import
import 'slick-carousel/slick/slick-theme.css';
// oxlint-disable-next-line import/no-unassigned-import
import 'slick-carousel/slick/slick.css';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { DynamicText } from '../DynamicI18nText.client';

type BlockBase = {
  id: string;
  type: string;
};

export type HeroProductKey = 'hr' | 'pms';

export type HeroProduct = {
  backgroundImage: string;
  backgroundImageAlt?: string;
  detailButtonLink: string;
  detailButtonText: string;
  key: HeroProductKey;
  label: string;
  subtitle: string;
  title: string;
  titleSecondary: string;
  trialButtonLink: string;
  trialButtonText: string;
};

export type HeroBlock = BlockBase & {
  backgroundImage: string;
  buttonLink?: string;
  buttonStyle?: CSSProperties;
  buttonText?: string;
  contentStyle?: CSSProperties;
  defaultProduct?: HeroProductKey;
  overlayGradient?: string;
  products?: HeroProduct[];
  sectionStyle?: CSSProperties;
  subtitle: string;
  subtitleStyle?: CSSProperties;
  title: string;
  titleSecondary: string;
  titleSecondaryStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  type: 'hero';
  variant?: 'default' | 'product-switcher';
};

const cursorClass = (hasIframe: boolean) => (hasIframe ? 'cursor-editor' : '');

function RenderBlock({ block, hasIframe: _hasIframe, seq }: { block: HeroBlock; hasIframe: boolean; seq: number }) {
  const sectionStyle = block.sectionStyle || {
    paddingTop: '8rem',
    paddingBottom: '8rem'
  };
  const blockTitle = useBatchTranslation(block.title);
  const titleSecondary = useBatchTranslation(block.titleSecondary);

  return (
    <section className="relative flex-1" style={sectionStyle}>
      <div
        data-block-id={block.id}
        data-block-seq={seq}
        data-block-role="background"
        className="absolute w-full h-full inset-0 bg-size_100 bg-center bg-cover"
        style={{ backgroundImage: `url(${block.backgroundImage})` }}
      />
      <div className="container h-full mx-auto px-4 relative z-10 bg-transparent">
        <div style={block.contentStyle}>
          <h1
            data-block-id={block.id}
            data-block-seq={seq}
            data-block-role="title"
            className="text-4xl md:text-5xl font-bold text-white mb-4 whitespace-pre-line"
            style={block.titleStyle}
            dangerouslySetInnerHTML={{ __html: blockTitle }}
          />
          <h2
            data-block-id={block.id}
            data-block-seq={seq}
            data-block-role="titleSecondary"
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={block.titleSecondaryStyle}
            dangerouslySetInnerHTML={{ __html: titleSecondary }}
          />
          <p data-block-id={block.id} data-block-seq={seq} data-block-role="subtitle" style={block.subtitleStyle}>
            <DynamicText text={block.subtitle} />
          </p>
          {block.buttonText && block.buttonLink ? (
            <Link href={block.buttonLink}>
              <Button
                data-block-id={block.id}
                data-block-seq={seq}
                data-block-role="buttonText"
                data-block-link={block.buttonLink}
                size="lg"
                style={block.buttonStyle}
              >
                <DynamicText text={block.buttonText} />
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const productIcon = {
  hr: Users,
  pms: Building2
};
const emptyHeroProducts: HeroProduct[] = [];

const resolveProductKey = (
  requested: string | null | undefined,
  products: HeroProduct[],
  fallback?: HeroProductKey
): HeroProductKey => {
  if (requested === 'hr' || requested === 'pms') {
    if (products.some(product => product.key === requested)) return requested;
  }
  if (fallback && products.some(product => product.key === fallback)) return fallback;
  return products[0]?.key || 'pms';
};

function ProductHero({ block, hasIframe, seq }: { block: HeroBlock; hasIframe: boolean; seq: number }) {
  const products = block.products || emptyHeroProducts;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryProduct = searchParams.get('product');
  const [activeProductKey, setActiveProductKey] = useState<HeroProductKey>(() =>
    resolveProductKey(queryProduct, products, block.defaultProduct)
  );

  useEffect(() => {
    setActiveProductKey(currentProduct => {
      if (queryProduct === 'hr' || queryProduct === 'pms') {
        return resolveProductKey(queryProduct, products, block.defaultProduct);
      }
      if (products.some(product => product.key === currentProduct)) return currentProduct;
      return resolveProductKey(null, products, block.defaultProduct);
    });
  }, [block.defaultProduct, products, queryProduct]);

  useEffect(() => {
    if (!hasIframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'SET_HERO_PRODUCT') return;
      if (event.data.blockId !== block.id) return;
      setActiveProductKey(resolveProductKey(event.data.productKey, products, block.defaultProduct));
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [block.defaultProduct, block.id, hasIframe, products]);

  const activeProduct = products.find(product => product.key === activeProductKey) || products[0];
  const blockTitle = useBatchTranslation(activeProduct?.title || '');
  const titleSecondary = useBatchTranslation(activeProduct?.titleSecondary || '');

  if (!activeProduct) return null;

  const hasDetailButton = Boolean(activeProduct.detailButtonText && activeProduct.detailButtonLink);
  const hasTrialButton = Boolean(activeProduct.trialButtonText && activeProduct.trialButtonLink);

  const selectProduct = (productKey: HeroProductKey) => {
    setActiveProductKey(productKey);
    if (hasIframe) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('product', productKey);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
  };

  return (
    <section
      data-block-id={block.id}
      data-block-seq={seq}
      data-block-role="hero"
      data-hero-variant="product-switcher"
      className={`relative min-h-150 w-full flex items-center pt-16 overflow-hidden ${cursorClass(hasIframe)}`}
    >
      {products.map(product => (
        <div
          key={product.key}
          aria-hidden="true"
          data-block-id={product.key === activeProductKey ? block.id : undefined}
          data-block-seq={product.key === activeProductKey ? seq : undefined}
          data-block-role={product.key === activeProductKey ? 'background' : undefined}
          data-product-key={product.key}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
            product.key === activeProductKey ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${product.backgroundImage})` }}
        />
      ))}

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            block.overlayGradient ||
            'linear-gradient(to right, rgba(41, 48, 61, 0.8), rgba(41, 48, 61, 0.5), transparent)'
        }}
      />

      <div className="relative z-10 mx-auto w-[1280px] min-w-[1280px] max-w-[1280px]">
        <div
          role="tablist"
          aria-label="選擇系統"
          className="inline-flex p-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 mb-8"
        >
          {products.map(product => {
            const Icon = productIcon[product.key];
            const isActive = product.key === activeProductKey;

            return (
              <button
                key={product.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isActive ? 'bg-primary text-primary-foreground shadow' : 'text-white/80 hover:text-white'
                }`}
                onClick={() => selectProduct(product.key)}
              >
                <Icon className="w-4 h-4" />
                <DynamicText text={product.label} />
              </button>
            );
          })}
        </div>

        <div key={activeProduct.key} className="max-w-xl animate-in fade-in duration-500">
          {activeProduct.title ? (
            <h1
              data-block-id={block.id}
              data-block-seq={seq}
              data-block-role="title"
              data-product-key={activeProduct.key}
              className="text-5xl font-bold text-white leading-none mb-4 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: blockTitle }}
            />
          ) : null}
          {activeProduct.titleSecondary ? (
            <h2
              data-block-id={block.id}
              data-block-seq={seq}
              data-block-role="titleSecondary"
              data-product-key={activeProduct.key}
              className="text-3xl leading-9 font-bold text-primary mb-6"
              dangerouslySetInnerHTML={{ __html: titleSecondary }}
            />
          ) : null}
          {activeProduct.subtitle ? (
            <p
              data-block-id={block.id}
              data-block-seq={seq}
              data-block-role="subtitle"
              data-product-key={activeProduct.key}
              className="text-white/90 text-lg mb-8 leading-relaxed"
            >
              <DynamicText text={activeProduct.subtitle} />
            </p>
          ) : null}

          {hasDetailButton || hasTrialButton ? (
            <div className="flex flex-wrap gap-3">
              {hasDetailButton ? (
                <Link href={activeProduct.detailButtonLink}>
                  <Button
                    data-block-id={block.id}
                    data-block-seq={seq}
                    data-block-role="detailButtonText"
                    data-block-link={activeProduct.detailButtonLink}
                    data-product-key={activeProduct.key}
                    size="lg"
                    variant="outline"
                    className="bg-white/10 text-white border-white/40 hover:bg-white hover:text-foreground"
                  >
                    <DynamicText text={activeProduct.detailButtonText} />
                  </Button>
                </Link>
              ) : null}
              {hasTrialButton ? (
                <Link href={activeProduct.trialButtonLink}>
                  <Button
                    data-block-id={block.id}
                    data-block-seq={seq}
                    data-block-role="trialButtonText"
                    data-block-link={activeProduct.trialButtonLink}
                    data-product-key={activeProduct.key}
                    size="lg"
                    className="border-0 bg-linear-to-br from-[#eb550a] via-[#f97015] to-[#fba82d] text-white shadow-lg hover:-translate-y-0.5 transition-transform"
                  >
                    <DynamicText text={activeProduct.trialButtonText} />
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function Hero({
  hasIframe,
  heros,
  startIndex = 0
}: {
  hasIframe: boolean;
  heros: HeroBlock[];
  startIndex?: number;
}) {
  const settings = {
    dots: !hasIframe,
    infinite: !hasIframe,
    autoplaySpeed: 5000,
    autoplay: !hasIframe,
    slidesToShow: 1,
    slidesToScroll: 1
  };

  if (heros.length === 1 && heros[0]?.variant === 'product-switcher') {
    return <ProductHero block={heros[0]} hasIframe={hasIframe} seq={startIndex} />;
  }

  return (
    <Slider {...settings} className={`relative w-full overflow-hidden ${cursorClass(hasIframe)}`}>
      {heros.map((hero, index) => (
        <RenderBlock
          block={hero}
          hasIframe={hasIframe}
          seq={startIndex + index}
          key={`${hero.id}-${startIndex + index}`}
        />
      ))}
    </Slider>
  );
}
