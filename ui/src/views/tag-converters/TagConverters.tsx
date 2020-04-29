import React from 'react';
import { inject, observer } from 'mobx-react';
import { TagConverterStore } from '../../stores/tag-converter.store';
import TagConverterService from '../../services/tag-converter.service';
import { TagConverter } from '../../../../electron-app/src/tag-converter/interfaces/tag-converter.interface';
import _ from 'lodash';
import {
  Empty,
  Button,
  Modal,
  Input,
  message,
  Spin,
  Form,
  Card,
  Icon,
  Popconfirm,
  Alert
} from 'antd';
import { WebsiteRegistry } from '../../websites/website-registry';

interface Props {
  tagConverterStore?: TagConverterStore;
}

interface State {
  createModalVisible: boolean;
  newTagValue: string;
}

@inject('tagConverterStore')
@observer
export default class TagConverters extends React.Component<Props> {
  state: State = {
    createModalVisible: false,
    newTagValue: ''
  };

  createNew() {
    if (this.isValid()) {
      this.setState({ createModalVisible: false });
      TagConverterService.create({
        tag: this.state.newTagValue,
        conversions: {}
      });
    } else {
      message.warn('Tag is not valid.');
    }
  }

  isUnique(tag: string): boolean {
    const existingConverters = this.props.tagConverterStore!.converters.map(t => t.tag);
    return !existingConverters.includes(tag.trim());
  }

  showCreationModal() {
    this.setState({ createModalVisible: true, newTagValue: '' });
  }

  hideCreationModal() {
    this.setState({ createModalVisible: false });
  }

  onNameChange({ target }) {
    this.setState({
      newTagValue: target.value
        .trim()
        .replace(/("|;|\\|\[|\]|\{|\}|\||!|@|\$|%|\^|&|\*|\+|=|<|>||`|~|,)/g, '')
    });
  }

  isValid(): boolean {
    return !!this.state.newTagValue.length && this.isUnique(this.state.newTagValue);
  }

  render() {
    const converters = this.props.tagConverterStore!.converters;
    return (
      <div>
        <Alert
          className="mb-1"
          type="info"
          message="When a submission is posted, tags will be converted depending on the website being posted to."
          description={<div>Tags are case sensitive.</div>}
        />
        {converters.length ? (
          <div>
            <Button className="mb-2" type="primary" onClick={this.showCreationModal.bind(this)}>
              Add New Tag Converter
            </Button>
            {converters.map((t: TagConverter) => (
              <div className="mb-2">
                <TagConverterEditor key={t._id} converter={t} />
              </div>
            ))}
          </div>
        ) : (
          <Empty description={<span>No tag converters</span>}>
            <Button type="primary" onClick={this.showCreationModal.bind(this)}>
              Create Tag Converter
            </Button>
          </Empty>
        )}
        <Modal
          destroyOnClose={true}
          okButtonProps={{
            disabled: !this.isValid()
          }}
          onCancel={this.hideCreationModal.bind(this)}
          onOk={this.createNew.bind(this)}
          title="Tag (Must be unique)"
          visible={this.state.createModalVisible}
        >
          <Form
            onSubmit={e => {
              e.preventDefault();
              this.createNew();
            }}
          >
            <Input
              autoFocus
              required
              className="w-full"
              value={this.state.newTagValue}
              onChange={this.onNameChange.bind(this)}
            />
          </Form>
        </Modal>
      </div>
    );
  }
}

interface EditorProps {
  converter: TagConverter;
}

interface EditorState {
  converter: Partial<TagConverter>;
  touched: boolean;
  saving: boolean;
}

class TagConverterEditor extends React.Component<EditorProps, EditorState> {
  state: EditorState = {
    converter: {},
    touched: false,
    saving: false
  };

  private original!: TagConverter;

  constructor(props: EditorProps) {
    super(props);
    Object.assign(this.state.converter, props.converter);
    this.original = _.cloneDeep(props.converter);
  }

  onSave = () => {
    if (!this.state.touched) {
      message.info('No changes to save.');
      return;
    }

    this.setState({ saving: true });
    TagConverterService.update(this.state.converter)
      .then(() => {
        this.setState({ saving: false, touched: false });
        message.success('Tag converter updated.');
      })
      .catch(err => {
        this.setState({ saving: false });
        message.error('Tag converter must be a unique tag.');
      });
  };

  onDelete = () => {
    TagConverterService.remove(this.props.converter._id)
      .then(() => message.success('Tag converter removed.'))
      .catch(() => message.error('Failed to remove tag converter.'));
  };

  handleTagChange = (fieldName: string, { target }) => {
    const copy = _.cloneDeep(this.state.converter);
    copy[fieldName] = target.value.trim();
    this.setState({ touched: !_.isEqual(copy, this.original), converter: copy });
  };

  handleWebsiteConversionChange = (website: string, { target }) => {
    const copy = _.cloneDeep(this.state.converter);
    copy.conversions![website] = this.filterTag(target.value);
    this.setState({ touched: !_.isEqual(copy, this.original), converter: copy });
  };

  filterTag(tag: string) {
    return tag.trim().replace(/("|;|\\|\[|\]|\{|\}|\||!|@|\$|%|\^|&|\*|\+|=|<|>||`|~|,)/g, '');
  }

  render() {
    return (
      <div>
        <Spin spinning={this.state.saving} delay={500}>
          <Form layout="vertical">
            <Card
              size="small"
              bodyStyle={{ overflow: 'auto', maxHeight: '120px' }}
              title={
                <div>
                  <Input
                    defaultValue={this.state.converter.tag}
                    required={true}
                    onBlur={this.handleTagChange.bind(this, 'tag')}
                    placeholder="Tag"
                  />
                </div>
              }
              actions={[
                <Icon type="save" key="save" onClick={this.onSave} />,
                <Popconfirm title="Are you sure?" onConfirm={this.onDelete}>
                  <Icon type="delete" key="delete" />
                </Popconfirm>
              ]}
            >
              {WebsiteRegistry.getAllAsArray()
                .filter(website => website.supportsTags)
                .map(website => (
                  <div className="flex mb-1">
                    <div className="flex-1">
                      <strong>{website.name}</strong>
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Convert to..."
                        size="small"
                        defaultValue={this.props.converter.conversions![website.internalName]}
                        onBlur={this.handleWebsiteConversionChange.bind(this, website.internalName)}
                      />
                    </div>
                  </div>
                ))}
            </Card>
          </Form>
        </Spin>
      </div>
    );
  }
}
