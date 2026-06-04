import {
  LayoutDashboard,
  Users,
  
  Clock,
  DollarSign,
  Target,
  GraduationCap,
  Building2,
  BarChart3,
  Settings,
  ChevronDown,
  Bell,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuGroups = [
  {
    label: "總覽",
    items: [
      { title: "儀表板", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "人事管理",
    items: [
      {
        title: "員工管理",
        icon: Users,
        children: [
          { title: "員工資料", url: "/employees" },
          { title: "入職管理", url: "/employees/onboarding" },
          { title: "離職管理", url: "/employees/offboarding" },
        ],
      },
      {
        title: "組織架構",
        icon: Building2,
        children: [
          { title: "部門管理", url: "/organization/departments" },
          { title: "職位管理", url: "/organization/roles" },
          { title: "職位架構", url: "/organization/chart" },
        ],
      },
    ],
  },
  {
    label: "日常管理",
    items: [
      {
        title: "行政管理",
        icon: Clock,
        children: [
          { title: "打卡管理", url: "/attendance/clock-in" },
          { title: "打卡記錄", url: "/attendance/records" },
          { title: "審批管理", url: "/attendance/approval" },
        ],
      },
      {
        title: "薪資管理",
        icon: DollarSign,
        children: [
          
          { title: "薪資計算", url: "/payroll/calculate" },
          { title: "獎金/罰款", url: "/payroll/bonus-penalty" },
          { title: "發薪管理", url: "/payroll/distribute" },
        ],
      },
    ],
  },
  {
    label: "發展與績效",
    items: [
      {
        title: "績效管理",
        icon: Target,
        children: [
          { title: "考核方案", url: "/performance/plans" },
          { title: "績效評估", url: "/performance/evaluation" },
        ],
      },
      {
        title: "培訓管理",
        icon: GraduationCap,
        children: [
          { title: "培訓計劃", url: "/training/plans" },
          { title: "培訓記錄", url: "/training/records" },
        ],
      },
    ],
  },
  {
    label: "分析與設定",
    items: [
      { title: "消息通知", url: "/notifications", icon: Bell },
      { title: "報表分析", url: "/reports", icon: BarChart3 },
      { title: "系統管理", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            HR
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-accent-foreground">HR 管理系統</h2>
            <p className="text-xs text-sidebar-muted">企業人力資源平台</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  "children" in item && item.children ? (
                    <Collapsible key={item.title} defaultOpen className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.url}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink
                                    to={child.url}
                                    end
                                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                                  >
                                    {child.title}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={"url" in item ? item.url : "#"}
                          end
                          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
