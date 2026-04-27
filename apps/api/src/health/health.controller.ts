import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: 'ok'; uptime: number } {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }
}
