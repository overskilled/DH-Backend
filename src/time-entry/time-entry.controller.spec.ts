import { Test, TestingModule } from '@nestjs/testing';
import { TimeEntryController } from './time-entry.controller';
import { TimeEntryService } from './time-entry.service';

describe('TimeEntryController', () => {
  let controller: TimeEntryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeEntryController],
      providers: [TimeEntryService],
    }).compile();

    controller = module.get<TimeEntryController>(TimeEntryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
