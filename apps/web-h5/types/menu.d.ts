type MenuType = {
  id: number;
  title: string;
  parentId: number;
  children?: MenuType[];
};