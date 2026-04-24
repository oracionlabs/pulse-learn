import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users/me/notifications')
export class NotificationsController {
  constructor(private notifsService: NotificationsService) {}

  @Get()
  getAll(@CurrentUser() user: { _id: string }, @Query('limit') limit?: string) {
    return this.notifsService.getMyNotifications(
      user._id,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: { _id: string }) {
    return this.notifsService
      .getUnreadCount(user._id)
      .then((count) => ({ count }));
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { _id: string }) {
    return this.notifsService.markAllRead(user._id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: { _id: string }, @Param('id') id: string) {
    return this.notifsService.markRead(user._id, id);
  }
}
