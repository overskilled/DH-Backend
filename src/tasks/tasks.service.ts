// tasks.service.ts - VERSION DÉFINITIVE
import { BadRequestException, Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // Mapping simplifié et efficace
private mapStatus(status: string): TaskStatus {
    console.log('Mapping status:', status);
    
    const statusMap: Record<string, TaskStatus> = {
      // Valeurs frontend
      'todo': TaskStatus.PENDING,
      'in_progress': TaskStatus.IN_PROGRESS,
      'review': TaskStatus.IN_PROGRESS,
      'completed': TaskStatus.DONE,
      // Valeurs backend (au cas où)
      'PENDING': TaskStatus.PENDING,
      'IN_PROGRESS': TaskStatus.IN_PROGRESS,
      'DONE': TaskStatus.DONE,
      'CANCELLED': TaskStatus.CANCELLED,
    };

    const normalizedStatus = status.toLowerCase().trim();
    const mappedStatus = statusMap[normalizedStatus];
    
    if (!mappedStatus) {
      throw new BadRequestException(`Status invalide: ${status}. Valeurs autorisées: ${Object.keys(statusMap).join(', ')}`);
    }
    
    return mappedStatus;
  }
    
  
async create(createTaskDto: CreateTaskDto & { createdById: string }) {
  console.log('Création tâche avec données:', createTaskDto);
  
  try {
    // Vérifier que la liste existe
    const list = await this.prisma.list.findUnique({
      where: { id: createTaskDto.listId }
    });

    if (!list) {
      throw new BadRequestException('Liste non trouvée');
    }

    // Vérifier que l'assignee existe si fourni
    if (createTaskDto.assigneeId) {
      const user = await this.prisma.user.findUnique({
        where: { id: createTaskDto.assigneeId }
      });

      if (!user) {
        throw new BadRequestException('Utilisateur assigné non trouvé');
      }
    }

    const taskData: any = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      listId: createTaskDto.listId,
      status: this.mapStatus(createTaskDto.status || 'todo'),
      createdById: createTaskDto.createdById, // ✅ Ajout du créateur
    };

    // Ajouter les champs optionnels
    if (createTaskDto.assigneeId) {
      taskData.assigneeId = createTaskDto.assigneeId;
    }
    if (createTaskDto.maxTimeHours !== undefined && createTaskDto.maxTimeHours !== null) {
      taskData.maxTimeHours = createTaskDto.maxTimeHours;
    }
    if (createTaskDto.dueDate) {
      taskData.dueDate = new Date(createTaskDto.dueDate);
    }

    console.log('Données finales pour création:', taskData);

    const task = await this.prisma.task.create({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: { // ✅ Inclure les infos du créateur
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    console.log('✅ Tâche créée avec succès:', task);
    return task;
  } catch (error) {
    console.error('❌ Erreur création tâche:', error);
    throw error;
  }
}

async findOne(id: string) {
  return this.prisma.task.findUnique({
    where: { id },
    include: {
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      createdBy: { // ✅ Inclure les infos du créateur
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      timeEntries: {
        include: {
          collaborator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
}
//  async create(createTaskDto: CreateTaskDto) {
//     console.log('Création tâche avec données:', createTaskDto);
    
//     try {
//       // Vérifier que la liste existe
//       const list = await this.prisma.list.findUnique({
//         where: { id: createTaskDto.listId }
//       });

//       if (!list) {
//         throw new BadRequestException('Liste non trouvée');
//       }

//       // Vérifier que l'assignee existe si fourni
//       if (createTaskDto.assigneeId) {
//         const user = await this.prisma.user.findUnique({
//           where: { id: createTaskDto.assigneeId }
//         });

//         if (!user) {
//           throw new BadRequestException('Utilisateur assigné non trouvé');
//         }
//       }

//       const taskData: any = {
//         title: createTaskDto.title,
//         description: createTaskDto.description,
//         listId: createTaskDto.listId,
//         status: this.mapStatus(createTaskDto.status || 'todo'),
//       };

//       // Ajouter les champs optionnels
//       if (createTaskDto.assigneeId) {
//         taskData.assigneeId = createTaskDto.assigneeId;
//       }
//       if (createTaskDto.maxTimeHours !== undefined && createTaskDto.maxTimeHours !== null) {
//         taskData.maxTimeHours = createTaskDto.maxTimeHours;
//       }
//       if (createTaskDto.dueDate) {
//         taskData.dueDate = new Date(createTaskDto.dueDate);
//       }

//       console.log('Données finales pour création:', taskData);

//       const task = await this.prisma.task.create({
//         data: taskData,
//         include: {
//           assignee: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               email: true,
//             },
//           },
//         },
//       });
      
//       console.log('✅ Tâche créée avec succès:', task);
//       return task;
//     } catch (error) {
//       console.error('❌ Erreur création tâche:', error);
//       throw error;
//     }
//   }


  async findAll(filters: { status?: string; assigneeId?: string; listId?: string }) {
    const where: any = {};

    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.listId) where.listId = filters.listId;
    if (filters.status) where.status = this.mapStatus(filters.status);

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTasksByList(listId: string, filters: any) {
    const where: any = { listId };

    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.status) where.status = this.mapStatus(filters.status);

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // async findOne(id: string) {
  //   return this.prisma.task.findUnique({
  //     where: { id },
  //     include: {
  //       assignee: {
  //         select: {
  //           id: true,
  //           firstName: true,
  //           lastName: true,
  //           email: true,
  //         },
  //       },
  //       timeEntries: {
  //         include: {
  //           collaborator: {
  //             select: {
  //               id: true,
  //               firstName: true,
  //               lastName: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }

async update(id: string, updateTaskDto: UpdateTaskDto) {
    const updateData: any = {};

    if (updateTaskDto.title !== undefined) updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) updateData.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined) updateData.status = this.mapStatus(updateTaskDto.status);
    if (updateTaskDto.assigneeId !== undefined) updateData.assigneeId = updateTaskDto.assigneeId;
    if (updateTaskDto.maxTimeHours !== undefined) updateData.maxTimeHours = updateTaskDto.maxTimeHours;
    if (updateTaskDto.dueDate !== undefined) {
      updateData.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}