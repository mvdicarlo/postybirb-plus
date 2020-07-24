export interface LoginResponse {
  data?: any;
  loggedIn: boolean;
  username: string;
}

export interface LoginResponseDto {
  loggedIn: boolean;
  username: string;
}
