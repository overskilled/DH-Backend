import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // @Post()
  // create(@Body() dto: CreateTaskDto) {
  //   return this.tasksService.create(dto);
  // }
  @Post()
create(@Body() dto: CreateTaskDto, @Req() req: any) {
  //  console.log('User from request:', req.user);
  // Ajouter l'ID de l'utilisateur connecté comme créateur
  const createTaskDtoWithCreator = {
    ...dto,
    createdById: req.user.id // Assurez-vous que l'auth est configurée
  };
  return this.tasksService.create(createTaskDtoWithCreator);
}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('listId') listId?: string,
  ) {
    return this.tasksService.findAll({ status, assigneeId, listId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
  @Get('list/:listId')
  async getTasksByList(
    @Param('listId') listId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: string,
  ) {
    return this.tasksService.getTasksByList(listId, {
      page: Number(page),
      limit: Number(limit),
      assigneeId,
      status,
    });
  }

    @Patch(':id/assign')
  async assignTask(
    @Param('id') id: string,
    @Body() body: { assigneeId: string }
  ) {
    return this.tasksService.update(id, { assigneeId: body.assigneeId });
  }

  

}
