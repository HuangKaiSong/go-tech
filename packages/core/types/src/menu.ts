export interface MenuType {
  children?: MenuType[];
  desc: string;
  icon: string;
  id: number;
  parentId: number;
  title: string;
}
