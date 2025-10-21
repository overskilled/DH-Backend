import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DepartementsService {
  constructor(private prisma: PrismaService) { }

  // async create(createDepartementDto: CreateDepartementDto) {
  //   try {
  //     const department = await this.prisma.department.create({
  //       data: createDepartementDto
  //     });
  //     return department;
  //   } catch (error) {
  //     if (error.code === 'P2002') {
  //       throw new BadRequestException('Department name already exists');
  //     }
  //     throw error;
  //   }
  // }

  async findAll() {
    const departments = await this.prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            managers: true
          }
        }
      }
    });
    return departments;
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            managers: true
          }
        }
      }
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async findByName(name: string) {
    const department = await this.prisma.department.findUnique({
      where: { name },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            managers: true
          }
        }
      }
    });

    if (!department) {
      throw new NotFoundException(`Department with name '${name}' not found`);
    }

    return department;
  }

  async update(id: string, updateDepartementDto: UpdateDepartementDto) {
    try {
      const department = await this.prisma.department.update({
        where: { id },
        data: updateDepartementDto
      });
      return department;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Department not found');
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Department name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.department.delete({
        where: { id }
      });
      return { message: 'Department deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Department not found');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete department with associated users or documents');
      }
      throw error;
    }
  }

  async getDepartmentStats(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            timeEntries: true,
            assignedTasks: true
          }
        },
        documents: {
          include: {
            lists: {
              include: {
                tasks: true
              }
            },
            invoices: true,
            files: true
          }
        },
        managers: true
      }
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Calculate comprehensive statistics
    const totalUsers = department.users.length;
    const totalManagers = department.managers.length;
    const totalDocuments = department.documents.length;
    
    // Document status statistics
    const activeDocuments = department.documents.filter(doc => doc.status === 'ACTIVE').length;
    const archivedDocuments = department.documents.filter(doc => doc.status === 'ARCHIVED').length;
    const closedDocuments = department.documents.filter(doc => doc.status === 'CLOSED').length;
    
    // Task statistics
    const allTasks = department.documents.flatMap(doc => 
      doc.lists.flatMap(list => list.tasks)
    );
    const totalTasks = allTasks.length;
    const pendingTasks = allTasks.filter(task => task.status === 'PENDING').length;
    const inProgressTasks = allTasks.filter(task => task.status === 'IN_PROGRESS').length;
    const doneTasks = allTasks.filter(task => task.status === 'DONE').length;
    
    // Time tracking statistics
    const allTimeEntries = department.users.flatMap(user => user.timeEntries);
    const totalHoursSpent = allTimeEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.hoursSpent.toString()), 0
    );
    const averageHoursPerUser = totalUsers > 0 ? totalHoursSpent / totalUsers : 0;
    
    // Financial statistics
    const totalBudget = department.documents.reduce((sum, doc) => 
      sum + (doc.budgetAmount ? parseFloat(doc.budgetAmount.toString()) : 0), 0
    );
    const totalInvoiced = department.documents.flatMap(doc => doc.invoices)
      .reduce((sum, invoice) => sum + parseFloat(invoice.amount.toString()), 0);
    
    // File statistics
    const totalFiles = department.documents.reduce((sum, doc) => 
      sum + doc.files.length, 0
    );

    return {
      stat1: { title: 'Total Team Members', count: totalUsers },
      stat2: { title: 'Department Managers', count: totalManagers },
      stat3: { title: 'Total Projects', count: totalDocuments },
      stat4: { title: 'Active Projects', count: activeDocuments },
      stat5: { title: 'Completed Tasks', count: doneTasks },
      stat6: { title: 'Pending Tasks', count: pendingTasks },
      stat7: { title: 'Total Hours Logged', count: Math.round(totalHoursSpent) },
      stat8: { title: 'Average Hours per Member', count: Math.round(averageHoursPerUser * 10) / 10 },
      stat9: { title: 'Total Project Budget', count: Math.round(totalBudget) },
      stat10: { title: 'Total Invoiced', count: Math.round(totalInvoiced) },
      stat11: { title: 'Files Uploaded', count: totalFiles },
      stat12: { title: 'Tasks in Progress', count: inProgressTasks },
      detailedStats: {
        documentStatus: {
          active: activeDocuments,
          archived: archivedDocuments,
          closed: closedDocuments
        },
        taskStatus: {
          pending: pendingTasks,
          inProgress: inProgressTasks,
          done: doneTasks
        },
        financials: {
          totalBudget,
          totalInvoiced,
          utilizationRate: totalBudget > 0 ? (totalInvoiced / totalBudget) * 100 : 0
        }
      }
    };
  }

  

  async getDepartmentDocuments(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        documents: {
          include: {
            lists: {
              include: {
                tasks: {
                  include: {
                    timeEntries: true
                  }
                }
              }
            },
            invoices: true,
            client: true,
            responsable: true
          }
        }
      }
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department.documents;
  }
}