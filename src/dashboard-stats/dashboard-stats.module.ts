import { Module } from '@nestjs/common';
import { DashboardStatsService } from './dashboard-stats.service';
import { DashboardStatsController } from './dashboard-stats.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardStatsController],
  providers: [DashboardStatsService],
  exports: [DashboardStatsService]
})
export class DashboardStatsModule {}