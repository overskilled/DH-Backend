// // time-entry.controller.ts - BACKEND
// import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
// import { TimeEntryService } from './time-entry.service';
// import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
// import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
// import { AuthGuard } from 'src/auth/guards/auth.guard';

// @Controller('time-entries')
// @UseGuards(AuthGuard)
// export class TimeEntryController {
//   constructor(private readonly timeEntryService: TimeEntryService) {}

//   @Post()
//   // create(@Body() createTimeEntryDto: CreateTimeEntryDto) {
//   //   return this.timeEntryService.create(createTimeEntryDto);
//   // }
//     create(@Body() createTimeEntryDto: CreateTimeEntryDto, @Req() req: any) {
//     // Récupérer l'ID de l'utilisateur connecté depuis le token
//     const userId = req.user.userId;
//     return this.timeEntryService.create(createTimeEntryDto, userId);
//   }

//   @Get()
//   findAll(
//     @Query('page') page: number = 1,
//     @Query('limit') limit: number = 10,
//   ) {
//     return this.timeEntryService.findAll({ page: Number(page), limit: Number(limit) });
//   }

//   @Get('task/:taskId')
//     findByTask(@Param('taskId') taskId: string) {
//     return this.timeEntryService.findByTask(taskId);
//   }
//   // findByTask(
//   //   @Param('taskId') taskId: string,
//   //   @Query('page') page: number = 1,
//   //   @Query('limit') limit: number = 10,
//   // ) {
//   //   return this.timeEntryService.findByTask(taskId, { page: Number(page), limit: Number(limit) });
//   // }

//   @Get('user/:userId')
//   findByUser(
//     @Param('userId') userId: string,
//     @Query('page') page: number = 1,
//     @Query('limit') limit: number = 10,
//   ) {
//     return this.timeEntryService.findByUser(userId, { page: Number(page), limit: Number(limit) });
//   }

//   @Get('summary/:userId')
//   getTimeSummary(
//     @Param('userId') userId: string,
//     @Query('startDate') startDate?: string,
//     @Query('endDate') endDate?: string,
//   ) {
//     const start = startDate ? new Date(startDate) : undefined;
//     const end = endDate ? new Date(endDate) : undefined;
//     return this.timeEntryService.getTimeSummary(userId, start, end);
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.timeEntryService.findOne(id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateTimeEntryDto: UpdateTimeEntryDto) {
//     return this.timeEntryService.update(id, updateTimeEntryDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.timeEntryService.remove(id);
//   }
// }

// time-entry.controller.ts - VERSION CORRIGÉE
import { Controller, Get, Post, Body, Patch, Query,Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TimeEntryService } from './time-entry.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';


@Controller('time-entries')
@UseGuards(AuthGuard)
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Post()
  create(@Body() createTimeEntryDto: CreateTimeEntryDto, @Req() req: any) {
    console.log('TimeEntry Controller - Creating time entry for user:', req.user);
    
    // Récupérer l'ID de l'utilisateur connecté depuis le token
    // const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.timeEntryService.create(createTimeEntryDto, userId);
  }

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.timeEntryService.findByTask(taskId);
  }

  @Get('document/:documentId')
findByDocument(
  @Param('documentId') documentId: string,
  @Query('onlyUninvoiced') onlyUninvoiced?: boolean,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string
) {
  return this.timeEntryService.findByDocument(documentId, {
    onlyUninvoiced,
    startDate,
    endDate
  });
}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimeEntryDto: UpdateTimeEntryDto) {
    return this.timeEntryService.update(id, updateTimeEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timeEntryService.remove(id);
  }
}