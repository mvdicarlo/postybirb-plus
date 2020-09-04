import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { HentaiFoundryFileOptions } from '../../../../electron-app/src/server/websites/hentai-foundry/hentai-foundry.interface';
import { Form, Checkbox, Select, Input } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/server/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/server/submission/interfaces/submission.interface';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { DefaultOptions } from '../../../../electron-app/src/server/submission/submission-part/interfaces/default-options.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericSelectProps } from '../generic/GenericSelectProps';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { HentaiFoundryCategories } from './hentai-foundry-categories';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';

const defaultFileOptions: HentaiFoundryFileOptions = {
  ...GenericDefaultFileOptions,
  scraps: false,
  disableComments: false,
  category: undefined,
  nudityRating: '0',
  violenceRating: '0',
  profanityRating: '0',
  racismRating: '0',
  sexRating: '0',
  spoilersRating: '0',
  yaoi: false,
  yuri: false,
  teen: false,
  guro: false,
  furry: false,
  beast: false,
  male: false,
  female: false,
  futa: false,
  other: false,
  scat: false,
  incest: false,
  rape: false,
  media: '0',
  timeTaken: undefined,
  license: '0',
  reference: undefined
};

const defaultNotificationOptions: DefaultOptions = GenericDefaultNotificationOptions;

export class HentaiFoundry implements Website {
  internalName: string = 'HentaiFoundry';
  name: string = 'Hentai Foundry';
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.hentai-foundry.com/site/login" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, HentaiFoundryFileOptions>) => (
    <HentaiFoundryFileSubmissionForm
      key={props.part.accountId}
      hideThumbnailOptions={true}
      ratingOptions={{
        show: false
      }}
      tagOptions={{
        show: true,
        options: {
          maxLength: 75,
          mode: 'length'
        }
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      tagOptions={{ show: false }}
      ratingOptions={{
        show: false
      }}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? defaultFileOptions : defaultNotificationOptions
    );
  }
}

export class HentaiFoundryFileSubmissionForm extends GenericFileSubmissionSection<
  HentaiFoundryFileOptions
