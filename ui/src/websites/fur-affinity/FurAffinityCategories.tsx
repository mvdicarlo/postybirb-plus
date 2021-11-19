import React from 'react';
import { Select } from 'antd';
const { OptGroup, Option } = Select;

export const FurAffinityCategories = [
  <OptGroup label="Visual Art">
    <Option value="1">All</Option>
    <Option value="2">Artwork (Digital)</Option>
    <Option value="3">Artwork (Traditional)</Option>
    <Option value="4">Cellshading</Option>
    <Option value="5">Crafting</Option>
    <Option value="6">Designs</Option>
    <Option value="8">Fursuiting</Option>
    <Option value="9">Icons</Option>
    <Option value="10">Mosaics</Option>
    <Option value="11">Photography</Option>
    <Option value="32">Food / Recipes</Option>
    <Option value="12">Sculpting</Option>
  </OptGroup>,
  <OptGroup label="Readable Art">
    <Option value="13">Story</Option>
    <Option value="14">Poetry</Option>
    <Option value="15">Prose</Option>
  </OptGroup>,
  <OptGroup label="Audio Art">
    <Option value="16">Music</Option>
    <Option value="17">Podcasts</Option>
  </OptGroup>,
  <OptGroup label="Downloadable">
    <Option value="18">Skins</Option>
    <Option value="19">Handhelds</Option>
    <Option value="20">Resources</Option>
  </OptGroup>,
  <OptGroup label="Other Stuff">
    <Option value="21">Adoptables</Option>
    <Option value="22">Auctions</Option>
    <Option value="23">Contests</Option>
    <Option value="24">Current Events</Option>
    <Option value="26">Stockart</Option>
    <Option value="27">Screenshots</Option>
    <Option value="28">Scraps</Option>
    <Option value="29">Wallpaper</Option>
    <Option value="30">YCH / Sale</Option>
    <Option value="31">Other</Option>
  </OptGroup>
];
