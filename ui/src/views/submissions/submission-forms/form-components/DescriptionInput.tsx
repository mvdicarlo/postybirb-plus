import React from 'react';
import sanitize from 'sanitize-html';
import { inject, observer } from 'mobx-react';
import { Editor } from '@tinymce/tinymce-react';
import { Form, Switch, Button, Popover, Typography } from 'antd';
import { DescriptionTemplateStore } from '../../../../stores/description-template.store';
import { DescriptionData } from 'postybirb-commons';
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
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
    browser_spellcheck: true, // should be supported in electron 8
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
                title="Standard Shortcuts"
                onVisibleChange={visible => this.setState({ shortcutsHovered: visible })}
                content={
                  <div className="overflow-auto" style={{ maxHeight: '50vh' }}>
                    <div>Helpful shortcuts that are built into the description parser:</div>
                    <ul>
                      <li>
                        <code>{'{default}'}</code>
                        <span className="mx-1">-</span>
                        <span>
                          Inserts the website description or the default description text at the location of this tag.
                          <br />
                          Best used when overriding the default description for specific websites.
                        </span>
                      </li>
                      <li>
                        <code>{'{title}'}</code>
                        <span className="mx-1">-</span>
                        <span>
                          Inserts the website title or the default title
                        </span>
                      </li>
                      <li>
                        <code>{'{tags}'}</code>
                        <span className="mx-1">-</span>
                        <span>
                          Inserts the website tags or the default tags separated by ' #'
                        </span>
                      </li>
                      <li>
                        <code>{'{cw}'}</code>
                        <span className="mx-1">-</span>
                        <span>
                          Inserts the content warning
                        </span>
                      </li>
                    </ul>
                  </div>
                }
              >
                <Button size="small">Standard Shortcuts</Button>
              </Popover>
              <Popover
                title="Username Shortcuts"
                onVisibleChange={visible => this.setState({ shortcutsHovered: visible })}
                content={
                  <div className="overflow-auto" style={{ maxHeight: '50vh' }}>
                    <em>
                      Example: {'{tw:minnownade}'} -&gt; https://twitter.com/minnownade (would
                      appear as @minnownade on Twitter)
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
              <Popover
                className="ml-1"
                title="Shortcut Modifiers"
                content={
                  <div className="overflow-auto" style={{ maxHeight: '50vh' }}>
                    <div>
                      A shortcut modifier goes before a shortcut tag and is used to change how the
                      description is parsed.
                      <br />
                      Format: <code>{'{[modifier=value]<tag>:<dynamic-content>}'}</code>
                    </div>
                    <ul>
                      <li>
                        <code>only</code>
                        <span className="mx-1">-</span>
                        <span>
                          A tag with the <code>only</code> modifier will only have that shortcut
                          used when sent to the specified website(s).
                        </span>
                        <div>
                          <em>
                            Example: {'{[only=twitter,discord]tw:minnownade}'} would result in only
                            Twitter and Discord receiving the {'{tw:minnownade}'} shortcut.
                          </em>
                        </div>
                      </li>
                    </ul>
                  </div>
                }
              >
                <Button size="small">Shortcut Modifiers</Button>
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
