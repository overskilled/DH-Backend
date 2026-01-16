import { Test, TestingModule } from '@nestjs/testing';
import { DashboardStatsController } from './dashboard-stats.controller';

describe('DashboardStatsController', () => {
  let controller: DashboardStatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardStatsController],
    }).compile();

    controller = module.get<DashboardStatsController>(DashboardStatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
