import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
// import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { TimeEntryModule } from '../time-entry/time-entry.module';
import { PrismaModule } from 'prisma/prisma.module';
import { PdfModule } from 'src/pdf/pdf.module';

@Module({
  imports: [PrismaModule, TasksModule, TimeEntryModule ,PdfModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}