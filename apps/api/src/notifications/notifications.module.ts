import { Module } from '@nestjs/common';

import { NotificationsController } from './notifications.controller';
import { DrizzleNotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    DrizzleNotificationsRepository,
    {
      provide: NotificationsService,
      useFactory: (repo: DrizzleNotificationsRepository) => new NotificationsService(repo),
      inject: [DrizzleNotificationsRepository],
    },
  ],
})
export class NotificationsModule {}
