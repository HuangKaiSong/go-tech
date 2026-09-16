'use client';

import { Button } from '@go-tech/web-ui';
import { Building2, Users } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type CSSProperties, useEffect, useState } from 'react';
import Slider from 'react-slick';
import Link from '@/app/components/Link';
// oxlint-disable-next-line import/no-unassigned-import
import 'slick-carousel/slick/slick-theme.css';
// oxlint-disable-next-line import/no-unassigned-import
import 'slick-carousel/slick/slick.css';
import { useBatchTranslation } from '@/app/hooks/useBatchTranslation';
import { useOptionalProductSelection } from '@/contexts/ProductSelectionContext';
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
  productSwitcherPlacement?: 'below-hero' | 'hero';
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

export type TestimonialBlock = BlockBase & {
  products?: {
    description: string;
    image: string;
    items: string[];
    key: HeroProductKey;
    title: string;
  }[];
  type: 'testimonial';
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

function ProductSwitcher({
  activeProductKey,
  products,
  selectProduct,
  switcherBelowHero
}: {
  activeProductKey: HeroProductKey;
  products: HeroProduct[];
  selectProduct: (product: HeroProductKey) => void;
  switcherBelowHero: boolean;
}) {
  const inactiveClassName = switcherBelowHero
    ? 'text-muted-foreground hover:text-foreground'
    : 'text-white/80 hover:text-white';

  return (
    <div
      role="tablist"
      aria-label="選擇系統"
      className={`inline-flex p-1 rounded-full ${switcherBelowHero ? 'bg-background shadow-sm' : 'bg-white/15 backdrop-blur-sm border border-white/25 mb-8'}`}
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
            className={`inline-flex items-center gap-2 py-2 rounded-full text-sm transition-all duration-300 ${switcherBelowHero ? 'px-6 font-medium' : 'px-5 font-semibold'} ${
              isActive ? 'bg-primary text-primary-foreground shadow' : inactiveClassName
            }`}
            onClick={() => selectProduct(product.key)}
          >
            {!switcherBelowHero && <Icon className="w-4 h-4" aria-hidden="true" />}
            <DynamicText text={product.label} />
          </button>
        );
      })}
    </div>
  );
}

