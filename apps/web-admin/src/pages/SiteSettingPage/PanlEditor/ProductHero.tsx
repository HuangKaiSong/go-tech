import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FileUpload,
  Input,
  Label,
  Textarea,
  type UploadedFile
} from '@go-tech-frontend/ui';
import { useEffect, useState } from 'react';
import { type AdminHeroBlock, type AdminHeroProduct, type HeroProductKey } from './type';

const productKeys: HeroProductKey[] = ['pms', 'hr'];

const fallbackProducts: Record<HeroProductKey, AdminHeroProduct> = {
  pms: {
    key: 'pms',
    label: 'PMS 租務系統',
    backgroundImage: '/images/hero-house.jpg',
    backgroundImageAlt: '夕陽下的物業',
    title: '越多物業，\n越易管理！',
    titleSecondary: 'GO-TECH租務系統',
    subtitle: '繳費·分配差餉·查帳·維修確認·租期通知',
    detailButtonText: '了解 PMS 系統',
    detailButtonLink: '/system-features?product=pms',
    trialButtonText: '立即開始14天免費試用',
    trialButtonLink: '/free-trial'
  },
  hr: {
    key: 'hr',
    label: 'HR 人力資源系統',
    backgroundImage: '/images/hero-hr.jpg',
    backgroundImageAlt: '現代化辦公室團隊協作',
    title: '越多員工，\n越要高效管理！',
    titleSecondary: 'GO-TECH HR 人力資源管理系統',
    subtitle: '一站式處理員工資料、入職離職、考勤假期、薪資績效及培訓管理，讓 HR 工作更簡單、更準確、更高效。',
    detailButtonText: '了解 HR 系統',
    detailButtonLink: '/system-features?product=hr',
    trialButtonText: '立即開始14天免費試用',
    trialButtonLink: '/free-trial'
  }
};

const normalizeProducts = (products?: AdminHeroProduct[]) =>
  productKeys.map(key => products?.find(product => product.key === key) || fallbackProducts[key]);

const resolvePreviewUrl = (url: string) => {
  if (!url.startsWith('/')) return url;
  return `${import.meta.env.VITE_H5_SITE_URL}${url}`;
};

type OverlayGradientColors = {
  middleColor: string;
  middleOpacity: number;
  startColor: string;
  startOpacity: number;
};

const defaultOverlayGradientColors: OverlayGradientColors = {
  middleColor: '#29303d',
  middleOpacity: 0.5,
  startColor: '#29303d',
  startOpacity: 0.8
};

const parseCssColor = (value?: string) => {
  if (!value) return null;

  const hex = value.match(/^#([\da-f]{6})$/i);
  if (hex) return { color: `#${hex[1].toLowerCase()}`, opacity: 1 };

  const rgb = value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i);
  if (!rgb) return null;

  const color = `#${rgb
    .slice(1, 4)
    .map(channel => Math.min(255, Number(channel)).toString(16).padStart(2, '0'))
    .join('')}`;

  return {
    color,
    opacity: rgb[4] === undefined ? 1 : Number(rgb[4])
  };
};

const parseOverlayGradient = (gradient?: string): OverlayGradientColors => {
  const colorStops = gradient?.match(/rgba?\([^)]*\)|#[\da-f]{6}/gi) || [];
  const start = parseCssColor(colorStops[0]);
  const middle = parseCssColor(colorStops[1]);

  return {
    startColor: start?.color || defaultOverlayGradientColors.startColor,
    startOpacity: start?.opacity ?? defaultOverlayGradientColors.startOpacity,
    middleColor: middle?.color || start?.color || defaultOverlayGradientColors.middleColor,
    middleOpacity: middle?.opacity ?? defaultOverlayGradientColors.middleOpacity
  };
};

