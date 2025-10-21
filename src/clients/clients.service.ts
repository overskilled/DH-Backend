import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) { }

  async create(createClientDto: CreateClientDto) {
    try {
      // Check if client with email already exists
      const existingClient = await this.prisma.client.findUnique({
        where: { email: createClientDto.email }
      });

      if (existingClient) {
        throw new ConflictException('Client with this email already exists');
      }

      const client = await this.prisma.client.create({
        data: createClientDto,
      });

      return client;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Client with this email already exists');
      }
      throw error;
    }
  }

  async findAll(paginationDto?: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              documents: true,
              invoices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count(),
    ]);

    return {
      data: clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            documents: true,
            invoices: true,
          },
        },
        documents: {
          include: {
            department: true,
            responsable: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Limit recent documents
        },
        invoices: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                reference: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Limit recent invoices
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      // Check if client exists
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundException('Client not found');
      }

      // If email is being updated, check for uniqueness
      if (updateClientDto.email && updateClientDto.email !== existingClient.email) {
        const clientWithEmail = await this.prisma.client.findUnique({
          where: { email: updateClientDto.email },
        });

        if (clientWithEmail) {
          throw new ConflictException('Client with this email already exists');
        }
      }

      const client = await this.prisma.client.update({
        where: { id },
        data: updateClientDto,
        include: {
          _count: {
            select: {
              documents: true,
              invoices: true,
            },
          },
        },
      });

      return client;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Client not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Client with this email already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Check if client has related documents or invoices
      const client = await this.prisma.client.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              documents: true,
              invoices: true,
            },
          },
        },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      if (client._count.documents > 0 || client._count.invoices > 0) {
        throw new BadRequestException(
          'Cannot delete client with associated documents or invoices. Please reassign or delete related records first.',
        );
      }

      await this.prisma.client.delete({
        where: { id },
      });

      return { message: 'Client deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Client not found');
      }
      throw error;
    }
  }

  async search(search: string, paginationDto?: PaginationDto) {
    const page = Number(paginationDto?.page) || 1;
    const limit = Number(paginationDto?.limit) || 10;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ClientWhereInput = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    };

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              documents: true,
              invoices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getClientStats(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        documents: {
          include: {
            lists: {
              include: {
                tasks: {
                  include: {
                    timeEntries: true,
                  },
                },
              },
            },
            invoices: true,
          },
        },
        invoices: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Calculate statistics
    const totalDocuments = client.documents.length;
    const activeDocuments = client.documents.filter(doc => doc.status === 'ACTIVE').length;
    const totalInvoices = client.invoices.length;
    const paidInvoices = client.invoices.filter(inv => inv.paid).length;
    const totalInvoiced = client.invoices.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);

    // Calculate total hours from all documents
    const totalHours = client.documents.flatMap(doc =>
      doc.lists.flatMap(list =>
        list.tasks.flatMap(task =>
          task.timeEntries.map(entry => parseFloat(entry.hoursSpent.toString()))
        )
      )
    ).reduce((sum, hours) => sum + hours, 0);

    return {
      stat1: { title: 'Total Documents', count: totalDocuments },
      stat2: { title: 'Active Documents', count: activeDocuments },
      stat3: { title: 'Total Invoices', count: totalInvoices },
      stat4: { title: 'Paid Invoices', count: paidInvoices },
      stat5: { title: 'Total Invoiced', count: Math.round(totalInvoiced) },
      stat6: { title: 'Total Hours', count: Math.round(totalHours) },
      detailedStats: {
        documentStatus: {
          active: activeDocuments,
          archived: client.documents.filter(doc => doc.status === 'ARCHIVED').length,
          closed: client.documents.filter(doc => doc.status === 'CLOSED').length,
        },
        financials: {
          totalInvoiced,
          outstanding: totalInvoiced - client.invoices
            .filter(inv => inv.paid)
            .reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0),
        },
      },
    };
  }
}