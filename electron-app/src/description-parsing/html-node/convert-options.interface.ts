import HtmlNode from './html-node';

export interface ConvertOptions {
  allowedStyles?: string[];
  bbcode?: BBCodeConvertOptions;
  classCreator?: (tag: string, style: string, value: string) => string;
  collapseSimilarTags?: boolean;
  collapseOnStyleOnly?: boolean;
  convertTag?: Record<string, string>;
  customParser?: (node: HtmlNode, options: ConvertOptions) => string;
  hrefParser?: (text: string, href: string) => string;
}

export interface BBCodeConvertOptions {
  replaceBlockWith?: string;
  altHR?: boolean;
}
