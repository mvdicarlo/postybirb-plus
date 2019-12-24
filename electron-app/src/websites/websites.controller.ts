import { Controller, Get } from '@nestjs/common';
import { WebsitesService } from './websites.service';

@Controller('websites')
export class WebsitesController {
    constructor(private readonly service: WebsitesService) {}

    @Get('username-shortcuts')
    async getUsernameShortcuts() {
        return this.service.getUsernameShortcuts();
    }
}