const toRgba = (color: string, opacity: number) => {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

const createOverlayGradient = (colors: OverlayGradientColors) =>
  `linear-gradient(to right, ${toRgba(colors.startColor, colors.startOpacity)}, ${toRgba(colors.middleColor, colors.middleOpacity)}, transparent)`;

function ProductForm({
  onApply,
  onChange,
  product
}: {
  onApply: () => void;
  onChange: (product: AdminHeroProduct) => void;
  product: AdminHeroProduct;
}) {
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const prefix = `hero-${product.key}`;

  const patch = (next: Partial<AdminHeroProduct>) => {
    onChange({ ...product, ...next });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{product.key.toUpperCase()} 背景</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {product.backgroundImage ? (
            <img
              src={resolvePreviewUrl(product.backgroundImage)}
              alt={product.backgroundImageAlt || product.label}
              className="h-36 w-full rounded-lg border border-border object-cover"
            />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-background`}>背景图地址</Label>
            <Input
              id={`${prefix}-background`}
              value={product.backgroundImage}
              onChange={event => patch({ backgroundImage: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>上传背景图</Label>
            <FileUpload
              maxCount={1}
              list={fileList}
              uploadUrl="/api/pms-resource/web-back/minio/upload"
              onChange={files => {
                setFileList(files);
                const uploadedUrl = files.find(file => file.status === 'success')?.url;
                if (uploadedUrl) patch({ backgroundImage: uploadedUrl });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-background-alt`}>图片说明</Label>
            <Input
              id={`${prefix}-background-alt`}
              value={product.backgroundImageAlt || ''}
              onChange={event => patch({ backgroundImageAlt: event.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{product.key.toUpperCase()} 文案</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-label`}>切换标签</Label>
            <Input
              id={`${prefix}-label`}
              value={product.label}
              onChange={event => patch({ label: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-title`}>主标题</Label>
            <Textarea
              id={`${prefix}-title`}
              rows={3}
              value={product.title}
              onChange={event => patch({ title: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-secondary-title`}>系统标题</Label>
            <Input
              id={`${prefix}-secondary-title`}
              value={product.titleSecondary}
              onChange={event => patch({ titleSecondary: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subtitle`}>说明</Label>
            <Textarea
              id={`${prefix}-subtitle`}
              rows={4}
              value={product.subtitle}
              onChange={event => patch({ subtitle: event.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{product.key.toUpperCase()} 按钮</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-detail-text`}>了解按钮文案</Label>
              <Input
                id={`${prefix}-detail-text`}
                value={product.detailButtonText}
                onChange={event => patch({ detailButtonText: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-detail-link`}>了解按钮链接</Label>
              <Input
                id={`${prefix}-detail-link`}
                value={product.detailButtonLink}
                onChange={event => patch({ detailButtonLink: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-trial-text`}>试用按钮文案</Label>
              <Input
                id={`${prefix}-trial-text`}
                value={product.trialButtonText}
                onChange={event => patch({ trialButtonText: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-trial-link`}>试用按钮链接</Label>
              <Input
                id={`${prefix}-trial-link`}
                value={product.trialButtonLink}
                onChange={event => patch({ trialButtonLink: event.target.value })}
              />
            </div>
          </div>
          <Button className="w-full" onClick={onApply}>
            应用 {product.key.toUpperCase()} 设置到预览
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductHero({
  activeProduct,
  block,
  blockSeq,
  onPatchBlock
}: {
  activeProduct: HeroProductKey;
  block: AdminHeroBlock;
  blockSeq?: number;
  onPatchBlock: (blockId: string, blockSeq: number | undefined, patch: Partial<AdminHeroBlock>) => void;
}) {
  const [defaultProduct, setDefaultProduct] = useState<HeroProductKey>(block.defaultProduct || 'pms');
  const [overlayColors, setOverlayColors] = useState(() => parseOverlayGradient(block.overlayGradient));
  const [products, setProducts] = useState(() => normalizeProducts(block.products));
  const overlayGradient = createOverlayGradient(overlayColors);

  useEffect(() => {
    setDefaultProduct(block.defaultProduct || 'pms');
    setOverlayColors(parseOverlayGradient(block.overlayGradient));
    setProducts(normalizeProducts(block.products));
  }, [block.defaultProduct, block.overlayGradient, block.products]);

  const updateProduct = (nextProduct: AdminHeroProduct) => {
    setProducts(current => current.map(product => (product.key === nextProduct.key ? nextProduct : product)));
  };

  const applyProduct = () => {
    onPatchBlock(block.id, blockSeq, { products });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hero 产品切换设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="hero-default-product">默认显示产品</Label>
            <select
              id="hero-default-product"
              value={defaultProduct}
              onChange={event => setDefaultProduct(event.target.value as HeroProductKey)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="pms">PMS</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <div className="space-y-3">
            <Label>遮罩渐变颜色</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="hero-overlay-start-color" className="text-xs text-muted-foreground">
                  起始色
                </Label>
                <Input
                  id="hero-overlay-start-color"
                  type="color"
                  value={overlayColors.startColor}
                  onChange={event => setOverlayColors(current => ({ ...current, startColor: event.target.value }))}
                  className="h-10 cursor-pointer p-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-overlay-middle-color" className="text-xs text-muted-foreground">
                  过渡色
                </Label>
                <Input
                  id="hero-overlay-middle-color"
                  type="color"
                  value={overlayColors.middleColor}
                  onChange={event => setOverlayColors(current => ({ ...current, middleColor: event.target.value }))}
                  className="h-10 cursor-pointer p-1"
                />
              </div>
            </div>
            <div
              aria-label="遮罩渐变预览"
              className="h-10 rounded-md border border-border"
              style={{ background: overlayGradient }}
            />
            <p className="text-xs text-muted-foreground">颜色会保留当前透明度，并向右渐变至透明。</p>
          </div>
          <Button
            className="w-full"
            onClick={() => onPatchBlock(block.id, blockSeq, { defaultProduct, overlayGradient })}
          >
            应用公共设置到预览
          </Button>
        </CardContent>
      </Card>

      <ProductForm
        product={products.find(product => product.key === activeProduct) || fallbackProducts[activeProduct]}
        onChange={updateProduct}
        onApply={applyProduct}
      />
    </div>
  );
}
