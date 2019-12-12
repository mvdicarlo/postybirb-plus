import { observable, action, autorun, computed } from 'mobx';

const STORE_KEY: string = 'UIState';

interface UIState {
  theme: 'light' | 'dark' | undefined;
  navId: number;
  navCollapsed: boolean;
  websiteFilter: string[];
  hasPendingChanges: boolean;
}

export class UIStore {
  @observable state: UIState = {
    theme: 'dark',
    navId: 0,
    navCollapsed: false,
    websiteFilter: [],
    hasPendingChanges: false
  };

  constructor() {
    const storedState = localStorage.getItem(STORE_KEY);
    if (storedState) Object.assign(this.state, JSON.parse(storedState));
    this.state.hasPendingChanges = false;
    autorun(() => localStorage.setItem(STORE_KEY, JSON.stringify(this.state)));
  }

  @computed
  get websiteFilter(): string[] {
    return [...this.state.websiteFilter];
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

  @action
  changeWebsiteFilter(excludedWebsites: string[]) {
    this.state.websiteFilter = excludedWebsites || [];
  }

  @action
  setPendingChanges(pending: boolean) {
    this.state.hasPendingChanges = pending;
  }

}

export const uiStore = new UIStore();
