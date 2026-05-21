import { Module } from '@nestjs/common';

import { ProjectController } from './project.controller';
import { DrizzleProjectRepository } from './project.repository';
import { ProjectService } from './project.service';

@Module({
  controllers: [ProjectController],
  providers: [
    DrizzleProjectRepository,
    {
      provide: ProjectService,
      useFactory: (repo: DrizzleProjectRepository) => new ProjectService(repo),
      inject: [DrizzleProjectRepository],
    },
  ],
})
export class ProjectModule {}
