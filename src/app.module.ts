import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { TimeEntryModule } from './time-entry/time-entry.module';
import { TasksModule } from './tasks/tasks.module';
import { ListsModule } from './lists/lists.module';
import { DepartementsModule } from './departements/departements.module';
import { ClientsModule } from './clients/clients.module';
// import { InvoicesModule } from '.invoices/invoices.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    DocumentsModule,
    ListsModule,
    TasksModule,
    TimeEntryModule,
    DepartementsModule,
    ClientsModule,
    InvoicesModule,
    // InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
