import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DepartementsService } from './departements.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('departments')
@Controller('departements')
export class DepartementsController {
  constructor(private readonly departementsService: DepartementsService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create a new department' })
  // @ApiResponse({ status: 201, description: 'Department successfully created' })
  // @ApiResponse({ status: 400, description: 'Department name already exists' })
  // create(@Body() createDepartementDto: CreateDepartementDto) {
  //   return this.departementsService.create(createDepartementDto);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all departments with user and document counts' })
  @ApiResponse({ status: 200, description: 'Returns all departments' })
  findAll() {
    return this.departementsService.findAll();
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get department by name' })
  @ApiParam({ name: 'name', description: 'Department name' })
  @ApiResponse({ status: 200, description: 'Returns department by name' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  findByName(@Param('name') name: string) {
    return this.departementsService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Returns department by ID' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  findOne(@Param('id') id: string) {
    return this.departementsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get comprehensive statistics for a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns comprehensive department statistics including team members, projects, tasks, and financial data' 
  })
  @ApiResponse({ status: 404, description: 'Department not found' })
  getStats(@Param('id') id: string) {
    return this.departementsService.getDepartmentStats(id);
  }

  // @Get(':id/users')
  // @ApiOperation({ summary: 'Get all users in a department' })
  // @ApiParam({ name: 'id', description: 'Department UUID' })
  // @ApiResponse({ status: 200, description: 'Returns all department users with their tasks and time entries' })
  // @ApiResponse({ status: 404, description: 'Department not found' })
  // getUsers(@Param('id') id: string) {
  //   return this.departementsService.getDepartmentUsers(id);
  // }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get all documents in a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Returns all department documents with their lists, tasks, and invoices' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  getDocuments(@Param('id') id: string) {
    return this.departementsService.getDepartmentDocuments(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department successfully updated' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 400, description: 'Department name already exists' })
  update(@Param('id') id: string, @Body() updateDepartementDto: UpdateDepartementDto) {
    return this.departementsService.update(id, updateDepartementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department successfully deleted' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete department with associated users or documents' })
  remove(@Param('id') id: string) {
    return this.departementsService.remove(id);
  }
}