import React from 'react';
import * as sanitize from 'sanitize-html';
import { inject, observer } from 'mobx-react';
import { Editor } from '@tinymce/tinymce-react';
import { Form, Switch, Button, Popover, Typography } from 'antd';
import { DescriptionTemplateStore } from '../../../../stores/description-template.store';
import { DescriptionData } from '../../../../../../electron-app/src/submission/submission-part/interfaces/description-data.interface';
import WebsiteService from '../../../../services/website.service';
import { WebsiteRegistry } from '../../../../website-components/website-registry';
import { uiStore } from '../../../../stores/ui.store';

interface Props {
  defaultValue: DescriptionData;
  descriptionTemplateStore?: DescriptionTemplateStore;
  hideOverwrite?: boolean;
  label?: string;
  onChange: (change: DescriptionData) => void;
  overwriteDescriptionValue?: string;
}

interface State {
  shortcutsHovered: boolean;
}

@inject('descriptionTemplateStore')
@observer
export default class DescriptionInput extends React.Component<Props, State> {
  state: State = {
    shortcutsHovered: false
  };

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
    plugins: 'autoresize autolink link preview paste hr template help code',
    menubar: 'file edit insert view tools help',
    toolbar:
      'newdocument undo redo | formatselect removeformat | link unlink hr | bold italic underline strikethrough forecolor | alignleft aligncenter alignright | code template help',
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

    return (
      <Form.Item
        label={this.props.label}
        extra={
          <div>
            <Popover
              title="Username Shortcuts"
              visible={this.state.shortcutsHovered}
              trigger="hover"
              onVisibleChange={visible => this.setState({ shortcutsHovered: visible })}
              content={
                <div>
                  <em>
                    Example: :twminnownade: -> https://twitter.com/minnownade (would appear as
                    @minnownade on Twitter)
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
          </div>
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
              {PlaintextParser.parse(this.props.defaultValue.value).length}
            </div>
          </div>
        ) : null}
      </Form.Item>
    );
  }
}

class PlaintextParser {
  public static parse(html: string): string {
    if (!html) return '';

    html = html.replace(/<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi, '$4 ( $2 )');
    html = html.replace(/<h[1-7](.*?)>(.*?)<\/h[1-7]>/, '$2\n');

    html = html.replace(/<br>\n/gi, '<br>');
    html = html.replace(/<br>/gi, '\n');
    html = html.replace(/<hr(.*?)>/gi, '\n------------\n');

    html = html.replace(/<div>/gi, '');
    html = html.replace(/<\/div>/gi, '');
    html = html.replace(/<p>/gi, '');
    html = html.replace(/<\/p>/gi, '');
    html = html.replace(/<pre>/gi, '');
    html = html.replace(/<\/pre>/gi, '');
    html = html.replace(/<td(.*?)>/gi, ' ');
    html = html.replace(/<tr(.*?)>/gi, '\n');

    html = html.replace(/<head>(.*?)<\/head>/gim, '');
    html = html.replace(/<object>(.*?)<\/object>/gim, '');
    html = html.replace(/<script(.*?)>(.*?)<\/script>/gim, '');
    html = html.replace(/<style(.*?)>(.*?)<\/style>/gim, '');
    html = html.replace(/<title>(.*?)<\/title>/gim, '');
    html = html.replace(/<!--(.*?)-->/gim, '\n');

    html = html.replace(/<(?:[^>'"]*|(['"]).*?\1)*>/gim, '');
    html = html.replace(/\r\r/gi, '');
    // html = html.replace(/(\S)\n/gi, '$1 ');
    const entityDecode = document.createElement('textarea');
    entityDecode.innerHTML = html;
    html = entityDecode.value;
    html = html.replace(/&nbsp;/gi, '');
    html = html.replace(/&gt;/gi, '>');
    html = html.replace(/&lt;/gi, '<');
    html = html.replace(/&amp;/gi, '&');

    const duplicateCheck = html.match(/(\S*?) \(\s(.*?)\s\)/g) || [];
    duplicateCheck.forEach(potentialDuplicate => {
      const parts = potentialDuplicate.split(' ');
      const part1 = parts[0];
      const part2 = parts[2].replace(/(\(|\))/g, '');
      if (part1 === part2) {
        html = html.replace(potentialDuplicate, part1);
      }
    });

    return html.trim();
  }
}
