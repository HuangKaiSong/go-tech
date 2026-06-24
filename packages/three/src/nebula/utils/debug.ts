import { FolderApi, Pane } from 'tweakpane';

type ExtendPane = Pane & {
  addFolder: (params: { expanded?: boolean; title: string }) => FolderApi;
};

export default class Debug {
  active: boolean = false;
  ui: ExtendPane | null = null;

  constructor() {
    this.active = window.location.hash === '#debug';

    if (this.active) {
      this.ui = new Pane() as ExtendPane;
    }
  }
}
