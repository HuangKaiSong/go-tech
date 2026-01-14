import { Package, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { mockPackages, PackageItem } from "@/mocks/packages";

interface FeatureItem {
  id: string;
  label: string;
  gold: boolean;
  platinum: boolean;
  diamond: boolean;
}

interface FeatureGroup {
  id: string;
  title: string;
  expanded: boolean;
  items: FeatureItem[];
}

const initialFeatureGroups: FeatureGroup[] = [
  {
    id: "management",
    title: "管理層",
    expanded: true,
    items: [
      { id: "menu", label: "菜單列表", gold: true, platinum: true, diamond: true },
      { id: "role", label: "角色列表", gold: true, platinum: true, diamond: true },
      { id: "business", label: "業務字典", gold: true, platinum: true, diamond: true },
      { id: "user", label: "使用者列表", gold: false, platinum: true, diamond: true },
      { id: "dept", label: "部門列表", gold: false, platinum: false, diamond: false },
      { id: "venue", label: "場地列表", gold: false, platinum: true, diamond: true },
      { id: "contract", label: "合同簽批", gold: false, platinum: true, diamond: false },
      { id: "price", label: "標準價格列表", gold: true, platinum: true, diamond: true },
      { id: "system", label: "系統文件設定", gold: true, platinum: true, diamond: true },
    ],
  },
  {
    id: "rental",
    title: "租務部",
    expanded: true,
    items: [
      { id: "agent", label: "代理列表", gold: false, platinum: true, diamond: true },
      { id: "customer", label: "客戶列表", gold: false, platinum: false, diamond: false },
      { id: "inquiry", label: "問盤列表", gold: false, platinum: false, diamond: false },
      { id: "agreement", label: "合同列表", gold: false, platinum: true, diamond: false },
      { id: "marketing", label: "營銷列表", gold: false, platinum: true, diamond: true },
    ],
  },
  {
    id: "facility",
    title: "場務部",
    expanded: true,
    items: [
      { id: "unit", label: "單位列表", gold: true, platinum: true, diamond: true },
      { id: "utility", label: "水電列表", gold: false, platinum: true, diamond: false },
      { id: "followup", label: "跟進列表", gold: false, platinum: true, diamond: true },
      { id: "schedule", label: "日程", gold: true, platinum: true, diamond: true },
    ],
  },
  {
    id: "accounting",
    title: "會計部",
    expanded: true,
    items: [
      { id: "expense", label: "費用單列表", gold: false, platinum: false, diamond: true },
      { id: "rental-tool", label: "租單工具", gold: false, platinum: true, diamond: true },
      { id: "check", label: "支票列表", gold: true, platinum: true, diamond: true },
    ],
  },
];

const PackageEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [featureGroups, setFeatureGroups] = useState(initialFeatureGroups);
  const [packageData, setPackageData] = useState<PackageItem | null>(null);
  
  // Form states initialized from package data
  const [unitSettings] = useState({ gold: 25, platinum: 100, diamond: 400 });
  const [priceSettings, setPriceSettings] = useState({ gold: "", platinum: "", diamond: "" });
  const [addonPrices, setAddonPrices] = useState({
    extraUnit: { gold: "", platinum: "", diamond: "" },
    rentalSystem: { gold: "", platinum: "", diamond: "" },
    facilitySystem: { gold: "", platinum: "", diamond: "" },
    accountingSystem: { gold: "", platinum: "", diamond: "" },
    customerService: { gold: "", platinum: "", diamond: "" },
  });
  const [status, setStatus] = useState(false);

  // Load package data when id changes
  useEffect(() => {
    if (id) {
      const foundPackage = mockPackages.find(pkg => pkg.id === id);
      if (foundPackage) {
        setPackageData(foundPackage);
        setStatus(foundPackage.status);
        
        // Initialize price settings based on package type
        if (foundPackage.packageName === "黃金套餐") {
          setPriceSettings({ gold: String(foundPackage.packagePrice), platinum: "", diamond: "" });
          setAddonPrices({
            extraUnit: { gold: String(foundPackage.extraUnitPrice), platinum: "", diamond: "" },
            rentalSystem: { gold: String(foundPackage.rentalSystemPrice), platinum: "", diamond: "" },
            facilitySystem: { gold: String(foundPackage.facilitySystemPrice), platinum: "", diamond: "" },
            accountingSystem: { gold: String(foundPackage.accountingSystemPrice), platinum: "", diamond: "" },
            customerService: { gold: String(foundPackage.customerServicePrice), platinum: "", diamond: "" },
          });
        } else if (foundPackage.packageName === "白金套餐") {
          setPriceSettings({ gold: "", platinum: String(foundPackage.packagePrice), diamond: "" });
          setAddonPrices({
            extraUnit: { gold: "", platinum: String(foundPackage.extraUnitPrice), diamond: "" },
            rentalSystem: { gold: "", platinum: String(foundPackage.rentalSystemPrice), diamond: "" },
            facilitySystem: { gold: "", platinum: String(foundPackage.facilitySystemPrice), diamond: "" },
            accountingSystem: { gold: "", platinum: String(foundPackage.accountingSystemPrice), diamond: "" },
            customerService: { gold: "", platinum: String(foundPackage.customerServicePrice), diamond: "" },
          });
        } else if (foundPackage.packageName === "鑽石套餐") {
          setPriceSettings({ gold: "", platinum: "", diamond: String(foundPackage.packagePrice) });
          setAddonPrices({
            extraUnit: { gold: "", platinum: "", diamond: String(foundPackage.extraUnitPrice) },
            rentalSystem: { gold: "", platinum: "", diamond: String(foundPackage.rentalSystemPrice) },
            facilitySystem: { gold: "", platinum: "", diamond: String(foundPackage.facilitySystemPrice) },
            accountingSystem: { gold: "", platinum: "", diamond: String(foundPackage.accountingSystemPrice) },
            customerService: { gold: "", platinum: "", diamond: String(foundPackage.customerServicePrice) },
          });
        }
      }
    }
  }, [id]);

  const toggleGroup = (groupId: string) => {
    setFeatureGroups(groups =>
      groups.map(g =>
        g.id === groupId ? { ...g, expanded: !g.expanded } : g
      )
    );
  };

  const handleBack = () => {
    navigate("/packages");
  };

  if (!packageData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">套餐內容設定</h1>
        </div>
        <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
          找不到套餐資料
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">套餐內容設定</h1>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Header with back button and save button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <span className="text-lg font-medium">編輯套餐內容</span>
          </div>
          <Button onClick={() => navigate("/packages")}>
            保存
          </Button>
        </div>

        {/* Package Info Header */}
        <div className="grid grid-cols-5 bg-muted/50 border-b border-border">
          <div className="p-4 font-medium text-center border-r border-border">訂單編號</div>
          <div className="p-4 font-medium text-center border-r border-border">套餐名稱</div>
          <div className="p-4 font-medium text-center border-r border-border">最大單位數量</div>
          <div className="p-4 font-medium text-center border-r border-border">套餐狀態</div>
          <div className="p-4 font-medium text-center">套餐價格</div>
        </div>
        <div className="grid grid-cols-5 border-b border-border">
          <div className="p-4 text-center border-r border-border">{packageData.orderNo}</div>
          <div className="p-4 text-center border-r border-border text-primary font-medium">{packageData.packageName}</div>
          <div className="p-4 text-center border-r border-border">{packageData.maxUnits}</div>
          <div className="p-4 flex justify-center border-r border-border">
            <Switch checked={status} onCheckedChange={setStatus} />
          </div>
          <div className="p-4 text-center">${packageData.packagePrice}</div>
        </div>

        {/* Package Tier Headers */}
        <div className="grid grid-cols-4 bg-muted/30 border-b border-border">
          <div className="p-4 font-medium text-center">套餐名稱</div>
          <div className="p-4 font-medium text-center text-primary">黃金套餐</div>
          <div className="p-4 font-medium text-center text-primary">鉑金套餐</div>
          <div className="p-4 font-medium text-center text-primary">鑽石套餐</div>
        </div>

        {/* Feature Content */}
        <div className="border-b border-border">
          <div className="grid grid-cols-4">
            <div className="p-4 font-medium flex items-start justify-center">套餐內容</div>
            <div className="col-span-3">
              {featureGroups.map((group) => (
                <div key={group.id} className="border-b border-border last:border-b-0">
                  <div className="grid grid-cols-3">
                    {/* Gold Column */}
                    <div className="p-3 border-r border-border">
                      <button 
                        onClick={() => toggleGroup(group.id)}
                        className="flex items-center gap-2 text-primary font-medium mb-2"
                      >
                        {group.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {group.title}
                      </button>
                      {group.expanded && (
                        <div className="space-y-2 pl-6">
                          {group.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Checkbox checked={item.gold} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                              <span className="text-sm">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Platinum Column */}
                    <div className="p-3 border-r border-border">
                      <button 
                        onClick={() => toggleGroup(group.id)}
                        className="flex items-center gap-2 text-primary font-medium mb-2"
                      >
                        {group.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {group.title}
                      </button>
                      {group.expanded && (
                        <div className="space-y-2 pl-6">
                          {group.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Checkbox checked={item.platinum} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                              <span className="text-sm">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Diamond Column */}
                    <div className="p-3">
                      <button 
                        onClick={() => toggleGroup(group.id)}
                        className="flex items-center gap-2 text-primary font-medium mb-2"
                      >
                        {group.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {group.title}
                      </button>
                      {group.expanded && (
                        <div className="space-y-2 pl-6">
                          {group.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Checkbox checked={item.diamond} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                              <span className="text-sm">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unit Settings */}
        <div className="grid grid-cols-4 border-b border-border">
          <div className="p-4 font-medium text-center">單位數量設定</div>
          <div className="p-4 text-center">{unitSettings.gold}</div>
          <div className="p-4 text-center">{unitSettings.platinum}</div>
          <div className="p-4 text-center">{unitSettings.diamond}</div>
        </div>

        {/* Price Settings */}
        <div className="grid grid-cols-4 border-b border-border">
          <div className="p-4 font-medium text-center">套餐價格設定</div>
          <div className="p-4 flex justify-center">
            <Input 
              placeholder="輸入價格" 
              className="w-24 text-center"
              value={priceSettings.gold}
              onChange={(e) => setPriceSettings({...priceSettings, gold: e.target.value})}
            />
          </div>
          <div className="p-4 flex justify-center">
            <Input 
              placeholder="輸入價格" 
              className="w-24 text-center"
              value={priceSettings.platinum}
              onChange={(e) => setPriceSettings({...priceSettings, platinum: e.target.value})}
            />
          </div>
          <div className="p-4 flex justify-center">
            <Input 
              placeholder="輸入價格" 
              className="w-24 text-center"
              value={priceSettings.diamond}
              onChange={(e) => setPriceSettings({...priceSettings, diamond: e.target.value})}
            />
          </div>
        </div>

        {/* Addon Features Label */}
        <div className="grid grid-cols-4 border-b border-border">
          <div className="p-4 font-medium text-center">附加功能</div>
          <div className="p-4"></div>
          <div className="p-4"></div>
          <div className="p-4"></div>
        </div>

        {/* Addon Prices */}
        {[
          { key: "extraUnit", label: "增加單位價格" },
          { key: "rentalSystem", label: "附加租務系統價格" },
          { key: "facilitySystem", label: "附加場務系統價格" },
          { key: "accountingSystem", label: "附加會計系統價格" },
          { key: "customerService", label: "附加客服系統價格" },
        ].map((addon) => (
          <div key={addon.key} className="grid grid-cols-4 border-b border-border last:border-b-0">
            <div className="p-4 font-medium text-center">{addon.label}</div>
            <div className="p-4 flex justify-center">
              <Input 
                placeholder="輸入價格" 
                className="w-24 text-center"
                value={addonPrices[addon.key as keyof typeof addonPrices].gold}
                onChange={(e) => setAddonPrices({
                  ...addonPrices, 
                  [addon.key]: {...addonPrices[addon.key as keyof typeof addonPrices], gold: e.target.value}
                })}
              />
            </div>
            <div className="p-4 flex justify-center">
              <Input 
                placeholder="輸入價格" 
                className="w-24 text-center"
                value={addonPrices[addon.key as keyof typeof addonPrices].platinum}
                onChange={(e) => setAddonPrices({
                  ...addonPrices, 
                  [addon.key]: {...addonPrices[addon.key as keyof typeof addonPrices], platinum: e.target.value}
                })}
              />
            </div>
            <div className="p-4 flex justify-center">
              <Input 
                placeholder="輸入價格" 
                className="w-24 text-center"
                value={addonPrices[addon.key as keyof typeof addonPrices].diamond}
                onChange={(e) => setAddonPrices({
                  ...addonPrices, 
                  [addon.key]: {...addonPrices[addon.key as keyof typeof addonPrices], diamond: e.target.value}
                })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageEditPage;
