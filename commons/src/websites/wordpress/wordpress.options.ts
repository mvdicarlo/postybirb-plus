import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { WordPressNotificationOptions } from '../../interfaces/websites/wordpress/wordpress.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';

export class WordPressOptionsEntity
    extends DefaultOptionsEntity
{
    @Expose()
    @IsOptional()
    @IsString()
    slug?: string;

    @Expose()
    @IsString()
    @DefaultValue('open')
    commentStatus!: 'open' | 'close';

    @Expose()
    @IsString()
    @DefaultValue('standard')
    format!: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio';

    @Expose()
    @IsOptional()
    @IsString()
    categories?: string;

    @Expose()
    @IsOptional()
    @IsString()
    @DefaultValue("publish")
    status?: 'publish' | 'future' | 'draft' | 'pending' | 'private';

    @Expose()
    @IsBoolean()
    @DefaultValue(false)
    sticky!: boolean;

    constructor(entity?: Partial<WordPressNotificationOptions>) {
        super(entity as DefaultOptions);
    }
}

export class WordPress {
    static readonly FileOptions = WordPressOptionsEntity;
    static readonly NotificationOptions = WordPressOptionsEntity;
}
