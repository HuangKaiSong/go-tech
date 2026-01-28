type MenuType = {
  id: number;
  title: string;
  parentId: number;
  desc: string;
  icon: string;
  children?: MenuType[];
};