function ProductHeroContent({
  activeProduct,
  blockId,
  seq,
  switcherBelowHero
}: {
  activeProduct: HeroProduct;
  blockId: string;
  seq: number;
  switcherBelowHero: boolean;
}) {
  const blockTitle = useBatchTranslation(activeProduct.title);
  const titleSecondary = useBatchTranslation(activeProduct.titleSecondary);
  const hasDetailButton = Boolean(activeProduct.detailButtonText && activeProduct.detailButtonLink);
  const hasTrialButton = Boolean(activeProduct.trialButtonText && activeProduct.trialButtonLink);

  return (
    <div className={`${switcherBelowHero ? 'max-w-2xl mx-auto' : 'max-w-xl'} animate-in fade-in duration-500`}>
      {activeProduct.title ? (
        <h1
          data-block-id={blockId}
          data-block-seq={seq}
          data-block-role="title"
          data-product-key={activeProduct.key}
          className={`font-bold text-white mb-4 whitespace-pre-line ${switcherBelowHero ? 'text-4xl md:text-5xl' : 'text-5xl leading-none'}`}
          dangerouslySetInnerHTML={{ __html: blockTitle }}
        />
      ) : null}
      {activeProduct.titleSecondary ? (
        <h2
          data-block-id={blockId}
          data-block-seq={seq}
          data-block-role="titleSecondary"
          data-product-key={activeProduct.key}
          className="text-3xl leading-9 font-bold text-primary mb-6"
          dangerouslySetInnerHTML={{ __html: titleSecondary }}
        />
      ) : null}
      {activeProduct.subtitle ? (
        <p
          data-block-id={blockId}
          data-block-seq={seq}
          data-block-role="subtitle"
          data-product-key={activeProduct.key}
          className={switcherBelowHero ? 'text-white/80 text-xl' : 'text-white/90 text-lg mb-8 leading-relaxed'}
        >
          <DynamicText text={activeProduct.subtitle} />
        </p>
      ) : null}

      {hasDetailButton || hasTrialButton ? (
        <div className={`flex flex-wrap gap-3 ${switcherBelowHero ? 'justify-center mt-8' : ''}`}>
          {hasDetailButton ? (
            <Link href={activeProduct.detailButtonLink}>
              <Button
                data-block-id={blockId}
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
                data-block-id={blockId}
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
  );
}

function ProductHero({ block, hasIframe, seq }: { block: HeroBlock; hasIframe: boolean; seq: number }) {
  const products = block.products || emptyHeroProducts;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productSelection = useOptionalProductSelection();
  const queryProduct = searchParams.get('product');
  const [localProductKey, setLocalProductKey] = useState<HeroProductKey>(() =>
    resolveProductKey(queryProduct, products, block.defaultProduct)
  );
  const activeProductKey = resolveProductKey(
    productSelection?.product || localProductKey,
    products,
    block.defaultProduct
  );

  useEffect(() => {
    if (productSelection) return;

    setLocalProductKey(currentProduct => {
      if (queryProduct === 'hr' || queryProduct === 'pms') {
        return resolveProductKey(queryProduct, products, block.defaultProduct);
      }
      if (products.some(product => product.key === currentProduct)) return currentProduct;
      return resolveProductKey(null, products, block.defaultProduct);
    });
  }, [block.defaultProduct, productSelection, products, queryProduct]);

  useEffect(() => {
    if (!hasIframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'SET_HERO_PRODUCT') return;
      if (event.data.blockId !== block.id) return;
      const nextProduct = resolveProductKey(event.data.productKey, products, block.defaultProduct);
      if (productSelection) {
        productSelection.selectProduct(nextProduct, { syncUrl: false });
      } else {
        setLocalProductKey(nextProduct);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [block.defaultProduct, block.id, hasIframe, productSelection, products]);

  const activeProduct = products.find(product => product.key === activeProductKey) || products[0];

  if (!activeProduct) return null;

  const switcherBelowHero = block.productSwitcherPlacement === 'below-hero';

  const selectProduct = (productKey: HeroProductKey) => {
    if (productSelection) {
      productSelection.selectProduct(productKey, { syncUrl: !hasIframe });
      return;
    }

    setLocalProductKey(productKey);
    if (hasIframe) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('product', productKey);
    router.replace(`${pathname}?${params.toString()}${window.location.hash}`, { scroll: false });
  };

  const productSwitcher = (
    <ProductSwitcher
      products={products}
      activeProductKey={activeProductKey}
      switcherBelowHero={switcherBelowHero}
      selectProduct={selectProduct}
    />
  );

  return (
    <>
      <section
        data-block-id={block.id}
        data-block-seq={seq}
        data-block-role="hero"
        data-hero-variant="product-switcher"
        data-switcher-placement={switcherBelowHero ? 'below-hero' : 'hero'}
        className={`relative w-full overflow-hidden ${switcherBelowHero ? 'py-24 md:py-32' : 'min-h-150 flex items-center pt-16'} ${cursorClass(hasIframe)}`}
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

        <div
          className={`relative z-10 mx-auto ${switcherBelowHero ? 'container px-4 text-center' : 'w-[1280px] min-w-[1280px] max-w-[1280px]'}`}
        >
          {!switcherBelowHero && productSwitcher}

          <ProductHeroContent
            key={activeProduct.key}
            activeProduct={activeProduct}
            blockId={block.id}
            seq={seq}
            switcherBelowHero={switcherBelowHero}
          />
        </div>
      </section>
      {switcherBelowHero && (
        <section aria-label="切換適合人群的系統" className="pt-10 bg-secondary">
          <div className="container mx-auto px-4 flex justify-center">{productSwitcher}</div>
        </section>
      )}
    </>
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
