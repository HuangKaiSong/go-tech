export interface MenuType {
  children?: MenuType[];
  desc: string;
  menuIcon: string;
  menuId: number;
  menuTitle: string;
  parentId: number;
}
