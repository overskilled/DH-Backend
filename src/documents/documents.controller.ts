import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

import { DocumentResponseDto, DocumentDetailResponseDto } from './dto/document-response.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateListDto } from 'src/lists/dto/create-list.dto';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { UpdateTaskDto } from 'src/tasks/dto/update-task.dto';
import { CreateTimeEntryDto } from 'src/time-entry/dto/create-time-entry.dto';

@ApiTags('documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post()
  @ApiOperation({
    summary: 'Create Document',
    description: 'Create a new document. Access: Board members and Associates only.'
  })
  async createDocument(@Request() req, @Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.createDocument(req.user.id, createDocumentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get All Documents',
    description: 'Get all documents with role-based access control.'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'ARCHIVED', 'CLOSED'] })
  @ApiQuery({ name: 'departmentId', required: false })
  async getAllDocuments(
    @Request() req,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.documentsService.findAllDocuments(req.user, { status, departmentId });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Document by ID',
    description: 'Get detailed document information with all related data.'
  })
  async getDocumentById(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findDocumentById(req.user, id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update Document',
    description: 'Update document information. Access: Board, Associates, Document Creator, or Document Responsible.'
  })
  async updateDocument(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.updateDocument(req.user, id, updateDocumentDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Document',
    description: 'Delete a document. Access: Board members and Associates only.'
  })
  async deleteDocument(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.deleteDocument(req.user, id);
  }

  // List Management Endpoints
  @Post('lists')
  @ApiOperation({
    summary: 'Create List',
    description: 'Create a new list within a document. Access: Board, Associates, Document Creator, or Document Responsible.'
  })
  async createList(@Request() req, @Body() createListDto: CreateListDto) {
    return this.documentsService.createList(req.user, createListDto);
  }

  @Put('lists/:listId/status')
  @ApiOperation({
    summary: 'Update List Status',
    description: 'Update list status. Access: Board, Associates, Document Creator, or Document Responsible.'
  })
  async updateListStatus(
    @Request() req,
    @Param('listId', ParseUUIDPipe) listId: string,
    @Body('status') status: string,
  ) {
    return this.documentsService.updateListStatus(req.user, listId, status);
  }

  // Task Management Endpoints
  @Post('tasks')
  @ApiOperation({
    summary: 'Create Task',
    description: 'Create a new task within a list. Access: Board, Associates, Document Creator, or Document Responsible.'
  })
  async createTask(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.documentsService.createTask(req.user, createTaskDto);
  }

  @Put('tasks/:taskId')
  @ApiOperation({
    summary: 'Update Task',
    description: 'Update task information. Access: Board, Associates, Document Responsible, or Task Assignee.'
  })
  async updateTask(
    @Request() req,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskDto: any,
  ) {
    return this.documentsService.updateTask(req.user, taskId, updateTaskDto);
  }

  @Put('tasks/:taskId/assign')
  @ApiOperation({
    summary: 'Assign Task',
    description: 'Assign a task to a user. Access: Board, Associates, Document Creator, or Document Responsible.'
  })
  async assignTask(
    @Request() req,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    return this.documentsService.assignTask(req.user, taskId, assigneeId);
  }

  // Time Entry Endpoints
  @Post('time-entries')
  @ApiOperation({
    summary: 'Create Time Entry',
    description: 'Create a time entry for a task. Access: Task Assignee, Document Responsible, Board, or Associates.'
  })
  async createTimeEntry(@Request() req, @Body() createTimeEntryDto: CreateTimeEntryDto) {
    return this.documentsService.createTimeEntry(req.user, createTimeEntryDto);
  }
 
  // User-specific endpoints
  @Get('my/tasks')
  @ApiOperation({
    summary: 'Get My Tasks',
    description: 'Get tasks assigned to the current user or where user is requested.'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'] })
  async getMyTasks(@Request() req, @Query('status') status?: string) {
    return this.documentsService.getMyTasks(req.user, status);
  }

  @Get('department/tasks')
  @ApiOperation({
    summary: 'Get Department Tasks',
    description: 'Get all tasks in user\'s department. Access: Board, Associates, or Department Managers.'
  })
  async getDepartmentTasks(@Request() req, @Query('departmentId') departmentId?: string) {
    return this.documentsService.getDepartmentTasks(req.user, departmentId);
  }
}