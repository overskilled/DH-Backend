// // time-entry.service.ts - BACKEND
// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from 'prisma/prisma.service';
// import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
// import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

// @Injectable()
// export class TimeEntryService {
//   constructor(private prisma: PrismaService) {}

//   async create(createTimeEntryDto: CreateTimeEntryDto,userId:string) {
//     // Vérifier que la tâche existe
//     const task = await this.prisma.task.findUnique({
//       where: { id: createTimeEntryDto.taskId }
//     });

//     if (!task) {
//       throw new NotFoundException(`Task with ID ${createTimeEntryDto.taskId} not found`);
//     }
//     const collaboratorId = 'user-id-from-auth';

//     return this.prisma.timeEntry.create({
//       data: {
//         taskId: createTimeEntryDto.taskId,
//         hoursSpent: createTimeEntryDto.hoursSpent,
//         description: createTimeEntryDto.description,
//         date: createTimeEntryDto.date ? new Date(createTimeEntryDto.date) : new Date(),
//          collaboratorId: userId,      },
//       include: {
//         task: {
//           select: {
//             id: true,
//             title: true,
//             list: {
//               select: {
//                 id: true,
//                 name: true,
//                 document: {
//                   select: {
//                     id: true,
//                     title: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//         collaborator: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//           },
//         },
//       },
//     });
//   }

//   async findAll(pagination?: { page?: number; limit?: number }) {
//     const page = pagination?.page || 1;
//     const limit = pagination?.limit || 10;
//     const skip = (page - 1) * limit;

//     const [timeEntries, total] = await Promise.all([
//       this.prisma.timeEntry.findMany({
//         skip,
//         take: limit,
//         include: {
//           task: {
//             select: {
//               id: true,
//               title: true,
//             },
//           },
//           collaborator: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//             },
//           },
//         },
//         orderBy: { date: 'desc' },
//       }),
//       this.prisma.timeEntry.count(),
//     ]);

//     return {
//       data: timeEntries,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   // async findByTask(taskId: string, pagination?: { page?: number; limit?: number }) {
//   //   const page = pagination?.page || 1;
//   //   const limit = pagination?.limit || 10;
//   //   const skip = (page - 1) * limit;

//   //   const [timeEntries, total] = await Promise.all([
//   //     this.prisma.timeEntry.findMany({
//   //       where: { taskId },
//   //       skip,
//   //       take: limit,
//   //       include: {
//   //         collaborator: {
//   //           select: {
//   //             id: true,
//   //             firstName: true,
//   //             lastName: true,
//   //           },
//   //         },
//   //       },
//   //       orderBy: { date: 'desc' },
//   //     }),
//   //     this.prisma.timeEntry.count({ where: { taskId } }),
//   //   ]);

//   //   return {
//   //     data: timeEntries,
//   //     pagination: {
//   //       page,
//   //       limit,
//   //       total,
//   //       totalPages: Math.ceil(total / limit),
//   //     },
//   //   };
//   // }
//   async findByTask(taskId: string) {
//     return this.prisma.timeEntry.findMany({
//       where: { taskId },
//       include: {
//         collaborator: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//       orderBy: { date: 'desc' },
//     });
//   }

//   async findByUser(userId: string, pagination?: { page?: number; limit?: number }) {
//     const page = pagination?.page || 1;
//     const limit = pagination?.limit || 10;
//     const skip = (page - 1) * limit;

//     const [timeEntries, total] = await Promise.all([
//       this.prisma.timeEntry.findMany({
//         where: { collaboratorId: userId },
//         skip,
//         take: limit,
//         include: {
//           task: {
//             select: {
//               id: true,
//               title: true,
//               list: {
//                 select: {
//                   id: true,
//                   name: true,
//                   document: {
//                     select: {
//                       id: true,
//                       title: true,
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//         orderBy: { date: 'desc' },
//       }),
//       this.prisma.timeEntry.count({ where: { collaboratorId: userId } }),
//     ]);

//     return {
//       data: timeEntries,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   async findOne(id: string) {
//     const timeEntry = await this.prisma.timeEntry.findUnique({
//       where: { id },
//       include: {
//         task: {
//           select: {
//             id: true,
//             title: true,
//           },
//         },
//         collaborator: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//     });

//     if (!timeEntry) {
//       throw new NotFoundException(`Time entry with ID ${id} not found`);
//     }

//     return timeEntry;
//   }

//   // async update(id: string, updateTimeEntryDto: UpdateTimeEntryDto) {
//   //   // Vérifier que le time entry existe
//   //   const existingEntry = await this.prisma.timeEntry.findUnique({
//   //     where: { id }
//   //   });

//   //   if (!existingEntry) {
//   //     throw new NotFoundException(`Time entry with ID ${id} not found`);
//   //   }

