import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('clients')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({
    status: 201,
    description: 'Client successfully created',
  })
  @ApiResponse({
    status: 409,
    description: 'Client with this email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of clients',
  })
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.clientsService.findAll(paginationDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search clients by name, email, company, or phone' })
  @ApiQuery({ name: 'search', required: true, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated search results',
  })
  search(
    @Query('search') search: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.clientsService.search(search, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns client details with counts and recent activity',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get comprehensive statistics for a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns client statistics including documents, invoices, and financial data',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.getClientStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 200,
    description: 'Client successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Client with this email already exists',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 200,
    description: 'Client successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete client with associated documents or invoices',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(id);
  }
}