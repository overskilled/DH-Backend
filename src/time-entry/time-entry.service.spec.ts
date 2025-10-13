import { Test, TestingModule } from '@nestjs/testing';
import { TimeEntryService } from './time-entry.service';

describe('TimeEntryService', () => {
  let service: TimeEntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeEntryService],
    }).compile();

    service = module.get<TimeEntryService>(TimeEntryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
