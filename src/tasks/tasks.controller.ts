// src/tasks/tasks.controller.ts - AJOUTER LE PARAMÈTRE userId
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { TransferTaskDto } from './dto/transfer-task.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle tâche' })
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    const createTaskDtoWithCreator = {
      ...dto,
      createdById: req.user.id
    };
    return this.tasksService.create(createTaskDtoWithCreator);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les tâches avec filtres' })
  findAll(
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('listId') listId?: string,
    @Query('userId') userId?: string, // NOUVEAU : Pour rechercher assigné OU relecteur
  ) {
    return this.tasksService.findAll({ status, assigneeId, listId, userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une tâche par son ID' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req: any) {
    const userId = req.user.id;
    return this.tasksService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.tasksService.remove(id, userId);
  }

  @Get('list/:listId')
  @ApiOperation({ summary: 'Récupérer les tâches d\'une liste' })
  async getTasksByList(
    @Param('listId') listId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string, // NOUVEAU : Paramètre important !
  ) {
    console.log('📥 Requête getTasksByList avec filtres:', {
      listId,
      page,
      limit,
      assigneeId,
      status,
      userId // Va permettre de voir les tâches en relecture
    });
    
    return this.tasksService.getTasksByList(listId, {
      page: Number(page),
      limit: Number(limit),
      assigneeId,
      status,
      userId, // CORRECTION : Transmettre au service
    });
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assigner une tâche à un utilisateur' })
  async assignTask(
    @Param('id') id: string,
    @Body() body: { assigneeId: string },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.tasksService.assignTask(id, body.assigneeId, userId);
  }

  @Patch(':id/transfer')
  @ApiOperation({ summary: 'Transférer une tâche pour relecture ou prise en charge' })
  async transferTask(
    @Param('id') id: string,
    @Body() transferTaskDto: TransferTaskDto,
    @Req() req: any
  ) {
    return this.tasksService.transferTask(
      id,
      transferTaskDto,
      req.user.id
    );
  }

  @Patch(':id/complete-review')
  @ApiOperation({ summary: 'Compléter une relecture' })
  async completeReview(
    @Param('id') id: string,
    @Body() body: { approved: boolean; feedback?: string },
    @Req() req: any
  ) {
    return this.tasksService.completeReview(
      id,
      req.user.id,
      body.approved,
      body.feedback
    );
  }

  @Get(':id/reviewers')
  @ApiOperation({ summary: 'Récupérer les relecteurs d\'une tâche' })
  async getReviewers(@Param('id') id: string) {
    return this.tasksService.getTaskReviewers(id);
  }
}