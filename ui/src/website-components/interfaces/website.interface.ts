import React from 'react';
import { UserAccountDto } from '../../interfaces/user-account.interface';

export interface LoginDialogProps {
    account: UserAccountDto;
    url?: string;
}

export interface Website {
  name: string;
  LoginDialog: (props: LoginDialogProps) => JSX.Element;
}
