import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FileUpload,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  type UploadedFile
} from '@go-tech-frontend/ui';
import { useAsyncEffect } from 'ahooks';
import { RefreshCcwIcon } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';
import {
  type AdminAudienceBlock,
  type AdminAudienceItem,
  type AdminAudienceProduct,
  type AdminSectionBlock,
  type AdminSectionProduct,
  type HeroProductKey
} from '@/pages/SiteSettingPage/PanlEditor/type';
import { fetchAndConvertToFile, rgbToHex } from '../utils';

function getStyleValue(element: Element | null, cssProp: string, fallbackCamelProp?: keyof CSSStyleDeclaration) {
  if (!element) return '';
  const snapshotValue = readSnapshotStyle(element, cssProp);
  if (snapshotValue) return snapshotValue;

  const view = element.ownerDocument?.defaultView;
  if (!view) return '';

  const computed = view.getComputedStyle(element);
  if (computed.getPropertyValue(cssProp)) {
    return computed.getPropertyValue(cssProp);
  }

  if (fallbackCamelProp && computed[fallbackCamelProp]) {
    return computed[fallbackCamelProp] as string;
  }

  return '';
}

function readSnapshotStyle(element: Element | null, cssProp: string) {
  if (!element) return '';
  const raw = element.getAttribute('data-computed-style');
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[cssProp] || '';
  } catch {
    return '';
  }
}

export default function Home({
  activeProduct,
  block,
  element,
  onPatchBlock,
  sync
}: {
  activeProduct: HeroProductKey;
  block?: AdminAudienceBlock | AdminSectionBlock;
  element: HTMLElement;
  // oxlint-disable-next-line eslint/max-params
  onPatchBlock: (blockId: string, blockSeq: number | undefined, patch: any, type?: string) => void;
  sync: (payload: Record<string, unknown>) => void;
}) {
  if (!element) return null;

  const role = element.dataset.blockRole || '';
  const blockId = element.dataset.blockId || 'home-section';

  return (
    <Card>
      <CardHeader>
        <CardTitle>首页 ({role || 'Section'})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {blockId.includes('section') ? (
          <Section
            key={element.outerHTML}
            activeProduct={activeProduct}
            block={block?.type === 'section' ? block : undefined}
            element={element}
            sync={sync}
            onPatchBlock={onPatchBlock}
          />
        ) : null}

        {blockId.includes('audiences') ? (
          <Audiences
            key={element.outerHTML}
            activeProduct={activeProduct}
            block={block?.type === 'audiences' ? block : undefined}
            element={element}
            sync={sync}
            onPatchBlock={onPatchBlock}
          />
        ) : null}

        {blockId.includes('testimonial') ? (
          <Testimonial key={element.outerHTML} element={element} sync={sync} onPatchBlock={onPatchBlock} />
        ) : null}
      </CardContent>
    </Card>
  );
}

const defaultSectionProducts: Record<HeroProductKey, AdminSectionProduct> = {
  pms: {
    key: 'pms',
    title: '租務管理系統，一站式解決方案！',
    intro: '簡化繳費、帳單及收款，通過分類輕鬆管理查詢、自動提醒及批量通知到期，省心管理、協心合作。'
  },
  hr: {
    key: 'hr',
    title: '人力資源管理系統，一站式 SaaS 解決方案！',
    intro: '覆蓋人事、考勤、薪資、審批、績效、培訓與報表分析，助企業建立標準化、數碼化的人力資源管理流程。'
  }
};

