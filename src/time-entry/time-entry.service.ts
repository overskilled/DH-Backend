import { Injectable } from '@nestjs/common';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Injectable()
export class TimeEntryService {
  create(createTimeEntryDto: CreateTimeEntryDto) {
    return 'This action adds a new timeEntry';
  }

  findAll() {
    return `This action returns all timeEntry`;
  }

  findOne(id: number) {
    return `This action returns a #${id} timeEntry`;
  }

  update(id: number, updateTimeEntryDto: UpdateTimeEntryDto) {
    return `This action updates a #${id} timeEntry`;
  }

  remove(id: number) {
    return `This action removes a #${id} timeEntry`;
  }
}
