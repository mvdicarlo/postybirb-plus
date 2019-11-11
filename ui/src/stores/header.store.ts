import { observable, computed, action } from "mobx";
import { Route } from "antd/lib/breadcrumb/Breadcrumb";

export interface HeaderState {
    routes: BreadcrumbNavItem[];
    subtitle?: string;
    title?: string;
}

export interface BreadcrumbNavItem extends Route {
    icon?: string;
}

export class HeaderStore {
    @observable state: HeaderState = {
        routes: [],
        title: 'Home'
    };

    private home: BreadcrumbNavItem = {
        path: '/',
        breadcrumbName: '',
        icon: 'home'
    };

    @computed
    get headerState(): HeaderState {
        const headerState = {
            ...this.state
        };

        headerState.routes = [this.home, ...headerState.routes];

        return headerState;
    }

    @action
    updateHeaderState(headerState: HeaderState) {
        this.state = headerState;
    }
}

export const headerStore = new HeaderStore();