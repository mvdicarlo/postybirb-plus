export interface TumblrAccountData {
  secret: string;
  token: string;
  user: {
    name: string;
    blogs: TumblrBlog[];
  };
}

export interface TumblrBlog {
  name: string;
  primary: boolean;
}
