import { Module } from '@nestjs/common';

import { DrizzleServiceRepository } from './service.repository';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  controllers: [ServiceController],
  providers: [
    DrizzleServiceRepository,
    {
      provide: ServiceService,
      useFactory: (repo: DrizzleServiceRepository) => new ServiceService(repo),
      inject: [DrizzleServiceRepository],
    },
  ],
})
export class ServiceModule {}
