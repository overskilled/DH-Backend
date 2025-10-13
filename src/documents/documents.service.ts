import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { CreateTimeEntryDto } from 'src/time-entry/dto/create-time-entry.dto';
import { CreateListDto } from 'src/lists/dto/create-list.dto';
import { DocumentStatus, ListStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) { }

  private hasDocumentAccess(user: any, document: any, requiredRole: 'view' | 'edit' | 'manage' = 'view') {
    // Board members have full access
    if (user.role === 'BOARD') return true;

    // Associates have full access to documents
    if (user.role === 'ASSOCIATE') return true;

    // Document creator and responsable have full access
    if (document.creatorId === user.id || document.responsableId === user.id) {
      return true;
    }

    // Department members can view documents in their department
    if (requiredRole === 'view' && document.departmentId === user.departmentId) {
      return true;
    }

    return false;
  }

  private canManageTasks(user: any, task?: any) {
    if (user.role === 'BOARD' || user.role === 'ASSOCIATE') return true;

    // Task assignee can manage their own tasks
    if (task && task.assigneeId === user.id) return true;

    // Document responsable can manage tasks in their documents
    if (task && task.list.document.responsableId === user.id) return true;

    return false;
  }

  async createDocument(userId: string, createDocumentDto: CreateDocumentDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Only Board and Associates can create documents
    if (user?.role !== 'BOARD' && user?.role !== 'ASSOCIATE') {
      throw new ForbiddenException('Insufficient permissions to create documents');
    }

    return this.prisma.document.create({
      data: {
        ...createDocumentDto,
        creatorId: userId,
        status: 'ACTIVE',
      },
      include: {
        creator: true,
        responsable: true,
        client: true,
        department: true,
        referent: true,
      },
    });
  }

  async findAllDocuments(user: any, filters?: { status?: string; departmentId?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    // If user is not Board or Associate, restrict to accessible documents
    if (user.role !== 'BOARD' && user.role !== 'ASSOCIATE') {
      where.OR = [
        { creatorId: user.id },
        { responsableId: user.id },
        { departmentId: user.departmentId },
      ];
    }

    return this.prisma.document.findMany({
      where,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        responsable: { select: { id: true, firstName: true, lastName: true, email: true } },
        client: { select: { id: true, name: true, companyName: true } },
        department: { select: { id: true, name: true, colorHex: true } },
        lists: { include: { tasks: true } },
        _count: {
          select: {
            lists: true,
            files: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDocumentById(user: any, id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        creator: true,
        responsable: true,
        client: true,
        department: true,
        referent: true,
        lists: {
          include: {
            tasks: {
              include: {
                assignee: true,
                timeEntries: true,
              },
            },
          },
        },
        files: true,
        invoices: true,
        reports: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasDocumentAccess(user, document, 'view')) {
      throw new ForbiddenException('Access denied to this document');
    }

    return document;
  }

  async updateDocument(user: any, id: string, updateDocumentDto: UpdateDocumentDto) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasDocumentAccess(user, document, 'manage')) {
      throw new ForbiddenException('Insufficient permissions to update this document');
    }

    // Create audit log for status changes
    if (updateDocumentDto.status && updateDocumentDto.status !== document.status) {
      await this.createAuditLog(document.id, user.id, 'STATUS_CHANGE',
        `Status changed from ${document.status} to ${updateDocumentDto.status}`);
    }

    return this.prisma.document.update({
      where: { id },
      data: { ...updateDocumentDto, responsableId: updateDocumentDto.responsableId as string, status: updateDocumentDto.status as DocumentStatus },
      include: {
        creator: true,
        responsable: true,
        client: true,
        department: true,
        lists: {
          include: {
            tasks: {
              include: {
                assignee: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteDocument(user: any, id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Only Board and Associates can delete documents
    if (user.role !== 'BOARD' && user.role !== 'ASSOCIATE') {
      throw new ForbiddenException('Insufficient permissions to delete documents');
    }

    return this.prisma.document.delete({
      where: { id },
    });
  }

  // List Management
  async createList(user: any, createListDto: CreateListDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: createListDto.documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasDocumentAccess(user, document, 'manage')) {
      throw new ForbiddenException('Insufficient permissions to create lists in this document');
    }

    const list = await this.prisma.list.create({
      data: {
        ...createListDto,
        status: 'OPEN',
      },
      include: {
        document: true,
        tasks: true,
      },
    });

    await this.createAuditLog(document.id, user.id, 'LIST_CREATED',
      `List "${list.name}" created`);

    return list;
  }

  async updateListStatus(user: any, listId: string, status: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: { document: true },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (!this.hasDocumentAccess(user, list.document, 'manage')) {
      throw new ForbiddenException('Insufficient permissions to update this list');
    }

    return this.prisma.list.update({
      where: { id: listId },
      data: { status: status as ListStatus },
      include: {
        tasks: {
          include: {
            assignee: true,
            timeEntries: true,
          },
        },
      },
    });
  }

  // Task Management
  async createTask(user: any, createTaskDto: CreateTaskDto) {
    const list = await this.prisma.list.findUnique({
      where: { id: createTaskDto.listId },
      include: { document: true },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (!this.hasDocumentAccess(user, list.document, 'manage')) {
      throw new ForbiddenException('Insufficient permissions to create tasks in this document');
    }

    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        status: 'PENDING',
      },
      include: {
        list: {
          include: {
            document: true,
          },
        },
        assignee: true,
        timeEntries: true,
      },
    });

    await this.createAuditLog(list.document.id, user.id, 'TASK_CREATED',
      `Task "${task.title}" created in list "${list.name}"`);

    return task;
  }

  async updateTask(user: any, taskId: string, updateTaskDto: CreateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!this.canManageTasks(user, task)) {
      throw new ForbiddenException('Insufficient permissions to update this task');
    }

    // Create audit log for status changes
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      await this.createAuditLog(task.list.document.id, user.id, 'TASK_STATUS_CHANGE',
        `Task "${task.title}" status changed from ${task.status} to ${updateTaskDto.status}`);
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { ...updateTaskDto, listId: updateTaskDto.listId as string, status: updateTaskDto.status as TaskStatus },
      include: {
        list: true,
        assignee: true,
        timeEntries: {
          include: {
            collaborator: true,
          },
        },
      },
    });
  }

  async assignTask(user: any, taskId: string, assigneeId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!this.hasDocumentAccess(user, task.list.document, 'manage')) {
      throw new ForbiddenException('Insufficient permissions to assign tasks in this document');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
      include: {
        assignee: true,
        list: true,
      },
    });

    await this.createAuditLog(task.list.document.id, user.id, 'TASK_ASSIGNED',
      `Task "${task.title}" assigned to ${assignee.firstName} ${assignee.lastName}`);

    return updatedTask;
  }

  // Time Entry Management
  async createTimeEntry(user: any, createTimeEntryDto: CreateTimeEntryDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: createTimeEntryDto.taskId },
      include: {
        list: {
          include: {
            document: true,
          },
        },
        assignee: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only task assignee, document responsable, or managers can add time entries
    const canAddTime =
      task.assigneeId === user.id ||
      task.list.document.responsableId === user.id ||
      user.role === 'BOARD' ||
      user.role === 'ASSOCIATE';

    if (!canAddTime) {
      throw new ForbiddenException('Insufficient permissions to add time entries to this task');
    }

    const timeEntry = await this.prisma.timeEntry.create({
      data: {
        ...createTimeEntryDto,
        collaboratorId: user.id,
        date: createTimeEntryDto.date || new Date(),
      },
      include: {
        task: true,
        collaborator: true,
      },
    });

    return timeEntry;
  }

  async getMyTasks(user: any, status?: string) {
    const where: any = {
      OR: [
        { assigneeId: user.id },
        { requestedAssignees: { has: user.id } },
      ],
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        list: {
          include: {
            document: {
              include: {
                client: true,
                department: true,
              },
            },
          },
        },
        assignee: true,
        timeEntries: {
          where: { collaboratorId: user.id },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDepartmentTasks(user: any, departmentId?: string) {
    // Only Board, Associates, or Department managers can view department tasks
    if (user.role !== 'BOARD' && user.role !== 'ASSOCIATE' && !user.managedDepartments?.length) {
      throw new ForbiddenException('Insufficient permissions to view department tasks');
    }

    const targetDepartmentId = departmentId || user.departmentId;

    return this.prisma.task.findMany({
      where: {
        list: {
          document: {
            departmentId: targetDepartmentId,
          },
        },
      },
      include: {
        list: {
          include: {
            document: {
              include: {
                client: true,
                department: true,
                responsable: true,
              },
            },
          },
        },
        assignee: true,
        timeEntries: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async createAuditLog(documentId: string, userId: string, action: string, message: string) {
    return this.prisma.auditLog.create({
      data: {
        documentId,
        action,
        message,
      },
    });
  }
}