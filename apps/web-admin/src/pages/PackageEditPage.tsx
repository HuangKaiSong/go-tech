import { PackageItem } from "@/mocks/packages";
import { Button, Checkbox, Input, Switch, toast } from "@go-tech-frontend/ui";
import { useMutation, useQueries } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronRight, Package } from "lucide-react";
import { useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface FeatureItem {
  id: string;
  label: string;
  checked: boolean;
}

interface FeatureGroup {
  id: string;
  title: string;
  expanded: boolean;
  items: FeatureItem[];
}

interface PackageState {
  packageData: PackageItem | null;
  status: number;
  featureGroups: FeatureGroup[];
  priceSettings: {
    price: number;
    addUnitPrice?: number;
    rentSysPrice?: number;
    venueSysPrice?: number;
    accountingSysPrice?: number;
    custServiceSysPrice?: number;
  };
}

type PackageAction =
  | { type: "SET_PACKAGE_DATA"; payload: PackageItem }
  | { type: "SET_STATUS"; payload: number }
  | { type: "SET_FEATURE_GROUPS"; payload: FeatureGroup[] }
  | {
      type: "UPDATE_PRICE_SETTING";
      field: keyof PackageState["priceSettings"];
      value: number;
    }
  | { type: "RESET_STATE" };

const packageReducer = (
  state: PackageState,
  action: PackageAction,
): PackageState => {
  switch (action.type) {
    case "SET_PACKAGE_DATA":
      return {
        ...state,
        packageData: action.payload,
      };
    case "SET_STATUS":
      return {
        ...state,
        status: action.payload,
      };
    case "SET_FEATURE_GROUPS":
      return {
        ...state,
        featureGroups: action.payload,
      };
    case "UPDATE_PRICE_SETTING":
      return {
        ...state,
        priceSettings: {
          ...state.priceSettings,
          [action.field]: action.value,
        },
      };
    case "RESET_STATE":
      return defaultState;
    default:
      return state;
  }
};

const defaultState: PackageState = {
  packageData: {
    packageName: "",
    unitCount: 0,
    price: 0,
    addUnitPrice: undefined,
    rentSysPrice: undefined,
    venueSysPrice: undefined,
    accountingSysPrice: undefined,
    custServiceSysPrice: undefined,
    status: 0,
    packageItemList: [],
  },
  status: 0,
  featureGroups: [],
  priceSettings: {
    price: 0,
    addUnitPrice: undefined,
    rentSysPrice: undefined,
    venueSysPrice: undefined,
    accountingSysPrice: undefined,
    custServiceSysPrice: undefined,
  },
};

const PackageEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [state, dispatch] = useReducer(packageReducer, defaultState);

  const updateMun = useMutation({
    mutationFn: async (data: PackageItem) => {
      const response = await fetch(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      if (result && result.code === 200) {
        navigate("/packages", { replace: true });
        return;
      }
      toast.error(result.message || "更新失败");
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PackageItem) => {
      const response = await fetch(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      if (result && result.code === 200) {
        navigate("/packages", { replace: true });
        return;
      }
      toast.error(result.message || "更新失败");
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  /**
   * Load package data when id changes
   */
  const result = useQueries({
    queries: [
      {
        queryKey: ["platform/platformPackage/detail", id],
        enabled: !!id,
        queryFn: async () => {
          const response = await fetch(
            `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/detail/${id}`,
          );
          const data = await response.json();
          if (data.code !== 200) {
            return [];
          }

          if (!data.data) {
            return;
          }
          return data.data;
        },
      },
      {
        queryKey: ["platform/platformPackage/menuTree"],
        queryFn: async () => {
          const res = await fetch(
            `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/menuTree`,
          );
          const response = await res.json();
          if (response.code !== 200) {
            return [];
          }

          if (!response.data) {
            return [];
          }

          if (!Array.isArray(response.data)) {
            return [];
          }

          return response.data.map((item) => {
            return {
              id: item.id,
              title: item.title,
              expanded: true,
              items: item.children.map((child) => {
                return {
                  id: child.id,
                  label: child.title,
                  checked: false,
                };
              }),
            };
          });
        },
      },
    ],
    combine: ([detail, tree]) => {
      const result = {
        packageinfo: defaultState.packageData,
        tree: [],
      };
      if (detail.status === "success") {
        result.packageinfo = detail.data;
      }
      if (tree.status === "success") {
        result.tree = tree.data;
      }
      return result;
    },
  });

  useEffect(() => {
    if (!result) return;
    const { packageinfo, tree } = result;
    if (packageinfo && tree) {
      dispatch({
        type: "SET_PACKAGE_DATA",
        payload: packageinfo as unknown as PackageItem,
      });
      dispatch({ type: "SET_STATUS", payload: packageinfo.status });
      dispatch({
        type: "UPDATE_PRICE_SETTING",
        field: "price", // 套餐价格
        value: (packageinfo as any).price,
      });
      dispatch({
        type: "UPDATE_PRICE_SETTING",
        field: "addUnitPrice", // 附加 - 單位價格
        value: (packageinfo as any).addUnitPrice,
      });
      dispatch({
        type: "UPDATE_PRICE_SETTING",
        field: "rentSysPrice", // 附加 - 租務系統價格
        value: packageinfo.rentSysPrice,
      });
      dispatch({
        type: "UPDATE_PRICE_SETTING",
        field: "venueSysPrice", // 附加 - 租務系統價格
        value: packageinfo.venueSysPrice,
      });
      dispatch({
        type: "UPDATE_PRICE_SETTING",
        field: "accountingSysPrice", // 附加 - 租務系統價格
        value: packageinfo.accountingSysPrice,
      });
      dispatch({
        type: "UPDATE_PRICE_SETTING",
        field: "custServiceSysPrice", // 附加 - 租務系統價格
        value: packageinfo.custServiceSysPrice,
      });

      // 设置菜单打 ✅ 逻辑
      const haveids = ((packageinfo as any)?.packageItemList || [])
        .filter((i) => i.status)
        .map((i) => i.menuId);

      const menuTree = tree.map((item) => {
        const items =
          item.items?.map((i) => ({
            ...i,
            checked: haveids.includes(i.id),
          })) || [];
        return {
          ...item,
          items,
        };
      });

      dispatch({
        type: "SET_FEATURE_GROUPS",
        payload: menuTree,
      });
    }
  }, [result]);

  const toggleGroup = (groupId: string) => {
    const featureGroup = state.featureGroups.map((g) =>
      g.id === groupId ? { ...g, expanded: !g.expanded } : g,
    );
    dispatch({
      type: "SET_FEATURE_GROUPS",
      payload: featureGroup,
    });
  };

  const toggleFeature = (groupId: string, itemId: string) => {
    const featureGroup = state.featureGroups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            items: g.items.map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item,
            ),
          }
        : g,
    );

    dispatch({
      type: "SET_FEATURE_GROUPS",
      payload: featureGroup,
    });
  };

  const handleBack = () => {
    navigate("/packages");
  };

  if (!state.packageData) {
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
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <span className="text-lg font-medium">
              {state.packageData.id ? "編輯" : "新增"}套餐內容 -{" "}
              {state.packageData.packageName}
            </span>
          </div>
          <Button
            loading={updateMun.isPending}
            onClick={() => {
              const packageItemList = state.featureGroups
                .map((group) =>
                  group.items.filter((feature) => feature.checked),
                )
                .flat()
                .map((menu) => ({ menuId: menu.id, menuTitle: menu.label }));
              const data: PackageItem = {
                ...state.packageData,
                ...state.priceSettings,
                status: state.status,
                packageItemList,
              };
              if (state.packageData.id) {
                updateMun.mutate(data);
              } else {
                createMutation.mutate(data);
              }
            }}
          >
            保存
          </Button>
        </div>

        {/* Package Info Header */}
        <div className="grid grid-cols-4 bg-muted/50 border-b border-border">
          <div className="p-4 font-medium text-center border-r border-border">
            套餐名稱
          </div>
          <div className="p-4 font-medium text-center border-r border-border">
            最大單位數量
          </div>
          <div className="p-4 font-medium text-center border-r border-border">
            套餐狀態
          </div>
          <div className="p-4 font-medium text-center">套餐價格</div>
        </div>
        <div className="grid grid-cols-4 border-b border-border">
          <div className="p-4 flex justify-center items-center border-r border-border">
            <Input
              placeholder="輸入套餐名稱"
              className="w-32 text-center"
              value={state.packageData.packageName}
              onChange={(e) => {
                dispatch({
                  type: "SET_PACKAGE_DATA",
                  payload: {
                    ...state.packageData,
                    packageName: e.target.value,
                  },
                });
              }}
            />
          </div>

          <div className="p-4 flex justify-center items-center border-r border-border">
            <Input
              placeholder="輸入最大單位數量"
              className="w-32 text-center"
              value={state.packageData.unitCount}
              onChange={(e) => {
                if (e.target.value) {
                  dispatch({
                    type: "SET_PACKAGE_DATA",
                    payload: {
                      ...state.packageData,
                      unitCount: parseFloat(e.target.value),
                    },
                  });
                }
              }}
            />
          </div>

          <div className="p-4 flex justify-center items-center border-r border-border">
            <Switch
              checked={state.status === 1}
              onCheckedChange={(checked) => {
                dispatch({ type: "SET_STATUS", payload: checked ? 1 : 0 });
              }}
            />
          </div>
          <div className="p-4 flex justify-center border-r border-border">
            <Input
              placeholder="輸入價格"
              className="w-32 text-center"
              value={state.priceSettings.price}
              onChange={(e) => {
                if (e.target.value) {
                  dispatch({
                    type: "UPDATE_PRICE_SETTING",
                    field: "price",
                    value: parseFloat(e.target.value),
                  });
                }
              }}
            />
          </div>
        </div>

        {/* Feature Content */}
        <div className="border-b border-border">
          <div className="p-4 font-medium flex items-start justify-center bg-muted/30 border-r border-border">
            套餐內容
          </div>
          <div className="">
            {state.featureGroups.map((group) => (
              <div
                key={group.id}
                className="border-b border-border last:border-b-0 flex justify-center"
              >
                <div className="p-3">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center gap-2 text-primary font-medium mb-2"
                  >
                    {group.expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    {group.title}
                  </button>
                  {group.expanded && (
                    <div className="space-y-2 pl-6">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={() =>
                              toggleFeature(group.id, item.id)
                            }
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Addon Features Label */}
        <div className="grid grid-cols-1 border-b border-border">
          <div className="p-4 font-medium text-center bg-muted/30 border-r border-border">
            附加功能
          </div>
        </div>

        {/* Addon Prices */}
        <div className="grid grid-cols-2 border-b border-border">
          <div className="p-4 font-medium text-center bg-muted/30 border-r border-border">
            增加單位價格
          </div>
          <div className="p-4 flex justify-center">
            <Input
              placeholder="輸入價格"
              className="w-32 text-center"
              value={state.priceSettings.addUnitPrice}
              onChange={(e) => {
                if (e.target.value) {
                  dispatch({
                    type: "UPDATE_PRICE_SETTING",
                    field: "addUnitPrice",
                    value: parseFloat(e.target.value),
                  });
                }
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-border">
          <div className="p-4 font-medium text-center bg-muted/30 border-r border-border">
            附加租務系統價格
          </div>
          <div className="p-4 flex justify-center">
            <Input
              placeholder="輸入價格"
              className="w-32 text-center"
              value={state.priceSettings.rentSysPrice}
              onChange={(e) => {
                if (e.target.value) {
                  dispatch({
                    type: "UPDATE_PRICE_SETTING",
                    field: "rentSysPrice",
                    value: parseFloat(e.target.value),
                  });
                }
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-border">
          <div className="p-4 font-medium text-center bg-muted/30 border-r border-border">
            附加場務系統價格
          </div>
          <div className="p-4 flex justify-center">
            <Input
              placeholder="輸入價格"
              className="w-32 text-center"
              value={state.priceSettings.venueSysPrice}
              onChange={(e) => {
                if (e.target.value) {
                  dispatch({
                    type: "UPDATE_PRICE_SETTING",
                    field: "venueSysPrice",
                    value: parseFloat(e.target.value),
                  });
                }
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-border">
          <div className="p-4 font-medium text-center bg-muted/30 border-r border-border">
            附加會計系統價格
          </div>
          <div className="p-4 flex justify-center">
            <Input
              placeholder="輸入價格"
              className="w-32 text-center"
              value={state.priceSettings.accountingSysPrice}
              onChange={(e) => {
                if (e.target.value) {
                  dispatch({
                    type: "UPDATE_PRICE_SETTING",
                    field: "accountingSysPrice",
                    value: parseFloat(e.target.value),
                  });
                }
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-4 font-medium text-center bg-muted/30 border-r border-border">
            附加客服系統價格
          </div>
          <div className="p-4 flex justify-center">
            <Input
              placeholder="輸入價格"
              className="w-32 text-center"
              type="number"
              value={state.priceSettings.custServiceSysPrice}
              onChange={(e) => {
                if (e.target.value) {
                  dispatch({
                    type: "UPDATE_PRICE_SETTING",
                    field: "custServiceSysPrice",
                    value: parseFloat(e.target.value),
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageEditPage;
