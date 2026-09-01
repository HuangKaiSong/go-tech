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
  block,
  blockSeq,
  onPatchBlock,
  sync
}: {
  block: AdminHeroBlock;
  blockSeq?: number;
  onPatchBlock: (blockId: string, blockSeq: number | undefined, patch: Partial<AdminHeroBlock>) => void;
  sync: (payload: Record<string, unknown>) => void;
}) {
  const [activeProduct, setActiveProduct] = useState<HeroProductKey>(block.defaultProduct || 'pms');
  const [defaultProduct, setDefaultProduct] = useState<HeroProductKey>(block.defaultProduct || 'pms');
  const [overlayGradient, setOverlayGradient] = useState(block.overlayGradient || '');
  const [products, setProducts] = useState(() => normalizeProducts(block.products));

  useEffect(() => {
    setDefaultProduct(block.defaultProduct || 'pms');
    setOverlayGradient(block.overlayGradient || '');
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
          <div className="space-y-2">
            <Label htmlFor="hero-overlay-gradient">遮罩渐变</Label>
            <Input
              id="hero-overlay-gradient"
              value={overlayGradient}
              onChange={event => setOverlayGradient(event.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => onPatchBlock(block.id, blockSeq, { defaultProduct, overlayGradient })}
          >
            应用公共设置到预览
          </Button>
        </CardContent>
      </Card>

      <Tabs
        value={activeProduct}
        onValueChange={value => {
          const productKey = value as HeroProductKey;
          setActiveProduct(productKey);
          sync({ type: 'SET_HERO_PRODUCT', blockId: block.id, productKey });
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pms">PMS</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
        </TabsList>
        {products.map(product => (
          <TabsContent key={product.key} value={product.key}>
            <ProductForm product={product} onChange={updateProduct} onApply={applyProduct} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