function Section({
  activeProduct,
  block,
  element,
  onPatchBlock,
  sync
}: {
  activeProduct: HeroProductKey;
  block?: AdminSectionBlock;
  element: HTMLElement;
  // oxlint-disable-next-line eslint/max-params
  onPatchBlock: (blockId: string, blockSeq: number | undefined, patch: any, type?: string) => void;
  sync: (payload: Record<string, unknown>) => void;
}) {
  const blockId = element.dataset.blockId || 'home-section';
  const originTitle = element.querySelector('[data-block-role="title"]');
  const originLine = element.querySelector('[data-block-role="line"]');
  const originIntro = element.querySelector('[data-block-role="intro"]');
  const selectedProductKey = element.dataset.productKey === 'hr' ? 'hr' : 'pms';
  const initialProducts = (['pms', 'hr'] as const).map(key => {
    const configuredProduct = block?.products?.find(product => product.key === key);
    if (configuredProduct) return configuredProduct;

    const visibleContent = key === selectedProductKey;
    if (key === 'pms' && block) {
      return {
        key,
        title: block.title || defaultSectionProducts[key].title,
        intro: block.intro || defaultSectionProducts[key].intro
      };
    }
    if (visibleContent) {
      return {
        key,
        title: originTitle?.textContent || defaultSectionProducts[key].title,
        intro: originIntro?.textContent || defaultSectionProducts[key].intro
      };
    }
    return defaultSectionProducts[key];
  });

  const lineInfo = {
    width: getStyleValue(originLine, 'width').replace('px', ''),
    height: getStyleValue(originLine, 'height').replace('px', ''),
    backgroundColor: rgbToHex(getStyleValue(originLine, 'background-color')),
    bottom: getStyleValue(originLine, 'bottom').replace('px', '')
  };

  const [products, setProducts] = useState<AdminSectionProduct[]>(initialProducts);
  const [titleStyle, setTitleStyle] = useState({
    fontSize: getStyleValue(originTitle, 'font-size', 'fontSize').replace('px', ''),
    color: rgbToHex(getStyleValue(originTitle, 'color'))
  });
  const [line, setLine] = useState(lineInfo);
  const [introStyle, setIntroStyle] = useState({
    fontSize: getStyleValue(originIntro, 'font-size', 'fontSize').replace('px', ''),
    color: rgbToHex(getStyleValue(originIntro, 'color'))
  });

  const updateProduct = (productKey: HeroProductKey, patch: Partial<AdminSectionProduct>) => {
    setProducts(current => current.map(product => (product.key === productKey ? { ...product, ...patch } : product)));
  };

  const patchProductContent = (patch: Partial<AdminSectionBlock>) => {
    const pmsProduct = products.find(product => product.key === 'pms') || defaultSectionProducts.pms;
    onPatchBlock(
      blockId,
      undefined,
      {
        products,
        title: pmsProduct.title,
        intro: pmsProduct.intro,
        ...patch
      },
      'section'
    );
  };

  const applyIntro = (product: AdminSectionProduct) => {
    const style: CSSProperties = {
      fontSize: introStyle.fontSize ? Number(introStyle.fontSize) : '1rem',
      color: introStyle.color || undefined
    };
    sync({
      type: 'UPDATE_ELEMENT_TEXT',
      text: product.intro,
      block: { id: blockId, role: 'intro' }
    });
    sync({
      type: 'UPDATE_ELEMENT_STYLE',
      style,
      block: { id: blockId, role: 'intro' }
    });
    patchProductContent({ introStyle: style });
  };

  const applyLine = () => {
    const lineStyle: CSSProperties = {
      background: line.backgroundColor || undefined,
      height: line.height ? Number(line.height) : '1px',
      width: line.width ? Number(line.width) : '100%',
      bottom: line.bottom ? Number(line.bottom) : undefined
    };

    sync({
      type: 'UPDATE_ELEMENT_STYLE',
      style: lineStyle,
      block: { id: blockId, role: 'line' }
    });

    onPatchBlock(
      blockId,
      undefined,
      {
        lineStyle
      },
      'section'
    );
  };

  const applyTitle = (product: AdminSectionProduct) => {
    const style: CSSProperties = {
      fontSize: titleStyle.fontSize ? Number(titleStyle.fontSize) : '1rem',
      color: titleStyle.color || undefined
    };
    sync({
      type: 'UPDATE_ELEMENT_TEXT',
      text: product.title,
      block: { id: blockId, role: 'title' }
    });
    sync({
      type: 'UPDATE_ELEMENT_STYLE',
      style,
      block: { id: blockId, role: 'title' }
    });
    patchProductContent({ titleStyle: style });
  };

  const product = products.find(item => item.key === activeProduct) || defaultSectionProducts[activeProduct];
  const prefix = `section-${product.key}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{product.key.toUpperCase()} 标题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-title`}>内容</Label>
            <Textarea
              id={`${prefix}-title`}
              rows={3}
              placeholder="输入标题"
              value={product.title}
              onChange={event => updateProduct(product.key, { title: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-title-size`}>字号(px)</Label>
              <Input
                id={`${prefix}-title-size`}
                type="number"
                min="10"
                value={Number(titleStyle.fontSize)}
                onChange={event => setTitleStyle(current => ({ ...current, fontSize: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-title-color`}>文字颜色</Label>
              <Input
                id={`${prefix}-title-color`}
                type="color"
                value={titleStyle.color}
                onChange={event => setTitleStyle(current => ({ ...current, color: event.target.value }))}
              />
            </div>
          </div>
          <Button className="w-full" onClick={() => applyTitle(product)}>
            应用 {product.key.toUpperCase()} 标题
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{product.key.toUpperCase()} 引言</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-intro`}>内容</Label>
            <Textarea
              id={`${prefix}-intro`}
              rows={4}
              placeholder="输入引言"
              value={product.intro}
              onChange={event => updateProduct(product.key, { intro: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-intro-size`}>字号(px)</Label>
              <Input
                id={`${prefix}-intro-size`}
                type="number"
                min="10"
                value={Number(introStyle.fontSize)}
                onChange={event => setIntroStyle(current => ({ ...current, fontSize: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-intro-color`}>文字颜色</Label>
              <Input
                id={`${prefix}-intro-color`}
                type="color"
                value={introStyle.color}
                onChange={event => setIntroStyle(current => ({ ...current, color: event.target.value }))}
              />
            </div>
          </div>
          <Button className="w-full" onClick={() => applyIntro(product)}>
            应用 {product.key.toUpperCase()} 引言
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>分割線</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="bgColor">颜色</Label>
            <Input
              id="bgColor"
              type="color"
              value={line.backgroundColor}
              onChange={e => {
                setLine(prev => ({
                  ...prev,
                  backgroundColor: e.target.value
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buttonWidth">宽度(px)</Label>
            <Input
              id="buttonWidth"
              type="number"
              min="0"
              value={Number(line.width)}
              onChange={e =>
                setLine(prev => ({
                  ...prev,
                  width: e.target.value
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buttonHeight">高度(px)</Label>
            <Input
              id="buttonHeight"
              type="number"
              min="0"
              value={Number(line.height)}
              onChange={e =>
                setLine(prev => ({
                  ...prev,
                  height: e.target.value
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bottom">位置(px)</Label>
            <Input
              id="bottom"
              type="number"
              value={Number(line.bottom)}
              onChange={e =>
                setLine(prev => ({
                  ...prev,
                  bottom: e.target.value
                }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applyLine}>
              应用
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type AudienceEditorItem = AdminAudienceItem & {
  fileList?: UploadedFile[];
  prevSrc: string;
};

type AudienceEditorProduct = Omit<AdminAudienceProduct, 'audiences'> & {
  audiences: AudienceEditorItem[];
};

const defaultAudienceProducts: Record<HeroProductKey, AdminAudienceItem[]> = {
  pms: [
    {
      title: '擁有出租物業的個人業主',
      description: '管理一至數個出租單位，需要處理租戶溝通、租金收取和維修訴求。',
      initialSrc: '/images/audience-individual.jpg',
      sort: 9
    },
    {
      title: '擁有多元物業組合的投資型業主',
      description: '管理多個物業（住宅、商業或混合用途），需要追蹤不同物業的收入、支出和租賃狀況。',
      initialSrc: '/images/audience-investor.jpg',
      sort: 8
    },
    {
      title: '地產物管集團',
      description:
        '專為物業集團設計的智能管理平臺，打通從決策到服務的全鏈條，讓數據驅動運營、系統賦能團隊，實現降本增效與品質提升的一體化管理。',
      initialSrc: '/images/audience-overseas.jpg',
      sort: 7
    }
  ],
  hr: [
    {
      title: '中小企業',
      description: '沒有專職 HR 團隊？由入職、考勤到出糧一站完成，一人也能管好全公司人事。',
      initialSrc: '/images/audience-individual.jpg',
      sort: 9
    },
    {
      title: '連鎖店及服務業',
      description: '多分店、多更表？支援排班輪更、外勤打卡與跨店調配，考勤薪資自動核算。',
      initialSrc: '/images/audience-investor.jpg',
      sort: 8
    },
    {
      title: '多部門企業',
      description: '架構複雜、審批層級多？部門權限分明，假期審批與績效考核流程標準化。',
      initialSrc: '/images/audience-overseas.jpg',
      sort: 7
    }
  ]
};

const normalizeAudienceSrc = (src: string) => {
  if (!src.startsWith('/_next/image')) return src;

  try {
    return new URL(src, import.meta.env.VITE_H5_SITE_URL).searchParams.get('url') || src;
  } catch {
    return src;
  }
};

const toAudienceEditorItem = (item: AdminAudienceItem): AudienceEditorItem => {
  const initialSrc = normalizeAudienceSrc(item.initialSrc || item.image || '');
  const prevSrc = initialSrc.startsWith('http') ? initialSrc : `${import.meta.env.VITE_H5_SITE_URL}${initialSrc}`;

  return {
    ...item,
    initialSrc,
    prevSrc
  };
};

function Audiences({
  activeProduct,
  block,
  element,
  onPatchBlock,
  sync
}: {
  activeProduct: HeroProductKey;
  block?: AdminAudienceBlock;
  element: HTMLElement;
  // oxlint-disable-next-line eslint/max-params
  onPatchBlock: (blockId: string, blockSeq: number | undefined, patch: any, type?: string) => void;
  sync: (payload: Record<string, unknown>) => void;
}) {
  const snapshotItems = Array.from(element.querySelectorAll('[data-block-role="audiences"]')).map(audience =>
    toAudienceEditorItem({
      sort: (audience as HTMLElement).dataset.blockSeq || '',
      title: audience.querySelector('[data-block-role="title"]')?.textContent || '',
      description: audience.querySelector('[data-block-role="description"]')?.textContent || '',
      initialSrc: (audience.querySelector('[data-block-role="img"]') as HTMLImageElement)?.getAttribute('src') || ''
    })
  );
  const selectedProduct = element.dataset.productKey === 'hr' ? 'hr' : 'pms';
  const initialProducts = (['pms', 'hr'] as const).map(productKey => {
    const configuredProduct = block?.products?.find(product => product.key === productKey);
    const legacyItems = productKey === 'pms' ? block?.audiences : undefined;
    const visibleItems = productKey === selectedProduct && snapshotItems.length > 0 ? snapshotItems : undefined;
    const sourceItems =
      configuredProduct?.audiences || legacyItems || visibleItems || defaultAudienceProducts[productKey];

    return {
      key: productKey,
      audiences: sourceItems.map(toAudienceEditorItem)
    };
  });
  const [products, setProducts] = useState<AudienceEditorProduct[]>(initialProducts);
  const activeItems = products.find(product => product.key === activeProduct)?.audiences || [];
  const [selectedAudienceSort, setSelectedAudienceSort] = useState(() => String(activeItems[0]?.sort || ''));

  useEffect(() => {
    if (activeItems.some(item => String(item.sort) === selectedAudienceSort)) return;
    setSelectedAudienceSort(String(activeItems[0]?.sort || ''));
  }, [activeItems, selectedAudienceSort]);

  const updateAudience = (sort: number | string, patch: Partial<AudienceEditorItem>) => {
    setProducts(current =>
      current.map(product =>
        product.key === activeProduct
          ? {
              ...product,
              audiences: product.audiences.map(item =>
                String(item.sort) === String(sort) ? { ...item, ...patch } : item
              )
            }
          : product
      )
    );
  };

  const applySyncTarget = () => {
    activeItems.forEach(audience => {
      sync({
        type: 'UPDATE_ELEMENT_TEXT',
        text: audience.title,
        block: { id: 'home-audiences', role: 'title', seq: audience.sort }
      });
      sync({
        type: 'UPDATE_ELEMENT_TEXT',
        text: audience.description,
        block: { id: 'home-audiences', role: 'description', seq: audience.sort }
      });
      if (audience.initialSrc) {
        sync({
          type: 'UPDATE_ELEMENT_ATTR',
          attr: 'src',
          value: audience.initialSrc,
          block: { id: 'home-audiences', role: 'img', seq: audience.sort }
        });
      }
    });

    const normalizedProducts: AdminAudienceProduct[] = products.map(product => ({
      key: product.key,
      audiences: product.audiences
        .map(({ description, initialSrc, sort, title }) => ({ description, initialSrc, sort, title }))
        .toSorted((a, b) => Number(b.sort) - Number(a.sort))
    }));
    const pmsAudiences = normalizedProducts.find(product => product.key === 'pms')?.audiences || [];

    onPatchBlock(
      'home-audiences',
      undefined,
      {
        audiences: pmsAudiences,
        products: normalizedProducts
      },
      'audiences'
    );
  };

  useEffect(() => {
    let cancelled = false;

    const loadFiles = async () => {
      const nextItems = await Promise.all(
        initialProducts.map(async product => ({
          ...product,
          audiences: await Promise.all(
            product.audiences.map(async audience => {
              if (!audience.initialSrc) return audience;

              try {
                const file = await fetchAndConvertToFile(audience.initialSrc);
                return {
                  ...audience,
                  fileList: [
                    {
                      file,
                      previewUrl: audience.prevSrc,
                      status: 'success' as const,
                      progress: 100,
                      url: audience.initialSrc,
                      id: audience.prevSrc || audience.initialSrc
                    }
                  ]
                };
              } catch {
                return audience;
              }
            })
          )
        }))
      );

      if (!cancelled) {
        setProducts(nextItems);
      }
    };

    loadFiles();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  return (
    <Tabs value={selectedAudienceSort} onValueChange={setSelectedAudienceSort}>
      <div className="flex items-center justify-between mb-4">
        <TabsList className="flex items-center gap-4">
          {activeItems.map((audience, index) => (
            <TabsTrigger key={audience.sort} value={String(audience.sort)}>
              {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button onClick={applySyncTarget}>
          <RefreshCcwIcon />
          应用 {activeProduct.toUpperCase()}
        </Button>
      </div>
      {activeItems.map(audience => {
        return (
          <TabsContent key={audience.sort} value={String(audience.sort)} className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor={`audience-${activeProduct}-${audience.sort}-image`}>背景图</Label>
              <FileUpload
                maxCount={1}
                uploadUrl="/api/pms-resource/web-back/minio/upload"
                list={audience.fileList}
                onChange={files => {
                  const file = files.find(f => f.status === 'success');
                  updateAudience(audience.sort, {
                    fileList: file ? files : [],
                    prevSrc: file?.previewUrl || '',
                    initialSrc: file?.url || ''
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`audience-${activeProduct}-${audience.sort}-title`}>標題</Label>
              <Input
                id={`audience-${activeProduct}-${audience.sort}-title`}
                placeholder="输入文字"
                value={audience.title}
                onChange={event => updateAudience(audience.sort, { title: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`audience-${activeProduct}-${audience.sort}-description`}>描述</Label>
              <Textarea
                id={`audience-${activeProduct}-${audience.sort}-description`}
                value={audience.description}
                onChange={event => updateAudience(audience.sort, { description: event.target.value })}
                rows={3}
                placeholder="输入文字"
              />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function Testimonial({
  element,
  onPatchBlock,
  sync
}: {
  element: HTMLElement;
  // oxlint-disable-next-line eslint/max-params
  onPatchBlock: (blockId: string, blockSeq: number | undefined, patch: any, type?: string) => void;
  sync: (payload: Record<string, unknown>) => void;
}) {
  const titleContent = element.querySelector('[data-block-role="title"]')?.textContent || '';
  const descriptionContent = element.querySelector('[data-block-role="description"]')?.textContent || '';
  const itemsContent = element.querySelector('[data-block-role="items"]')?.childNodes || [];
  const initialImage = element.querySelector('[data-block-role="image"]')?.getAttribute('src') || '';

  const [title, setTitle] = useState(titleContent);
  const [description, setDescription] = useState(descriptionContent);
  const [items, setItems] = useState(() => {
    return Array.from(itemsContent).map(node => {
      const text = (node as HTMLElement).textContent || '';
      return text.replace(/^\s*-\s*/, '');
    });
  });

  const [fileList, setFileList] = useState<UploadedFile[]>([]);

  useAsyncEffect(async () => {
    let prevSrc = initialImage;
    const file = await fetchAndConvertToFile(initialImage);
    if (initialImage.startsWith('/_next')) {
      prevSrc = `/h5-hook${prevSrc}`;
    }

    setFileList([
      {
        file,
        previewUrl: prevSrc,
        status: 'success',
        progress: 100,
        url: initialImage,
        id: prevSrc || initialImage
      }
    ]);
  }, [initialImage]);

  const applySync = () => {
    const file = fileList?.find(item => item.status === 'success');
    const patchData: {
      description: string;
      image?: string;
      items: string[];
      title: string;
    } = {
      title,
      description,
      items
    };

    sync({
      type: 'UPDATE_ELEMENT_TEXT',
      text: patchData.title,
      block: { id: 'home-testimonial', role: 'title' }
    });
    sync({
      type: 'UPDATE_ELEMENT_TEXT',
      text: patchData.description,
      block: { id: 'home-testimonial', role: 'description' }
    });

    let el = ``;
    patchData.items.forEach(item => {
      el += `<div>- ${item}</div>`;
    });

    sync({
      type: 'SET_ELEMENT',
      element: el,
      block: { id: 'home-testimonial', role: 'items' }
    });

    if (file) {
      patchData.image = file.url;
      sync({
        type: 'UPDATE_ELEMENT_ATTR',
        attr: 'src',
        value: file.url,
        block: { id: 'home-testimonial', role: 'image' }
      });
    }

    // 准备 blocks
    onPatchBlock('home-testimonial', undefined, patchData, 'testimonial');
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-lg">
          标题
        </Label>
        <Textarea
          id="title"
          rows={3}
          placeholder="输入文字"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-lg" htmlFor="description">
          描述
        </Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="输入文字"
          value={description}
          onChange={e => {
            setDescription(e.target.value);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="textContent" className="text-lg">
          项目
        </Label>
        <div className="space-y-1">
          {items.map((item, index) => (
            <Textarea
              key={index}
              cols={1}
              placeholder="输入文字"
              value={item}
              onChange={e => {
                const value = e.target.value;
                setItems(prev => {
                  const next = [...prev];
                  next[index] = value;
                  return next;
                });
              }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="image" className="text-lg">
          图
        </Label>
        <FileUpload
          maxCount={1}
          uploadUrl="/api/pms-resource/web-back/minio/upload"
          list={fileList}
          onChange={files => {
            setFileList(files);
          }}
        />
      </div>
      <div className="flex">
        <Button className="flex-1" onClick={applySync}>
          应用
        </Button>
      </div>
    </>
  );
}
