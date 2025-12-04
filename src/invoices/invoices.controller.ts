import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  Req, 
  Res,
  HttpStatus,
  UnauthorizedException
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('invoices')
@Controller('invoices')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // @Post('generate')
  // @ApiOperation({ summary: 'Générer automatiquement une facture à partir des entrées de temps' })
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'Facture générée avec succès' })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document non trouvé' })
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Aucune entrée de temps trouvée' })
  // async generateInvoice(@Body() generateInvoiceDto: GenerateInvoiceDto, @Req() req: any) {
  //   return await this.invoicesService.generateInvoice(req.user.id, generateInvoiceDto);
  // }

  // @Post()
  // @ApiOperation({ summary: 'Créer une facture manuellement' })
  // async create(@Body() createInvoiceDto: CreateInvoiceDto) {
  //   return await this.invoicesService.create(createInvoiceDto);
  // }

  
@Post('generate')
@ApiOperation({ summary: 'Générer automatiquement une facture à partir des entrées de temps' })
@ApiResponse({ status: HttpStatus.CREATED, description: 'Facture générée avec succès' })
@ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document non trouvé' })
@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Aucune entrée de temps trouvée' })
async generateInvoice(@Body() generateInvoiceDto: GenerateInvoiceDto, @Req() req: any) {
  // AJOUTER UNE VÉRIFICATION DE SÉCURITÉ
  const userId = req.user?.id;
  
  if (!userId) {
    throw new UnauthorizedException('Utilisateur non authentifié');
  }
  
  return await this.invoicesService.generateInvoice(userId, generateInvoiceDto);
}

@Post()
@ApiOperation({ summary: 'Créer une facture manuellement' })
async create(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req: any) {
  // AJOUTER L'UTILISATEUR QUI CRÉE LA FACTURE
  const userId = req.user?.id;
  
  if (!userId) {
    throw new UnauthorizedException('Utilisateur non authentifié');
  }
  
  // AJOUTER issuedById AU DTO
  const invoiceData = {
    ...createInvoiceDto,
    issuedById: userId
  };
  
  return await this.invoicesService.create(invoiceData);
}


  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les factures' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('documentId') documentId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return await this.invoicesService.findAll(
      { page, limit },
      { status, documentId, clientId }
    );
  }

  @Get('document/:documentId')
  @ApiOperation({ summary: 'Obtenir les factures d\'un document' })
  async findByDocument(
    @Param('documentId') documentId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.invoicesService.getInvoicesByDocument(documentId, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une facture par ID' })
  async findOne(@Param('id') id: string) {
    return await this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une facture' })
  async update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return await this.invoicesService.update(id, updateInvoiceDto);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Marquer une facture comme payée' })
  async markAsPaid(@Param('id') id: string, @Body('paymentDate') paymentDate?: Date) {
    return await this.invoicesService.markAsPaid(id, paymentDate);
  }

  @Get(':id/download-pdf')
  @ApiOperation({ summary: 'Télécharger le PDF d\'une facture' })
  async downloadInvoicePdf(
    @Param('id') id: string, 
    @Res() res: Response
  ) {
    return await this.invoicesService.generateInvoicePdf(id, res);
  }

  @Get(':id/preview-pdf')
  @ApiOperation({ summary: 'Prévisualiser le PDF d\'une facture dans le navigateur' })
  async previewInvoicePdf(
    @Param('id') id: string, 
    @Res() res: Response
  ) {
    return await this.invoicesService.previewInvoicePdf(id, res);
  }

  @Get(':id/export/pdf')
  @ApiOperation({ 
    summary: 'Exporter une facture en PDF (déprécié)',
    deprecated: true 
  })
  async exportToPdf(@Param('id') id: string) {
    return await this.invoicesService.exportToPdf(id);
  }

  @Get(':id/export/excel')
  @ApiOperation({ summary: 'Exporter une facture en Excel' })
  async exportToExcel(@Param('id') id: string) {
    return await this.invoicesService.exportToExcel(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une facture' })
  async remove(@Param('id') id: string) {
    return await this.invoicesService.remove(id);
  }
}