> {
  renderRightForm(data: HentaiFoundryFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Time Taken">
        <Input
          className="w-full"
          value={data.timeTaken}
          maxLength={50}
          onChange={this.handleValueChange.bind(this, 'timeTaken')}
        />
      </Form.Item>,
      <Form.Item label="Reference">
        <Input
          className="w-full"
          value={data.reference}
          onChange={this.handleValueChange.bind(this, 'reference')}
        />
      </Form.Item>,
      <Form.Item label="Category" required>
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.category}
          onSelect={this.setValue.bind(this, 'category')}
        >
          {Object.entries(HentaiFoundryCategories).map(([key, title]) => (
            <Select.Option value={key}>{title}</Select.Option>
          ))}
        </Select>
      </Form.Item>,
      <Form.Item label="Nudity" required>
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.nudityRating}
          onSelect={this.setValue.bind(this, 'nudityRating')}
        >
          <Select.Option value="0">None</Select.Option>
          <Select.Option value="1">Mild Nudity</Select.Option>
          <Select.Option value="2">Moderate Nudity</Select.Option>
          <Select.Option value="3">Explicit Nudity</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Violence" required>
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.violenceRating}
          onSelect={this.setValue.bind(this, 'violenceRating')}
        >
          <Select.Option value="0">None</Select.Option>
          <Select.Option value="1">Comic or Mild Violence</Select.Option>
          <Select.Option value="2">Moderate Violence</Select.Option>
          <Select.Option value="3">Explicit or Graphic Violence</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Profanity" required>
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.profanityRating}
          onSelect={this.setValue.bind(this, 'profanityRating')}
        >
          <Select.Option value="0">None</Select.Option>
          <Select.Option value="1">Mild Profanity</Select.Option>
          <Select.Option value="2">Moderate Profanity</Select.Option>
          <Select.Option value="3">Proliferous or Severe Profanity</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Racism" required>
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.racismRating}
          onSelect={this.setValue.bind(this, 'racismRating')}
        >
          <Select.Option value="0">None</Select.Option>
          <Select.Option value="1">Mild Racist themes or content</Select.Option>
          <Select.Option value="2">Racist themes or content</Select.Option>
          <Select.Option value="3">Strong racist themes or content</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Sexual Content" required>
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.sexRating}
          onSelect={this.setValue.bind(this, 'sexRating')}
        >
          <Select.Option value="0">None</Select.Option>
          <Select.Option value="1">Mild suggestive content</Select.Option>
          <Select.Option value="2">Moderate suggestive or sexual content</Select.Option>
          <Select.Option value="3">Explicit or adult sexual content</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Spoiler Warning" required>
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.spoilersRating}
          onSelect={this.setValue.bind(this, 'spoilersRating')}
        >
          <Select.Option value="0">None</Select.Option>
          <Select.Option value="1">Mild Spoiler Warning</Select.Option>
          <Select.Option value="2">Moderate Spoiler Warning</Select.Option>
          <Select.Option value="3">Major Spoiler Warning</Select.Option>
        </Select>
      </Form.Item>,
      <Form.Item label="Media" required>
        <Select
          className="w-full"
          {...GenericSelectProps}
          value={data.media}
          onSelect={this.setValue.bind(this, 'media')}
        >
          <Select.OptGroup label="Traditional media"></Select.OptGroup>
          <Select.OptGroup label="Drawings">
            <Select.Option value="1">Charcoal</Select.Option>
            <Select.Option value="2">Colored Pencil / Crayon</Select.Option>
            <Select.Option value="3">Ink or markers</Select.Option>
            <Select.Option value="4">Oil pastels</Select.Option>
            <Select.Option value="5">Graphite pencil</Select.Option>
            <Select.Option value="6">Other drawing</Select.Option>
          </Select.OptGroup>
          <Select.OptGroup label="Paintings">
            <Select.Option value="11">Airbrush</Select.Option>
            <Select.Option value="12">Acrylics</Select.Option>
            <Select.Option value="13">Oils</Select.Option>
            <Select.Option value="14">Watercolor</Select.Option>
            <Select.Option value="15">Other painting</Select.Option>
          </Select.OptGroup>
          <Select.OptGroup label="Crafts / Physical art">
            <Select.Option value="21">Plushies</Select.Option>
            <Select.Option value="22">Sculpture</Select.Option>
            <Select.Option value="23">Other crafts</Select.Option>
          </Select.OptGroup>

          <Select.OptGroup label="Digital media (CG)">
            <Select.Option value="31">3D modelling</Select.Option>
            <Select.Option value="33">Digital drawing or painting</Select.Option>
            <Select.Option value="36">MS Paint</Select.Option>
            <Select.Option value="32">Oekaki</Select.Option>
            <Select.Option value="34">Pixel art</Select.Option>
            <Select.Option value="35">Other digital art</Select.Option>
          </Select.OptGroup>
          <Select.Option value="0">Unspecified</Select.Option>
        </Select>
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: HentaiFoundryFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.scraps} onChange={this.handleCheckedChange.bind(this, 'scraps')}>
          Send to scraps
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.disableComments}
          onChange={this.handleCheckedChange.bind(this, 'disableComments')}
        >
          Disable Comments
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.yaoi} onChange={this.handleCheckedChange.bind(this, 'yaoi')}>
          Yaoi
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.yuri} onChange={this.handleCheckedChange.bind(this, 'yuri')}>
          Yuri
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.teen} onChange={this.handleCheckedChange.bind(this, 'teen')}>
          Teen
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.guro} onChange={this.handleCheckedChange.bind(this, 'guro')}>
          Guro
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.furry} onChange={this.handleCheckedChange.bind(this, 'furry')}>
          Furry
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.beast} onChange={this.handleCheckedChange.bind(this, 'beast')}>
          Beast
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.male} onChange={this.handleCheckedChange.bind(this, 'male')}>
          Male
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.female} onChange={this.handleCheckedChange.bind(this, 'female')}>
          Female
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.futa} onChange={this.handleCheckedChange.bind(this, 'futa')}>
          Futa
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.other} onChange={this.handleCheckedChange.bind(this, 'other')}>
          Other
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.scat} onChange={this.handleCheckedChange.bind(this, 'scat')}>
          Scat
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.incest} onChange={this.handleCheckedChange.bind(this, 'incest')}>
          Incest
        </Checkbox>
      </div>,
      <div>
        <Checkbox checked={data.rape} onChange={this.handleCheckedChange.bind(this, 'rape')}>
          Rape
        </Checkbox>
      </div>
    );
    return elements;
  }
}
