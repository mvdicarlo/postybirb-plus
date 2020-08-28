import { Button, Form, Input, message, Radio } from 'antd';
import * as _ from 'lodash';
import React from 'react';
import { CustomAccountData } from '../../../../electron-app/src/server/websites/custom/custom-account.interface';
import LoginService from '../../services/login.service';
import { LoginDialogProps } from '../interfaces/website.interface';

export default class CustomAccountInfo extends React.Component<
  LoginDialogProps,
  CustomAccountData
> {
  state: CustomAccountData = {
    descriptionField: 'description',
    descriptionType: 'html',
    fileField: 'file',
    fileUrl: undefined,
    headers: [],
    notificationUrl: undefined,
    ratingField: 'rating',
    tagField: 'tags',
    thumbnaiField: 'thumbnail',
    titleField: 'title'
  };

  constructor(props: LoginDialogProps) {
    super(props);
    this.state = {
      ...this.state,
      ...(props.data as CustomAccountData)
    };
  }

  async submit() {
    LoginService.setAccountData(this.props.account._id, this.state)
      .then(() => {
        message.success('Custom fields set.');
      })
      .catch(() => {
        message.error('Failed to set custom fields.');
      });
  }

  getHeadersSection() {
    const rows: JSX.Element[] = [];
    for (let i = 0; i < 10; i++) {
      rows.push(
        <div className="flex mt-2">
          <Input
            className="flex-1 mr-1"
            placeholder={`Header ${i + 1}`}
            defaultValue={_.get(this.state, `headers[${i}].name`)}
            onChange={e => {
              const headers = [...this.state.headers];
              const header = headers[i] || { name: '', value: '' };
              header.name = e.target.value;
              headers[i] = header;
              this.setState({ headers: headers });
            }}
          />
          <Input
            className="flex-1"
            placeholder="Value"
            defaultValue={_.get(this.state, `headers[${i}].value`)}
            onChange={e => {
              const headers = [...this.state.headers];
              const header = headers[i] || { name: '', value: '' };
              header.value = e.target.value;
              headers[i] = header;
              this.setState({ headers: headers });
            }}
          />
        </div>
      );
    }
    return rows;
  }

  render() {
    return (
      <div className="container mt-6">
        <Form layout="vertical">
          <Form.Item
            label="File URL"
            help="The URL that will be posted to when posting a file submission."
          >
            <Input
              className="w-full"
              defaultValue={this.state.fileUrl}
              onBlur={({ target }) => this.setState({ fileUrl: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Notification URL"
            help="The URL that will be posted to when posting a notification submission."
          >
            <Input
              className="w-full"
              defaultValue={this.state.notificationUrl}
              onBlur={({ target }) => this.setState({ notificationUrl: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Title Field"
            help="The multipart field name that will be used for the title."
          >
            <Input
              className="w-full"
              defaultValue={this.state.titleField}
              onBlur={({ target }) => this.setState({ titleField: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="File Field"
            help="The multipart field name that will be used for the submission file."
          >
            <Input
              className="w-full"
              defaultValue={this.state.fileField}
              onBlur={({ target }) => this.setState({ fileField: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Thumbnail Field"
            help="The multipart field name that will be used for the thumbnail file."
          >
            <Input
              className="w-full"
              defaultValue={this.state.thumbnaiField}
              onBlur={({ target }) => this.setState({ thumbnaiField: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Description Field"
            help="The multipart field name that will be used for the description."
          >
            <Input
              className="w-full"
              defaultValue={this.state.descriptionField}
              onBlur={({ target }) => this.setState({ descriptionField: target.value })}
            />
          </Form.Item>
          <Form.Item label="Description Parsing Type" help="Parsing type used for the description.">
            <Radio.Group
              onChange={e => this.setState({ descriptionType: e.target.value })}
              defaultValue={this.state.descriptionType}
              buttonStyle="solid"
            >
              <Radio.Button value="html">HTML</Radio.Button>
              <Radio.Button value="text">Plain Text</Radio.Button>
              <Radio.Button value="md">Markdown</Radio.Button>
              <Radio.Button value="bbcode">BB Code</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="Tag Field"
            help="The multipart field name that will be used for the tags send as a comma separated string."
          >
            <Input
              className="w-full"
              defaultValue={this.state.tagField}
              onBlur={({ target }) => this.setState({ tagField: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Rating Field"
            help="The multipart field name that will be used for the rating. (general, mature, adult, extreme)."
          >
            <Input
              className="w-full"
              defaultValue={this.state.ratingField}
              onBlur={({ target }) => this.setState({ ratingField: target.value })}
            />
          </Form.Item>
          <Form.Item
            label="Headers"
            help="Header fields you might need for authentication / cookies."
          >
            {this.getHeadersSection()}
          </Form.Item>
          <Form.Item>
            <Button onClick={this.submit.bind(this)} block>
              Save
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}
