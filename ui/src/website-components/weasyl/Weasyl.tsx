import React from 'react';
import { Website, LoginDialogProps } from "../interfaces/website.interface";
import { GenericLoginDialog } from '../generic/GenericLoginDialog';

export class Weasyl implements Website {
    name: string = 'Weasyl';
    LoginDialog = (props: LoginDialogProps) => <GenericLoginDialog url="https://www.weasyl.com/signin" {...props} />;
}