import { Controller, Get, Patch, Body, Delete, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('all')
  async getAll() {
    return this.service.getAll();
  }

  @Patch('seen')
  async markAsViewed(@Body() body: { ids: string[] }) {
    return this.service.markAsViewed(body.ids);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (id === 'all') {
      return this.service.deleteAll();
    }
    return this.service.deleteNotification(id);
  }
}
