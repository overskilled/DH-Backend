import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TimeEntryService } from './time-entry.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Controller('time-entry')
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Post()
  create(@Body() createTimeEntryDto: CreateTimeEntryDto) {
    return this.timeEntryService.create(createTimeEntryDto);
  }

  @Get()
  findAll() {
    return this.timeEntryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timeEntryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimeEntryDto: UpdateTimeEntryDto) {
    return this.timeEntryService.update(+id, updateTimeEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timeEntryService.remove(+id);
  }
}
