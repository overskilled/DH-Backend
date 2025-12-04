import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateListDto } from '../lists/dto/create-list.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
import { CreateTimeEntryDto } from '../time-entry/dto/create-time-entry.dto';
import { PrismaService } from 'prisma/prisma.service';
import { DocumentStatus, ListStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) { }

  // NEW: Get documents with client and referent information (for dossier page)
  async findAllDocuments(user: any, paginationDto: any, filters?: { status?: string; departmentId?: string }) {

    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;

    const skip = (page - 1) * limit;
    const take = limit;


    const where: any = {};

    // Apply filters
    if (filters?.status) where.status = filters.status;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    // Role-based access control
    if (!['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role)) {
      where.departmentId = user.departmentId;
    }

    const documents = await this.prisma.document.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: true,
        referent: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        department: true,
        responsable: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        lists: {
          include: {
            tasks: {
              include: {
                timeEntries: true
              }
            }
          }
        },
        invoices: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate spent amount from time entries and invoices
    const documentsWithSpent = documents.map(doc => {
      const totalHours = doc.lists.flatMap(list =>
        list.tasks.flatMap(task =>
          task.timeEntries.map(entry => parseFloat(entry.hoursSpent.toString()))
        )
      ).reduce((sum, hours) => sum + hours, 0);

      const totalInvoiced = doc.invoices.reduce((sum, invoice) =>
        sum + parseFloat(invoice.amount.toString()), 0
      );

      return {
        ...doc,
        spent: totalInvoiced, // or calculate based on your business logic
        progress: doc.budgetAmount ? (totalInvoiced / parseFloat(doc.budgetAmount.toString())) * 100 : 0
      };
    });

    const total = await this.prisma.document.count({ where });

    return {
      data: documentsWithSpent,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // NEW: Search documents with comprehensive search
  async searchDocuments(user: any, search: string, paginationDto: any, filters?: { status?: string; departmentId?: string }) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        {
          client: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          responsable: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ]
    };

    // Apply filters
    if (filters?.status) where.status = filters.status;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    // Role-based access control
    if (!['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role)) {
      where.departmentId = user.departmentId;
    }

    const documents = await this.prisma.document.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: true,
        referent: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        department: true,
        lists: {
          include: {
            tasks: {
              include: {
                timeEntries: true
              }
            }
          }
        },
        invoices: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await this.prisma.document.count({ where });

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // NEW: Update create method to include tags and referent
  async createDocument(userId: string, createDocumentDto: CreateDocumentDto) {
    const { tags, referentId, ...documentData } = createDocumentDto;

    return this.prisma.document.create({
      data: {
        ...documentData,
        tags: tags || [],
        referentId,
        creatorId: userId,
      },
      include: {
        client: true,
        referent: true,
        department: true,
      }
    });
  }

  // NEW: Update method to handle tags and referent
  async updateDocument(user: any, id: string, updateDocumentDto: UpdateDocumentDto) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { creator: true, responsable: true }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Authorization check
    if (!this.canModifyDocument(user, document)) {
      throw new ForbiddenException('You do not have permission to update this document');
    }

    const { tags, ...updateData } = updateDocumentDto;

    return this.prisma.document.update({
      where: { id },
      data: {
        ...updateData,
        ...(tags !== undefined && { tags }),
        referentId: updateData.referentId || "",
        status: updateData.status as DocumentStatus
      },
      include: {
        client: true,
        referent: true,
        department: true,
      }
    });
  }

  // NEW: Get document by ID with all relations for dossier detail page
  async findDocumentById(user: any, id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        client: true,
        referent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          }
        },
        department: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        responsable: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        lists: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                },
                timeEntries: {
                  include: {
                    collaborator: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      }
                    }
                  }
                }
              }
            }
          }
        },
        invoices: true,
        files: true,
        reports: true
      }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Authorization check
    if (!['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role) && document.departmentId !== user.departmentId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // Calculate spent amount and progress
    const totalInvoiced = document.invoices.reduce((sum, invoice) =>
      sum + parseFloat(invoice.amount.toString()), 0
    );

    const totalHours = document.lists.flatMap(list =>
      list.tasks.flatMap(task =>
        task.timeEntries.map(entry => parseFloat(entry.hoursSpent.toString()))
      )
    ).reduce((sum, hours) => sum + hours, 0);

    return {
      ...document,
      spent: totalInvoiced,
      progress: document.budgetAmount ? (totalInvoiced / parseFloat(document.budgetAmount.toString())) * 100 : 0,
      totalHours
    };
  }


  // ========== LIST MANAGEMENT ENDPOINTS ==========

  async findListsByDocument(user: any, documentId: string, paginationDto: any) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // First verify document exists and user has access
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { department: true }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Authorization check
    if (!['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role) && document.departmentId !== user.departmentId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const lists = await this.prisma.list.findMany({
      where: { documentId },
      skip,
      take: limit,
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            timeEntries: {
              include: {
                collaborator: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await this.prisma.list.count({ where: { documentId } });

    return {
      data: lists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createList(user: any, createListDto: CreateListDto) {
    const { documentId, ...listData } = createListDto;

    // Verify document exists and user has permission
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { creator: true, responsable: true }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!this.canModifyDocument(user, document)) {
      throw new ForbiddenException('You do not have permission to create lists in this document');
    }

    return this.prisma.list.create({
      data: {
        ...listData,
        documentId,
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });
  }

  async updateListStatus(user: any, listId: string, status: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: {
        document: {
          include: { creator: true, responsable: true }
        }
      }
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (!this.canModifyDocument(user, list.document)) {
      throw new ForbiddenException('You do not have permission to update this list');
    }

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid list status');
    }

    return this.prisma.list.update({
      where: { id: listId },
      data: { status: status as ListStatus },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });
  }

  // ========== TASK MANAGEMENT ENDPOINTS ==========

  async findTasksByList(user: any, listId: string, paginationDto: any, filters?: { status?: string; assigneeId?: string }) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // First verify list and document exist with user access
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: {
        document: {
          include: { department: true }
        }
      }
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Authorization check
    if (!['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role) && list.document.departmentId !== user.departmentId) {
      throw new ForbiddenException('You do not have access to these tasks');
    }

    const where: any = { listId };

    // Apply filters
    if (filters?.status) where.status = filters.status;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

    const tasks = await this.prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true
          }
        },
        timeEntries: {
          include: {
            collaborator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            },
            invoice: true
          }
        },
        list: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                reference: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await this.prisma.task.count({ where });

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createTask(user: any, createTaskDto: CreateTaskDto) {
    const { listId, ...taskData } = createTaskDto;

    // Verify list and document exist with user permission
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: {
        document: {
          include: { creator: true, responsable: true }
        }
      }
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (!this.canModifyDocument(user, list.document)) {
      throw new ForbiddenException('You do not have permission to create tasks in this document');
    }

    // If assignee is specified, verify they exist
    if (taskData.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: taskData.assigneeId }
      });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    return this.prisma.task.create({
      data: {
        ...taskData,
        listId,
        status: taskData.status as TaskStatus,
        createdById: user.id
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true
          }
        },
        list: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                reference: true
              }
            }
          }
        }
      }
    });
  }

  async updateTask(user: any, taskId: string, updateTaskDto: Partial<CreateTaskDto>) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            document: {
              include: { creator: true, responsable: true }
            }
          }
        },
        assignee: true
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Authorization: User can update if they are admin/associate/board, document responsible, or task assignee
    const canUpdate =
      ['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role) ||
      task.list.document.responsableId === user.id ||
      task.assigneeId === user.id;

    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    // If changing assignee, verify new assignee exists
    if (updateTaskDto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: updateTaskDto.assigneeId }
      });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { ...updateTaskDto, listId: updateTaskDto.listId || '', status: updateTaskDto.status as TaskStatus },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true
          }
        },
        list: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                reference: true
              }
            }
          }
        },
        timeEntries: {
          include: {
            collaborator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });
  }

  async assignTask(user: any, taskId: string, assigneeId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            document: {
              include: { creator: true, responsable: true }
            }
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!this.canModifyDocument(user, task.list.document)) {
      throw new ForbiddenException('You do not have permission to assign tasks in this document');
    }

    // Verify assignee exists
    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId }
    });
    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true
          }
        },
        list: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                reference: true
              }
            }
          }
        }
      }
    });
  }

  // ========== TIME ENTRY ENDPOINTS ==========

  async findTimeEntriesByTask(user: any, taskId: string, paginationDto: any) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Verify task and document exist with user access
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            document: {
              include: { department: true }
            }
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Authorization check
    if (!['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role) && task.list.document.departmentId !== user.departmentId) {
      throw new ForbiddenException('You do not have access to these time entries');
    }

    const timeEntries = await this.prisma.timeEntry.findMany({
      where: { taskId },
      skip,
      take: limit,
      include: {
        collaborator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        task: {
          include: {
            list: {
              include: {
                document: {
                  select: {
                    id: true,
                    title: true,
                    reference: true
                  }
                }
              }
            }
          }
        },
        invoice: true
      },
      orderBy: { date: 'desc' }
    });

    const total = await this.prisma.timeEntry.count({ where: { taskId } });

    return {
      data: timeEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createTimeEntry(user: any, createTimeEntryDto: CreateTimeEntryDto) {
    const { taskId, ...timeEntryData } = createTimeEntryDto;

    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            document: {
              include: { creator: true, responsable: true, department: true }
            }
          }
        },
        assignee: true
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Authorization: User can create time entry if they are:
    // - Admin/Associate/Board
    // - Document responsible
    // - Task assignee
    // - In the same department as the document
    const canCreateTimeEntry =
      ['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role) ||
      task.list.document.responsableId === user.id ||
      task.assigneeId === user.id ||
      task.list.document.departmentId === user.departmentId;

    if (!canCreateTimeEntry) {
      throw new ForbiddenException('You do not have permission to create time entries for this task');
    }

    return this.prisma.timeEntry.create({
      data: {
        ...timeEntryData,
        taskId,
        collaboratorId: user.id, // The user creating the time entry is the collaborator
      },
      include: {
        collaborator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        task: {
          include: {
            list: {
              include: {
                document: {
                  select: {
                    id: true,
                    title: true,
                    reference: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  // ========== USER-SPECIFIC ENDPOINTS ==========

  async getMyTasks(user: any, paginationDto: any, status?: string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { assigneeId: user.id },
        { requestedAssignees: { has: user.id } }
      ]
    };

    if (status) where.status = status;

    const tasks = await this.prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        timeEntries: {
          where: { collaboratorId: user.id },
          include: {
            invoice: true
          }
        },
        list: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await this.prisma.task.count({ where });

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getDepartmentTasks(user: any, paginationDto: any, departmentId?: string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Authorization: Only board, associates, or department managers can access
    if (!['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role) && !user.managedDepartments?.length) {
      throw new ForbiddenException('You do not have permission to view department tasks');
    }

    const targetDepartmentId = departmentId || user.departmentId;

    const where: any = {
      list: {
        document: {
          departmentId: targetDepartmentId
        }
      }
    };

    const tasks = await this.prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true
          }
        },
        timeEntries: {
          include: {
            collaborator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        list: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await this.prisma.task.count({ where });

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ========== HELPER METHODS ==========

  private canModifyDocument(user: any, document: any): boolean {
    if (['ADMIN', 'ASSOCIATE', 'BOARD'].includes(user.role)) {
      return true;
    }
    if (document.creatorId === user.id || document.responsableId === user.id) {
      return true;
    }
    if (document.departmentId === user.departmentId && ['SENIOR', 'MID'].includes(user.role)) {
      return true;
    }
    return false;
  }
}