import { Module } from '@nestjs/common';
import { TimeEntryService } from './time-entry.service';
import { TimeEntryController } from './time-entry.controller';

@Module({
  controllers: [TimeEntryController],
  providers: [TimeEntryService],
})
export class TimeEntryModule {}
