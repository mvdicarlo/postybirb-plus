import { observable, action, autorun } from 'mobx';

const STORE_KEY: string = 'UIState';

interface UIState {
  theme: 'light' | 'dark' | undefined;
  navId: number;
  navCollapsed: boolean;
}

export class UIStore {
  @observable state: UIState = {
    theme: 'dark',
    navId: 0,
    navCollapsed: false
  };

  constructor() {
    const storedState = localStorage.getItem(STORE_KEY);
    if (storedState) Object.assign(this.state, JSON.parse(storedState));
    autorun(() => localStorage.setItem(STORE_KEY, JSON.stringify(this.state)));
  }

  @action
  collapseNav(collapse: boolean) {
    this.state.navCollapsed = collapse;
  }

  @action
  changeTheme(theme: 'light' | 'dark' | undefined) {
    this.state.theme = theme;
  }

  @action
  changeNavId(navId: number) {
    this.state.navId = navId;
  }
}

export const uiStore = new UIStore();
