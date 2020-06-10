import React from 'react';
import * as sanitize from 'sanitize-html';
import { inject, observer } from 'mobx-react';
import { Editor } from '@tinymce/tinymce-react';
import { Form, Switch, Button, Popover, Typography } from 'antd';
import { DescriptionTemplateStore } from '../../../../stores/description-template.store';
import { DescriptionData } from '../../../../../../electron-app/src/submission/submission-part/interfaces/description-data.interface';
import WebsiteService from '../../../../services/website.service';
import { WebsiteRegistry } from '../../../../websites/website-registry';
import { uiStore } from '../../../../stores/ui.store';
import { CustomShortcutStore } from '../../../../stores/custom-shortcut.store';

interface Props {
  customShortcutStore?: CustomShortcutStore;
  defaultValue: DescriptionData;
  descriptionTemplateStore?: DescriptionTemplateStore;
  hideOverwrite?: boolean;
  hideShortcuts?: boolean;
  label?: string;
  onChange: (change: DescriptionData) => void;
  overwriteDescriptionValue?: string;
  lengthParser?: (text: string) => number;
  anchorLength?: number;
}

interface State {}

@inject('descriptionTemplateStore', 'customShortcutStore')
@observer
export default class DescriptionInput extends React.Component<Props, State> {
  state: State = {};

  private data: DescriptionData = {
    overwriteDefault: false,
    value: ''
  };

  private tinyMCESettings: any = {
    suffix: '.min',
    skin: uiStore!.state.theme === 'dark' ? 'oxide-dark' : 'oxide',
    inline: false,
    statusbar: false,
    paste_data_images: false,
    browser_spellcheck: false, // should be supported in electron 8
    entity_encoding: 'raw',
    paste_retain_style_properties: 'color',
    invalid_elements: 'img,audio,video',
    block_formats:
      'Paragraph=p;Header 1=h1;Header 2=h2;Header 3=h3;Header 4=h4;Header 5=h5;Header 6=h6',
    content_style: 'p {margin: 0}',
    height: 200,
    plugins: 'autoresize autolink link preview paste hr template help code lists',
    menubar: 'file edit insert view tools help',
    toolbar:
      'newdocument undo redo | formatselect removeformat | link unlink hr | bold italic underline strikethrough forecolor | alignleft aligncenter alignright | bullist | code template help',
    templates: [],
    formats: {
      underline: { inline: 'u', exact: true },
      strikethrough: { inline: 's', exact: true }
    },
    paste_preprocess(plugin: any, args: any) {
      args.content = sanitize(args.content, {
        allowedTags: false,
        allowedAttributes: {
          a: ['href', 'target'],
          div: ['align', 'style'],
          pre: ['align', 'style'],
          p: ['align', 'style'],
          h1: ['align', 'style'],
          h2: ['align', 'style'],
          h3: ['align', 'style'],
          h4: ['align', 'style'],
          h5: ['align', 'style'],
          h6: ['align', 'style'],
          span: ['align', 'style']
        },
        allowedStyles: {
          '*': {
            'text-align': [/.*/]
          }
        }
      });
    }
  };

  constructor(props: Props) {
    super(props);
    this.data = props.defaultValue;
  }

  changeOverwriteDefault = (checked: boolean) => {
    this.data.overwriteDefault = !checked;
    if (!checked && this.props.overwriteDescriptionValue) {
      this.data.value = this.props.overwriteDescriptionValue;
    }
    this.update();
  };

  handleDescriptionChange = description => {
    this.data.value = description;
    this.update();
  };

  update() {
    this.props.onChange({
      overwriteDefault: this.data.overwriteDefault,
      value: this.data.value
    });
  }

  getLength(text: string): number {
    if (this.props.lengthParser) {
      return this.props.lengthParser(text);
    }

    const doc = document.createElement('div');
    const anchorMatch = text.matchAll(/<a(.*?)href="(.*?)">(.*?)<\/a>/g);
    let next: IteratorResult<RegExpMatchArray, any>;
    while (!(next = anchorMatch.next()).done) {
      const url = this.props.anchorLength
        ? next.value[2].substring(0, this.props.anchorLength)
        : next.value[2];
      text = text.replace(next.value[0], url);
    }
    doc.innerHTML = text;
    return doc.innerText.trim().length;
  }

  render() {
    this.data = this.props.defaultValue;
    const overwriteSwitch = this.props.hideOverwrite ? null : (
      <div>
        <span className="mr-2">
          <Switch
            size="small"
            checked={!this.props.defaultValue.overwriteDefault}
            onChange={this.changeOverwriteDefault}
          />
        </span>
        <span>Use default</span>
      </div>
    );

    const customShortcuts = this.props.customShortcutStore!.shortcuts;

    return (
      <Form.Item
        label={this.props.label}
        extra={
          this.props.hideShortcuts ||
          (!this.data.overwriteDefault && !this.props.hideOverwrite) ? null : (
            <div>
              <Popover
                title="Username Shortcuts"
                onVisibleChange={visible => this.setState({ shortcutsHovered: visible })}
                content={
                  <div className="overflow-auto" style={{ maxHeight: '50vh' }}>
                    <em>
                      Example: {'{tw:minnownade}'} -> https://twitter.com/minnownade (would appear
                      as @minnownade on Twitter)
                    </em>
                    {Object.entries(WebsiteService.usernameShortcuts)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([key, value]) => {
                        return (
                          <div>
                            <strong>{WebsiteRegistry.websites[key].name}</strong>
                            <ul>
                              {value.map(val => {
                                return (
                                  <li>
                                    <span>{val.key} - </span>
                                    <Typography.Text type="secondary">{val.url}</Typography.Text>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                  </div>
                }
              >
                <Button size="small">Username Shortcuts</Button>
              </Popover>
              <Popover
                className="ml-1"
                title="Custom Shortcuts"
                content={
                  <div className="overflow-auto" style={{ maxHeight: '50vh' }}>
                    <ul>
                      {customShortcuts
                        .sort((a, b) => a.shortcut.localeCompare(b.shortcut))
                        .map(shortcut => {
                          return (
                            <li>
                              <code>{`{${shortcut.shortcut}${
                                shortcut.isDynamic ? ':<dynamic content>' : ''
                              }}`}</code>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                }
              >
                <Button size="small">Custom Shortcuts</Button>
              </Popover>
            </div>
          )
        }
      >
        {overwriteSwitch}
        {this.props.defaultValue.overwriteDefault || this.props.hideOverwrite ? (
          <div className="relative">
            <Editor
              value={this.props.defaultValue.value}
              init={{
                ...this.tinyMCESettings,
                templates: this.props.descriptionTemplateStore!.templates
              }}
              onEditorChange={this.handleDescriptionChange}
            />
            <div className="absolute bottom-0 text-gray-600 mr-1 right-0 pointer-events-none">
              {this.getLength(this.props.defaultValue.value)}
            </div>
          </div>
        ) : null}
      </Form.Item>
    );
  }
}
