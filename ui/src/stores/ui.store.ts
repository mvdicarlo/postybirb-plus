import { observable, action, autorun, computed } from 'mobx';

const STORE_KEY: string = 'UIState';

interface UIState {
  activeNav: string;
  agreementAccepted: boolean;
  hasPendingChanges: boolean;
  navCollapsed: boolean;
  navId: number;
  theme: 'light' | 'dark';
  websiteFilter: string[];
}

export class UIStore {
  @observable state: UIState = {
    agreementAccepted: false,
    hasPendingChanges: false,
    navCollapsed: false,
    navId: 0,
    theme: window.IS_DARK_THEME ? 'dark' : 'light',
    websiteFilter: [],
    activeNav: 'home'
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
  changeTheme(theme: 'light' | 'dark') {
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

  @action
  agreementAccepted() {
    this.state.agreementAccepted = true;
  }

  @action
  setActiveNav(nav: string) {
    if (nav !== this.state.activeNav) {
      this.state.activeNav = nav;
    }
  }
}

export const uiStore = new UIStore();
