import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { PrismaService } from 'prisma/prisma.service';
import { PdfService } from 'src/pdf/pdf.service';
import { Response } from 'express';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService, 
    private pdfService: PdfService
  ) {}

  /**
   * Génère automatiquement une facture à partir des entrées de temps
   */
  async generateInvoice(userId: string, generateInvoiceDto: GenerateInvoiceDto) {
    const { documentId, timeEntryIds, startDate, dueDate, onlyUninvoiced, customTaxRate } = generateInvoiceDto;

    // Vérifier que le document existe
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { client: true }
    });

    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    // Construire les conditions pour les entrées de temps
    const timeEntryWhere: any = {
      task: {
        list: {
          documentId: documentId
        }
      }
    };

    if (timeEntryIds && timeEntryIds.length > 0) {
      timeEntryWhere.id = { in: timeEntryIds };
    }

    if (onlyUninvoiced) {
      timeEntryWhere.invoiceId = null;
    }

    // Filtrer par date de début si fournie
    if (startDate) {
      timeEntryWhere.date = {
        gte: new Date(startDate)
      };
    }

    // Récupérer les entrées de temps avec les collaborateurs et leurs tarifs
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: timeEntryWhere,
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
                name: true
              }
            }
          }
        }
      }
    });

    if (timeEntries.length === 0) {
      throw new BadRequestException('Aucune entrée de temps trouvée pour la facturation');
    }

    // Calculer le montant total
    let totalAmount = 0;
    const invoiceDetails = timeEntries.map(entry => {
      const hourlyRate = entry.collaborator.pricingPerHour 
        ? parseFloat(entry.collaborator.pricingPerHour.toString())
        : 0;
      
      const hours = parseFloat(entry.hoursSpent.toString());
      const amount = hourlyRate * hours;

      totalAmount += amount;

      return {
        timeEntryId: entry.id,
        collaborator: `${entry.collaborator.firstName} ${entry.collaborator.lastName}`,
        task: entry.task.list.name,
        hours: hours,
        hourlyRate: hourlyRate,
        amount: amount,
        description: entry.description
      };
    });

    // Appliquer le taux de taxe
    const taxRate = customTaxRate ? parseFloat(customTaxRate) : 19.25;
    const taxAmount = totalAmount * (taxRate / 100);
    const totalWithTax = totalAmount + taxAmount;

    // Générer une référence de facture
    const invoiceReference = `FACT-${document.reference}-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculer la date d'échéance : utiliser celle fournie ou 30 jours par défaut
    let invoiceDueDate: Date;
    if (dueDate) {
      invoiceDueDate = new Date(dueDate);
      // Vérifier que la date est valide
      if (isNaN(invoiceDueDate.getTime())) {
        throw new BadRequestException('Date d\'échéance invalide');
      }
    } else {
      // 30 jours par défaut
      invoiceDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Créer la facture
    const invoice = await this.prisma.invoice.create({
      data: {
        reference: invoiceReference,
        amount: totalWithTax,
        taxRate: taxRate,
        issueDate: new Date(),
        dueDate: invoiceDueDate,
        paid: false,
        documentId: documentId,
        clientId: document.clientId,
        issuedById: userId,
        notes: `Facture générée automatiquement pour le document ${document.reference}`,
        status: 'DRAFT'
      }
    });

    // Lier les entrées de temps à la facture
    await this.prisma.timeEntry.updateMany({
      where: {
        id: {
          in: timeEntries.map(entry => entry.id)
        }
      },
      data: {
        invoiceId: invoice.id,
        invoiced: true
      }
    });

    return {
      invoice,
      details: invoiceDetails,
      summary: {
        totalHours: timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hoursSpent.toString()), 0),
        totalAmount: totalAmount,
        taxAmount: taxAmount,
        totalWithTax: totalWithTax
      }
    };
  }

  /**
   * Créer une facture manuellement
   */
  async create(createInvoiceDto: CreateInvoiceDto) {
    // S'ASSURER QUE issuedById EST PRÉSENT
    if (!createInvoiceDto.issuedById) {
      throw new BadRequestException('L\'utilisateur émetteur est requis');
    }

    // Convertir les nombres en Decimal pour Prisma
    const invoiceData: any = {
      ...createInvoiceDto,
      status: 'DRAFT'
    };

    // Gérer la conversion des nombres en Decimal
    if (createInvoiceDto.amount !== undefined) {
      invoiceData.amount = createInvoiceDto.amount;
    }
    if (createInvoiceDto.taxRate !== undefined) {
      invoiceData.taxRate = createInvoiceDto.taxRate;
    }

    // Gérer la date d'échéance
    if (createInvoiceDto.dueDate) {
      invoiceData.dueDate = new Date(createInvoiceDto.dueDate);
      if (isNaN(invoiceData.dueDate.getTime())) {
        throw new BadRequestException('Date d\'échéance invalide');
      }
    } else {
      // 30 jours par défaut
      invoiceData.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Date d'émission automatique
    invoiceData.issueDate = new Date();

    return this.prisma.invoice.create({
      data: invoiceData,
      include: {
        document: true,
        client: true,
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        timeEntries: {
          include: {
            collaborator: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            task: {
              include: {
                list: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Trouver toutes les factures avec pagination
   */
  async findAll(paginationDto: any, filters?: { status?: string; documentId?: string; clientId?: string }) {
    // CONVERTIR LES VALEURS EN NOMBRES
    const page = paginationDto.page ? parseInt(paginationDto.page.toString()) : 1;
    const limit = paginationDto.limit ? parseInt(paginationDto.limit.toString()) : 10;
    
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.documentId) where.documentId = filters.documentId;
    if (filters?.clientId) where.clientId = filters.clientId;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit, // MAINTENANT C'EST UN NOMBRE
        include: {
          document: {
            select: {
              id: true,
              title: true,
              reference: true
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              companyName: true
            }
          },
          issuedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.invoice.count({ where })
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Trouver une facture par ID
   */
  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        document: {
          include: {
            department: true
          }
        },
        client: true,
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        timeEntries: {
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
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }

    return invoice;
  }

  /**
   * Mettre à jour une facture
   */
  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    await this.findOne(id); // Vérifier que la facture existe

    const updateData: any = { ...updateInvoiceDto };

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        document: true,
        client: true
      }
    });
  }

  /**
   * Marquer une facture comme payée
   */
  async markAsPaid(id: string, paymentDate?: Date) {
    await this.findOne(id);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        paid: true,
        paymentDate: paymentDate || new Date(),
        status: 'PAID'
      }
    });
  }

  /**
   * Supprimer une facture
   */
  async remove(id: string) {
    await this.findOne(id);

    // Délier les entrées de temps avant suppression
    await this.prisma.timeEntry.updateMany({
      where: { invoiceId: id },
      data: { invoiceId: null, invoiced: false }
    });

    return this.prisma.invoice.delete({
      where: { id }
    });
  }

  /**
   * GÉNÉRER ET TÉLÉCHARGER UN PDF DE FACTURE
   */
  async generateInvoicePdf(invoiceId: string, res: Response) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        document: {
          include: {
            client: true
          }
        },
        client: true,
        issuedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        timeEntries: {
          include: {
            collaborator: {
              select: {
                firstName: true,
                lastName: true,
                pricingPerHour: true
              }
            },
            task: {
              include: {
                list: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }

    const pdfData = {
      id: invoice.id,
      reference: invoice.reference,
      amount: parseFloat(invoice.amount.toString()),
      taxRate: invoice.taxRate ? parseFloat(invoice.taxRate.toString()) : 19.25,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paid: invoice.paid,
      status: invoice.status,
      notes: invoice.notes,
      client: invoice.client || invoice.document?.client,
      timeEntries: (invoice.timeEntries || []).map(entry => ({
        ...entry,
        hoursSpent: parseFloat(entry.hoursSpent.toString()),
        collaborator: {
          firstName: entry.collaborator.firstName,
          lastName: entry.collaborator.lastName,
          pricingPerHour: entry.collaborator.pricingPerHour 
            ? parseFloat(entry.collaborator.pricingPerHour.toString())
            : 0
        },
        task: {
          list: {
            name: entry.task?.list?.name || 'Tâche non spécifiée'
          }
        },
        description: entry.description || entry.task?.list?.name || 'Prestation'
      }))
    };

    const pdfBuffer = await this.pdfService.generateInvoicePdf(pdfData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${invoice.reference}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    return res.send(pdfBuffer);
  }

  /**
   * APERÇU DU PDF DANS LE NAVIGATEUR
   */
  async previewInvoicePdf(invoiceId: string, res: Response) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        timeEntries: {
          include: {
            collaborator: {
              select: {
                firstName: true,
                lastName: true,
                pricingPerHour: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }

    const pdfData = {
      id: invoice.id,
      reference: invoice.reference,
      amount: parseFloat(invoice.amount.toString()),
      taxRate: invoice.taxRate ? parseFloat(invoice.taxRate.toString()) : 19.25,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paid: invoice.paid,
      status: invoice.status,
      client: invoice.client,
      timeEntries: (invoice.timeEntries || []).map(entry => ({
        ...entry,
        hoursSpent: parseFloat(entry.hoursSpent.toString()),
        collaborator: {
          firstName: entry.collaborator.firstName,
          lastName: entry.collaborator.lastName,
          pricingPerHour: entry.collaborator.pricingPerHour 
            ? parseFloat(entry.collaborator.pricingPerHour.toString())
            : 0
        }
      }))
    };

    const pdfBuffer = await this.pdfService.generateInvoicePdf(pdfData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="facture-${invoice.reference}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    return res.send(pdfBuffer);
  }

  /**
   * Ancienne méthode d'export PDF
   */
  async exportToPdf(invoiceId: string) {
    const invoice = await this.findOne(invoiceId);
    
    return {
      format: 'pdf',
      data: invoice,
      path: `/exports/invoices/${invoice.reference}.pdf`,
      message: 'Utilisez /download-pdf ou /preview-pdf pour les PDF réels'
    };
  }
  
  /**
   * Exporter une facture en Excel
   */
  async exportToExcel(invoiceId: string) {
    const invoice = await this.findOne(invoiceId);
    
    return {
      format: 'excel',
      data: invoice,
      path: `/exports/invoices/${invoice.reference}.xlsx`
    };
  }

  /**
   * Obtenir l'historique des factures par dossier
   */
  async getInvoicesByDocument(documentId: string, paginationDto: any) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { documentId },
        skip,
        take: limit,
        include: {
          client: true,
          issuedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          timeEntries: {
            include: {
              collaborator: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.invoice.count({ where: { documentId } })
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}