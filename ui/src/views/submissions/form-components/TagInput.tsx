import React from 'react';
import { inject, observer } from 'mobx-react';
import { TagGroupStore } from '../../../stores/tag-group.store';
import { TagData } from '../../.././../../electron-app/src/submission/interfaces/submission-part.interface';
import _ from 'lodash';

import { Switch, Select, Form, Typography, Menu, Dropdown, Tooltip, Icon, Tag } from 'antd';

const { Text } = Typography;

interface TagOptions {
  maxTags?: number;
  minTags?: number;
  mode?: 'count' | 'length';
  maxLength?: number;
}

interface Props {
  defaultValue?: TagData;
  defaultTags?: TagData;
  onChange: (change: TagData) => void;
  label?: string;
  hideExtend?: boolean;
  hideExtra?: boolean;
  hideTagGroup?: boolean;
  tagOptions?: TagOptions;
}

export default class TagInput extends React.Component<Props, TagData> {
  state: TagData = {
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
      this.state = props.defaultValue;
    }

    this.options = {
      ...this.options,
      ...props.tagOptions
    };
  }

  changeExtendDefault = (checked: boolean) => {
    this.setState({ extendDefault: checked });
    this.update();
  };

  handleTagChange = (tags: string[]) => {
    this.state.value = this.filterTags(tags);
    this.setState({ value: this.state.value });
    this.update();
  };

  filterTags(tags: string[]) {
    let filteredTags = tags.map(tag =>
      tag.trim().replace(/("|;|\\|\[|\]|\{|\}|\||!|@|\$|%|\^|&|\*|\+|=|<|>||`|~)/g, '')
    );

    const filter = this.props.defaultTags ? this.props.defaultTags.value : [];
    if (this.state.extendDefault) {
      filteredTags = filteredTags.filter(tag => !filter.includes(tag));
    }

    return _.uniq(filteredTags).splice(0, this.options.maxTags || 200);
  }

  update() {
    this.props.onChange({
      extendDefault: this.state.extendDefault,
      value: this.filterTags(this.state.value)
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
    const tagSwitch = this.props.hideExtend ? (
      ''
    ) : (
      <div>
        <span className="mr-2">
          <Switch
            size="small"
            defaultChecked={this.state.extendDefault}
            onChange={this.changeExtendDefault}
          />
        </span>
        <span>Combine with default</span>
      </div>
    );

    return (
      <Form.Item
        label={this.props.label}
        required={!!this.options.minTags}
        extra={
          this.props.hideExtend ? null : (
            <Help
              options={this.options}
              defaultValue={this.state}
              defaultTags={this.props.defaultTags}
            />
          )
        }
      >
        {tagSwitch}
        <Select
          mode="tags"
          style={{ width: '100%' }}
          tokenSeparators={[',']}
          onChange={this.handleTagChange}
          value={this.state.value}
          placeholder="Separate tags with ,"
          allowClear={true}
          onInputKeyDown={this.onKeyDown}
        >
          {this.state.value.map(tag => (
            <Select.Option key="tag" value={tag}>
              {tag}
            </Select.Option>
          ))}
        </Select>
        {this.props.hideTagGroup ? null : (
          <TagGroupSelect onSelect={tags => this.handleTagChange([...this.state.value, ...tags])} />
        )}
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

  const max = options.mode === 'count' ? options.minTags || 200 : options.maxLength || 255;

  return (
    <div className="flex">
      <div className="flex-grow">
        {options.minTags ? `Requires at least ${options.minTags}` : ''}
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

@inject('tagGroupStore')
@observer
class TagGroupSelect extends React.Component<TagGroupSelectProps> {
  render() {
    const menu = (
      <Menu>
        {this.props.tagGroupStore!.groups.map(g => (
          <Menu.Item key={g.id}>
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
              <a onClick={() => this.props.onSelect(g.tags)}>{g.alias}</a>
            </Tooltip>
          </Menu.Item>
        ))}
      </Menu>
    );
    return (
      <Dropdown overlay={menu}>
        <a className="ant-dropdown-link">
          Apply Tag Group <Icon type="down" />
        </a>
      </Dropdown>
    );
  }
}