//   //   return this.prisma.timeEntry.update({
//   //     where: { id },
//   //     data: {
//   //       hoursSpent: updateTimeEntryDto.hoursSpent,
//   //       description: updateTimeEntryDto.description,
//   //       date: updateTimeEntryDto.date ? new Date(updateTimeEntryDto.date) : undefined,
//   //     },
//   //     include: {
//   //       task: {
//   //         select: {
//   //           id: true,
//   //           title: true,
//   //         },
//   //       },
//   //       collaborator: {
//   //         select: {
//   //           id: true,
//   //           firstName: true,
//   //           lastName: true,
//   //         },
//   //       },
//   //     },
//   //   });
//   // }

//     async update(id: string, updateTimeEntryDto: UpdateTimeEntryDto) {
//     return this.prisma.timeEntry.update({
//       where: { id },
//       data: updateTimeEntryDto,
//     });
//   }

//   async remove(id: string) {
//     // Vérifier que le time entry existe
//     // const existingEntry = await this.prisma.timeEntry.findUnique({
//     //   where: { id }
//     // });

//     // if (!existingEntry) {
//     //   throw new NotFoundException(`Time entry with ID ${id} not found`);
//     // }

//     return this.prisma.timeEntry.delete({
//       where: { id },
//     });
//   }

//   async getTimeSummary(userId: string, startDate?: Date, endDate?: Date) {
//     const where: any = { collaboratorId: userId };
    
//     if (startDate || endDate) {
//       where.date = {};
//       if (startDate) where.date.gte = startDate;
//       if (endDate) where.date.lte = endDate;
//     }

//     const result = await this.prisma.timeEntry.aggregate({
//       where,
//       _sum: {
//         hoursSpent: true,
//       },
//       _count: {
//         id: true,
//       },
//     });

//     return {
//       totalHours: result._sum.hoursSpent || 0,
//       totalEntries: result._count.id || 0,
//     };
//   }
// }
// time-entry.service.ts - VERSION CORRIGÉE
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Injectable()
export class TimeEntryService {
  constructor(private prisma: PrismaService) {}

  async create(createTimeEntryDto: CreateTimeEntryDto, userId: string) {
    console.log('Creating time entry with data:', createTimeEntryDto);
    console.log('User ID:', userId);

    // Vérifier que la tâche existe
    const task = await this.prisma.task.findUnique({
      where: { id: createTimeEntryDto.taskId }
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${createTimeEntryDto.taskId} not found`);
    }

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      const timeEntry = await this.prisma.timeEntry.create({
        data: {
          taskId: createTimeEntryDto.taskId,
          collaboratorId: userId, // Utiliser l'ID de l'utilisateur connecté
          hoursSpent: createTimeEntryDto.hoursSpent,
          description: createTimeEntryDto.description,
          date: createTimeEntryDto.date ? new Date(createTimeEntryDto.date) : new Date(),
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          collaborator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      console.log('✅ Time entry created successfully:', timeEntry);
      return timeEntry;
    } catch (error) {
      console.error('❌ Error creating time entry:', error);
      throw error;
    }
  }

  async findByTask(taskId: string) {
    return this.prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        collaborator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: string, updateTimeEntryDto: UpdateTimeEntryDto) {
    return this.prisma.timeEntry.update({
      where: { id },
      data: updateTimeEntryDto,
    });
  }

  async remove(id: string) {
    return this.prisma.timeEntry.delete({
      where: { id },
    });
  }
  // time-entry.service.ts - Ajoutez cette méthode
async findByDocument(documentId: string, filters?: { 
  onlyUninvoiced?: boolean, 
  startDate?: string, 
  endDate?: string 
}) {
  const where: any = {
    task: {
      list: {
        documentId: documentId
      }
    }
  };

  // Filtrer par facturation
  if (filters?.onlyUninvoiced) {
    where.invoiceId = null;
  }

  // Filtrer par dates
  if (filters?.startDate && filters?.endDate) {
    where.date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    };
  } else if (filters?.startDate) {
    where.date = {
      gte: new Date(filters.startDate)
    };
  } else if (filters?.endDate) {
    where.date = {
      lte: new Date(filters.endDate)
    };
  }

  const timeEntries = await this.prisma.timeEntry.findMany({
    where,
    include: {
      collaborator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          pricingPerHour: true
        }
      },
      task: {
        include: {
          list: {
            select: {
              name: true,
              document: {
                select: {
                  id: true,
                  reference: true
                }
              }
            }
          }
        }
      },
      invoice: {
        select: {
          id: true,
          reference: true
        }
      }
    },
    orderBy: { date: 'desc' }
  });

  // Transformer les données pour inclure le statut de facturation
  return timeEntries.map(entry => ({
    ...entry,
    invoiced: !!entry.invoiceId,
    invoice: entry.invoice
  }));
}
}