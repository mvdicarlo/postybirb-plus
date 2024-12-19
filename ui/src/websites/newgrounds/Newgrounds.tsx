import { Checkbox, Form, Radio } from 'antd';
import {
  DefaultOptions,
  FileSubmission,
  NewgroundsFileOptions,
  Submission,
  SubmissionRating,
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class Newgrounds extends WebsiteImpl {
  internalName: string = 'Newgrounds';
  name: string = 'Newgrounds';
  supportsTags: boolean = true;
  loginUrl: string = 'https://www.newgrounds.com/login';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, NewgroundsFileOptions>) => (
    <NewgroundsFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: false,
      }}
      tagOptions={{
        show: true,
        options: {
          maxTags: 12,
        },
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      tagOptions={{
        show: true,
        options: {
          maxTags: 12,
        },
      }}
      ratingOptions={{
        show: true,
        ratings: [
          {
            value: SubmissionRating.GENERAL,
            name: 'Suitable for everyone',
          },
          {
            value: 't',
            name: 'May be inappropriate for kids under 13',
          },
          {
            value: SubmissionRating.MATURE,
            name: 'Mature subject matter. Not for kids!',
          },
          {
            value: SubmissionRating.ADULT,
            name: 'Adults only! This is NSFW and not for kids!',
          },
        ],
      }}
    />
  );
}

export class NewgroundsFileSubmissionForm extends GenericFileSubmissionSection<NewgroundsFileOptions> {
  renderRightForm(data: NewgroundsFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Nudity">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'nudity')}
          value={data.nudity}
          buttonStyle="solid"
        >
          <Radio.Button value="c">None</Radio.Button>
          <Radio.Button value="b">Some</Radio.Button>
          <Radio.Button value="a">Lots</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Violence">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'violence')}
          value={data.violence}
          buttonStyle="solid"
        >
          <Radio.Button value="c">None</Radio.Button>
          <Radio.Button value="b">Some</Radio.Button>
          <Radio.Button value="a">Lots</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Explicit Text">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'explicitText')}
          value={data.explicitText}
          buttonStyle="solid"
        >
          <Radio.Button value="c">None</Radio.Button>
          <Radio.Button value="b">Some</Radio.Button>
          <Radio.Button value="a">Lots</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Adult Themes">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'adultThemes')}
          value={data.adultThemes}
          buttonStyle="solid"
        >
          <Radio.Button value="c">None</Radio.Button>
          <Radio.Button value="b">Some</Radio.Button>
          <Radio.Button value="a">Lots</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Category">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'category')}
          value={data.category}
          buttonStyle="solid"
        >
          <Radio.Button value="4">3D Art</Radio.Button>
          <Radio.Button value="7">Comic</Radio.Button>
          <Radio.Button value="3">Fine Art</Radio.Button>
          <Radio.Button value="1">Illustration</Radio.Button>
          <Radio.Button value="5">Pixel Art</Radio.Button>
          <Radio.Button value="6">Other</Radio.Button>
        </Radio.Group>
      </Form.Item>,
    );
    return elements;
  }
  renderLeftForm(data: NewgroundsFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.sketch} onChange={this.handleCheckedChange.bind(this, 'sketch')}>
          Is a sketch
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.creativeCommons}
          onChange={this.handleCheckedChange.bind(this, 'creativeCommons')}
        >
          Use a Creative Commons license
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.commercial}
          onChange={this.handleCheckedChange.bind(this, 'commercial')}
        >
          Allow commercial uses
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.modification}
          onChange={this.handleCheckedChange.bind(this, 'modification')}
        >
          Allow modification
        </Checkbox>
      </div>,
    );
    return elements;
  }
}
