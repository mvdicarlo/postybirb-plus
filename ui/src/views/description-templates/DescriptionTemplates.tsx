import React from 'react';
import * as _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { DescriptionTemplateStore } from '../../stores/description-template.store';
import DescriptionTemplateService from '../../services/description-template.service';
import { Empty, Button, Form, message, Spin, Card, Input, Icon, Popconfirm } from 'antd';
import { DescriptionTemplate } from '../../../../electron-app/src/server/description-template/interfaces/description-template.interface';
import DescriptionInput from '../submissions/submission-forms/form-components/DescriptionInput';

interface Props {
  descriptionTemplateStore?: DescriptionTemplateStore;
}

@inject('descriptionTemplateStore')
@observer
export default class DescriptionTemplates extends React.Component<Props> {
  createNewDescriptionTemplate() {
    DescriptionTemplateService.create({
      title: 'New Description Template',
      content: '',
      description: ''
    });
  }

  render() {
    const templates = this.props.descriptionTemplateStore!.templates;
    return (
      <div>
        {templates.length ? (
          <div>
            <Button className="mb-2" type="primary" onClick={this.createNewDescriptionTemplate}>
              Add New Description Template
            </Button>
            {templates.map((t: DescriptionTemplate) => (
              <div className="mb-2">
                <DescriptionTemplateEditor key={t._id} template={t} />
              </div>
            ))}
          </div>
        ) : (
          <Empty description={<span>No description templates</span>}>
            <Button type="primary" onClick={this.createNewDescriptionTemplate}>
              Create Description Template
            </Button>
          </Empty>
        )}
      </div>
    );
  }
}

interface EditorProps {
  template: DescriptionTemplate;
}

interface EditorState {
  template: Partial<DescriptionTemplate>;
  touched: boolean;
  saving: boolean;
}

class DescriptionTemplateEditor extends React.Component<EditorProps, EditorState> {
  state: EditorState = {
    template: {},
    touched: false,
    saving: false
  };

  private original!: DescriptionTemplate;

  constructor(props: EditorProps) {
    super(props);
    Object.assign(this.state.template, props.template);
    this.original = _.cloneDeep(props.template);
  }

  onSave = () => {
    if (!this.state.touched) {
      message.info('No changes to save.');
      return;
    }

    this.setState({ saving: true });
    DescriptionTemplateService.update(this.state.template)
      .then(() => {
        this.setState({ saving: false, touched: false });
        message.success('Description template updated.');
      })
      .catch(err => {
        this.setState({ saving: false });
        message.error('Name cannot be empty.');
      });
  };

  onDelete = () => {
    DescriptionTemplateService.remove(this.props.template._id)
      .then(() => message.success('Description template removed.'))
      .catch(() => message.error('Failed to remove description template.'));
  };

  handleStringChange = (fieldName: string, { target }) => {
    const copy = _.cloneDeep(this.state.template);
    copy[fieldName] = target.value.trim();
    this.setState({ touched: !_.isEqual(copy, this.original), template: copy });
  };

  handleContentChange = ({ value }) => {
    const copy = _.cloneDeep(this.state.template);
    copy.content = value;
    this.setState({ touched: !_.isEqual(copy, this.original), template: copy });
  };

  render() {
    return (
      <div>
        <Spin spinning={this.state.saving} delay={500}>
          <Form layout="vertical">
            <Card
              size="small"
              title={
                <Input
                  defaultValue={this.state.template.title}
                  required={true}
                  onBlur={this.handleStringChange.bind(this, 'title')}
                  placeholder="Name"
                />
              }
              actions={[
                <Icon type="save" key="save" onClick={this.onSave} />,
                <Popconfirm title="Are you sure?" onConfirm={this.onDelete}>
                  <Icon type="delete" key="delete" />
                </Popconfirm>
              ]}
            >
              <Form.Item label="Info">
                <Input
                  className="w-full"
                  defaultValue={this.state.template.description}
                  onBlur={this.handleStringChange.bind(this, 'description')}
                />
              </Form.Item>
              <DescriptionInput
                defaultValue={{ overwriteDefault: false, value: this.state.template.content! }}
                onChange={this.handleContentChange}
                hideOverwrite={true}
              />
            </Card>
          </Form>
        </Spin>
      </div>
    );
  }
}
