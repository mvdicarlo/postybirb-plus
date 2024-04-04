import { IsString, IsDefined } from 'class-validator';

export class TwitterAuthorization {
  @IsString()
  @IsDefined()
  readonly verifier: string;

  @IsString()
  @IsDefined()
  readonly oauth_token: string;

  @IsString()
  @IsDefined()
  readonly key: string;

  @IsString()
  @IsDefined()
  readonly secret: string;
}
