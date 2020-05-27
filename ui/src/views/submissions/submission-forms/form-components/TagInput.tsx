import { Dropdown, Form, Icon, Input, Menu, Select, Switch, Tag, Tooltip, Typography } from 'antd';
import _ from 'lodash';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { TagData } from '../../../../../../electron-app/src/submission/submission-part/interfaces/tag-data.interface';
import { TagGroupStore } from '../../../../stores/tag-group.store';

const { Text } = Typography;

export interface TagOptions {
  maxTags?: number;
  minTags?: number;
  mode?: 'count' | 'length';
  maxLength?: number;
}

interface Props {
  defaultValue: TagData;
  defaultTags?: TagData;
  onChange: (change: TagData) => void;
  label?: string;
  hideExtend?: boolean;
  hideExtra?: boolean;
  hideTagGroup?: boolean;
  tagOptions?: TagOptions;
}

export default class TagInput extends React.Component<Props> {
  private data: TagData = {
    extendDefault: true,
    value: []
  };

  options: TagOptions = {
    maxTags: 200,
    mode: 'count'
  };

  constructor(props: Props) {
    super(props);
    if (props.defaultValue) {
      this.data = props.defaultValue;
    }

    this.options = {
      ...this.options,
      ...props.tagOptions
    };
  }

  changeExtendDefault = (checked: boolean) => {
    this.data.extendDefault = checked;
    this.update();
  };

  handleTagChange = (tags: string[]) => {
    this.data.value = this.filterTags(tags);
    this.update();
  };

  filterTags(tags: string[]) {
    let filteredTags = tags.map(tag =>
      tag.trim().replace(/("|;|\\|\[|\]|\{|\}|\||!|@|\$|%|\^|&|\*|\+|=|<|>||`|~)/g, '')
    );

    const filter = this.props.defaultTags ? this.props.defaultTags.value : [];
    if (this.data.extendDefault) {
      filteredTags = filteredTags.filter(tag => !filter.includes(tag));
    }

    return _.uniq(filteredTags);
  }

  update() {
    this.props.onChange({
      extendDefault: this.data.extendDefault,
      value: this.filterTags(this.data.value)
    });
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    const illegalKeys: string = '";|\\[]{}=*&^%$!`~<>+';
    if (illegalKeys.includes(e.key)) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  render() {
    this.data = this.props.defaultValue;
    const tagSwitch = this.props.hideExtend ? null : (
      <div>
        <span className="mr-2">
          <Switch
            size="small"
            checked={this.props.defaultValue.extendDefault}
            onChange={this.changeExtendDefault}
          />
        </span>
        <span>Combine with default</span>
      </div>
    );

    return (
      <Form.Item label={this.props.label} required={!!this.options.minTags}>
        {tagSwitch}
        <div className="flex">
          <Select
            mode="tags"
            style={{ flex: 10 }}
            tokenSeparators={[',']}
            onChange={this.handleTagChange}
            value={this.props.defaultValue.value}
            placeholder="Separate tags with ,"
            allowClear={true}
            onInputKeyDown={this.onKeyDown}
          >
            {this.props.defaultValue.value.map(tag => (
              <Select.Option key="tag" value={tag}>
                {tag}
              </Select.Option>
            ))}
          </Select>
          <div className="m-auto">
            <Typography.Text
              copyable={{ text: this.props.defaultValue.value.join(', ') }}
            ></Typography.Text>
          </div>
        </div>

        <div className="flex">
          {this.props.hideTagGroup ? null : (
            <TagGroupSelect
              onSelect={tags => this.handleTagChange([...this.props.defaultValue.value, ...tags])}
            />
          )}
          {this.props.hideExtend ? null : (
            <Help
              options={this.options}
              defaultValue={this.props.defaultValue}
              defaultTags={this.props.defaultTags}
            />
          )}
        </div>
      </Form.Item>
    );
  }
}

interface HelpProps {
  options: TagOptions;
  defaultTags?: TagData;
  defaultValue: TagData;
}

const Help: React.SFC<HelpProps> = props => {
  const { options, defaultTags, defaultValue } = props;
  let tags = [...defaultValue.value];
  if (defaultTags && defaultValue.extendDefault) {
    tags.push(...defaultTags.value);
  }

  let count: number = 0;
  if (options.mode === 'count') {
    count = tags.length;
  } else if (options.mode === 'length') {
    count = tags.join(' ').length;
  }

  const max = options.mode === 'count' ? options.maxTags || 200 : options.maxLength || 255;

  return (
    <div className="flex text-gray-600" style={{ flex: 10 }}>
      <div className="flex-grow">
        {options.minTags ? `Requires at least ${options.minTags} tag(s)` : ''}
      </div>
      <div className="text-right">
        <Text type={count > max ? 'danger' : 'secondary'}>
          {count} / {max}
        </Text>
      </div>
    </div>
  );
};

interface TagGroupSelectProps {
  onSelect: (tags: string[]) => void;
  tagGroupStore?: TagGroupStore;
}

interface TagGroupSelectState {
  filter: string;
}

@inject('tagGroupStore')
@observer
class TagGroupSelect extends React.Component<TagGroupSelectProps, TagGroupSelectState> {
  state: TagGroupSelectState = {
    filter: ''
  };
  render() {
    const menu = (
      <Menu style={{ maxHeight: '33vh', overflow: 'auto', padding: '0' }}>
        <div
          className="sticky top-0 z-10"
          style={{ background: 'inherit' }}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Input.Search
            autoFocus
            allowClear
            placeholder="Search"
            value={this.state.filter}
            onChange={e => this.setState({ filter: e.target.value.trim().toLowerCase() })}
          />
        </div>
        {this.props
          .tagGroupStore!.groups.filter(g => g.alias.toLowerCase().includes(this.state.filter))
          .map(g => (
            <Menu.Item key={g._id}>
              <Tooltip
                placement="right"
                title={
                  <div>
                    {g.tags.map(tag => (
                      <Tag>{tag}</Tag>
                    ))}
                  </div>
                }
              >
                {
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  <a
                    onClick={e => {
                      this.props.onSelect(g.tags);
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {g.alias}
                  </a>
                }
              </Tooltip>
            </Menu.Item>
          ))}
      </Menu>
    );
    return (
      <div className="mr-2">
        <Dropdown overlay={menu}>
          <span className="ant-dropdown-link text-link">
            Apply Tag Group <Icon type="down" />
          </span>
        </Dropdown>
      </div>
    );
  }
}
