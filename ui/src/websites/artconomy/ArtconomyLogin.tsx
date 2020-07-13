import React from 'react';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Form, Input, Button, message } from 'antd';
import LoginService from '../../services/login.service';
import Axios, {AxiosError} from 'axios';

interface State {
    email: string;
    password: string;
    token: string;
    show2fa: boolean,
    sending: boolean;
}

export default class ArtconomyLogin extends React.Component<LoginDialogProps, State> {
    state: State = {
        email: '',
        password: '',
        token: '',
        show2fa: false,
        sending: false,
    };

    constructor(props: LoginDialogProps) {
        super(props);
        this.state = {
            ...this.state,
            ...(props.data as State)
        };
    }

    async submit() {
        this.setState({ sending: true });
        const auth = await Axios.post<{ id: number, username: string, csrftoken: string, token: string[] }>(
            'https://artconomy.com/api/profiles/v1/login/',
            {...this.state},
            { responseType: 'json' },
        ).catch((error: AxiosError) => {
            if (!error.response) {
                message.error("Unable to contact Artconomy's servers. Are you online?")
            }
            const response = error.response!
            if (response.data.token && !this.state.token) {
                this.setState({ sending: false });
                this.setState({ show2fa: true });
            } else if (response.data.token.length) {
                message.error(response.data.token[0]);
            } else {
                this.setState({ show2fa: false });
                message.error('Failed to login to Artconomy account.')
            }
        });
        if (!auth) {
            return
        }
        this.setState({ sending: false });
        LoginService.setAccountData(this.props.account._id, auth.data)
            .then(() => {
                message.success('Login success.');
            })
            .catch(() => {
                message.error('Failed to login to Artconomy account.');
            })
            .finally(() => this.setState({ sending: false }));
    }

    isValid(): boolean {
        return !!this.state.email && !!this.state.password && !!(!this.state.show2fa || this.state.token);
    }

    render() {
        return (
            <div className="container mt-6">
                <Form
                    layout="vertical"
                    onSubmit={e => {
                        e.preventDefault();
                        if (this.isValid()) {
                            this.submit();
                        }
                    }}
                >
                    <Form.Item label="Email" required>
                        <Input
                            className="w-full"
                            type="email"
                            value={this.state.email}
                            onChange={({ target }) => this.setState({ email: target.value })}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Password"
                        required
                    >
                        <Input
                            type="password"
                            className="w-full"
                            value={this.state.password}
                            onChange={({ target }) => this.setState({ password: target.value })}
                        />
                    </Form.Item>

                    {this.state.show2fa ? (
                        <Form.Item
                            label="Token"
                            required
                            extra={
                                <div>
                                    This account has been configured with two factor authentication. Please provide a 2FA login code.
                                </div>
                            }
                        >
                            <Input
                                className="w-full"
                                value={this.state.token}
                                onChange={({ target }) => this.setState({ token: target.value })}
                            />
                        </Form.Item>
                    ) : ( <span /> )}
                    <Form.Item>
                        <Button
                            disabled={!this.isValid()}
                            onClick={this.submit.bind(this)}
                            loading={this.state.sending}
                            block
                        >
                            Login
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        );
    }
}
