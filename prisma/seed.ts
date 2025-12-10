import { PrismaClient, Role, TaskStatus, AuditEntity, AuditAction } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Test database connection first
    await prisma.$connect();
    console.log('✅ Database connection established');

    // ======================
    // 1️⃣ Create Departments
    // ======================
    const departmentsData = [
      { 
        name: 'Contentieux', 
        colorHex: '#B12A2A',
        description: 'Département spécialisé en contentieux et litiges'
      },
      { 
        name: 'Conseil', 
        colorHex: '#2C6EA4',
        description: 'Département de conseil juridique et stratégique'
      },
      { 
        name: 'Tax', 
        colorHex: '#8A5FBF',
        description: 'Département fiscal et optimisation fiscale'
      },
      { 
        name: 'Douane, Changes & Investissement', 
        colorHex: '#2E8B57',
        description: 'Département douane, changes et investissements'
      },
      { 
        name: 'Communication & Marketing', 
        colorHex: '#D9822B',
        description: 'Département communication et marketing'
      },
      { 
        name: 'Support', 
        colorHex: '#6C757D',
        description: 'Département support et administration'
      },
    ];

    const departments: Record<string, { id: string; name: string }> = {};

    console.log('📁 Creating departments...');
    for (const d of departmentsData) {
      const dep = await prisma.department.upsert({
        where: { name: d.name },
        update: {},
        create: d,
      });
      departments[d.name] = dep;
      console.log(`   ✅ ${d.name}`);
    }

    // ======================
    // 2️⃣ Create Users with exact emails from your data
    // ======================
    console.log('👤 Creating users...');
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create Admin
    await prisma.user.upsert({
      where: { email: 'admin@dhavocats.com' },
      update: {},
      create: {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@dhavocats.com',
        password: hashedPassword,
        role: Role.ADMIN,
        position: 'Administrateur Système',
        phone: '+237 6 00 00 00 00', 
        pricingPerHour: 0,
      },
    });
    console.log('   ✅ Admin user created');

    // ======================
    // Management Team
    // ======================
    console.log('👔 Creating management team...');
    const managementTeam = [
      {
        firstName: 'Vanessa',
        lastName: 'de HAPPI',
        email: 'vdehappi@dhavocats.com',
        role: Role.BOARD,
        departmentId: departments['Conseil'].id,
        position: 'Managing Director',
        phone: '+237 6 11 11 11 11',
        pricingPerHour: 45000,
      },
      {
        firstName: 'Lionel',
        lastName: 'NGADJUI',
        email: 'lionelngadjui@dhavocats.com',
        role: Role.ASSOCIATE,
        departmentId: departments['Contentieux'].id,
        position: 'Operations Manager - Responsable Contentieux',
        phone: '+237 6 22 22 22 22',
        pricingPerHour: 40000,
      },
      {
        firstName: 'Rosalie',
        lastName: 'DIPITA',
        email: 'secretariat@dhavocats.com',
        role: Role.MID,
        departmentId: departments['Support'].id,
        position: 'Assistante Juridique',
        phone: '+237 6 33 33 33 33',
        pricingPerHour: 20000,
      },
      {
        firstName: 'Estelle',
        lastName: 'TAHOUE',
        email: 'etahoue@dhavocats.com',
        role: Role.MID,
        departmentId: departments['Support'].id,
        position: 'Assistante Exécutive',
        phone: '+237 6 44 44 44 44',
        pricingPerHour: 20000,
      },
    ];

    // ======================
    // Contentieux Department
    // ======================
    console.log('⚖️ Creating Contentieux team...');
    const contentieuxTeam = [
      // Avocats
      { 
        firstName: 'Ingrid', 
        lastName: 'TCHUEM', 
        email: 'itchuem@dhavocats.com', 
        role: Role.SENIOR, 
        position: 'Avocate',
        phone: '+237 6 55 55 55 55',
        pricingPerHour: 35000,
      },
      { 
        firstName: 'Igor', 
        lastName: 'HAPPI', 
        email: 'ihappi@dhavocats.com', 
        role: Role.SENIOR, 
        position: 'Avocat',
        phone: '+237 6 66 66 66 66',
        pricingPerHour: 35000,
      },
      { 
        firstName: 'Glory', 
        lastName: 'HUAMBO', 
        email: 'ghuambo@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Avocate',
        phone: '+237 6 77 77 77 77',
        pricingPerHour: 15000,
      },
      { 
        firstName: 'Dylan', 
        lastName: 'YOMTO', 
        email: 'dyomto@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Avocat',
        phone: '+237 6 88 88 88 88',
        pricingPerHour: 15000,
      },
      { 
        firstName: 'Grace', 
        lastName: 'ESSOMBE', 
        email: 'gessombe@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Avocate',
        phone: '+237 6 99 99 99 99',
        pricingPerHour: 15000,
      },
      { 
        firstName: 'Jodie', 
        lastName: 'NGODEM', 
        email: 'jngodem@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Avocate',
        phone: '+237 6 10 10 10 10',
        pricingPerHour: 15000,
      },
      // Juristes
      { 
        firstName: 'Russel', 
        lastName: 'NGAKO', 
        email: 'rngako@dhavocats.com', 
        role: Role.MID, 
        position: 'Juriste',
        phone: '+237 6 20 20 20 20',
        pricingPerHour: 25000,
      },
      { 
        firstName: 'Michelle', 
        lastName: 'MEHEBOU', 
        email: 'mmehebou@dhavocats.com', 
        role: Role.MID, 
        position: 'Juriste',
        phone: '+237 6 30 30 30 30',
        pricingPerHour: 25000,
      },
    ].map((u) => ({ ...u, departmentId: departments['Contentieux'].id }));

    // ======================
    // Conseil Department
    // ======================
    console.log('💼 Creating Conseil team...');
    const conseilTeam = [
      { 
        firstName: 'Freedy', 
        lastName: 'NJOMGANG', 
        email: 'fnjomgang@dhavocats.com', 
        role: Role.MID, 
        position: 'Conseiller Juridique',
        phone: '+237 6 40 40 40 40',
        pricingPerHour: 28000,
      },
      { 
        firstName: 'Esther Péronne', 
        lastName: 'NGO NYOBE', 
        email: 'engonyobe@dhavocats.com', 
        role: Role.MID, 
        position: 'Conseillère Juridique',
        phone: '+237 6 50 50 50 50',
        pricingPerHour: 28000,
      },
      { 
        firstName: 'Annick', 
        lastName: 'MOUANGUE', 
        email: 'amouangue@dhavocats.com', 
        role: Role.SENIOR, 
        position: 'Avocate Senior Conseil',
        phone: '+237 6 60 60 60 60',
        pricingPerHour: 35000,
      },
      { 
        firstName: 'Allyson', 
        lastName: 'MPONDO', 
        email: 'ampondo@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Conseiller Juridique',
        phone: '+237 6 70 70 70 70',
        pricingPerHour: 15000,
      },
    ].map((u) => ({ ...u, departmentId: departments['Conseil'].id }));

    // ======================
    // Tax Department
    // ======================
    console.log('💰 Creating Tax team...');
    const taxTeam = [
      { 
        firstName: 'Adamou', 
        lastName: 'MFONZIE', 
        email: 'amfonzie@dhavocats.com', 
        role: Role.SENIOR, 
        position: 'Responsable Tax',
        phone: '+237 6 80 80 80 80',
        pricingPerHour: 38000,
      },
    ].map((u) => ({ ...u, departmentId: departments['Tax'].id }));

    // ======================
    // Douane Department
    // ======================
    console.log('🛃 Creating Douane team...');
    const douaneTeam = [
      { 
        firstName: 'Joël', 
        lastName: 'TENE', 
        email: 'jtene@dhavocats.com', 
        role: Role.SENIOR, 
        position: 'Responsable Douane, Changes & Investissement',
        phone: '+237 6 90 90 90 90',
        pricingPerHour: 38000,
      },
    ].map((u) => ({ ...u, departmentId: departments['Douane, Changes & Investissement'].id }));

    // ======================
    // Communication & Marketing
    // ======================
    console.log('📢 Creating Communication & Marketing team...');
    const commTeam = [
      { 
        firstName: 'Reanie', 
        lastName: 'MBOUA', 
        email: 'rmboua@dhavocats.com', 
        role: Role.MID, 
        position: 'Responsable Communication & Marketing',
        phone: '+237 6 12 12 12 12',
        pricingPerHour: 22000,
      },
    ].map((u) => ({ ...u, departmentId: departments['Communication & Marketing'].id }));

    // ======================
    // Stagiaires (Interns)
    // ======================
    console.log('🎓 Creating stagiaires...');
    const stagiaires = [
      { 
        firstName: 'Lavande', 
        lastName: 'ONANA', 
        email: 'lonana@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Stagiaire',
        phone: '+237 6 13 13 13 13',
        pricingPerHour: 10000,
      },
      { 
        firstName: 'Raïssa', 
        lastName: 'MBONGO', 
        email: 'rmbongo@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Stagiaire',
        phone: '+237 6 14 14 14 14',
        pricingPerHour: 10000,
      },
      { 
        firstName: 'Laurence', 
        lastName: 'SIEWE BILE', 
        email: 'lsiewebile@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Stagiaire',
        phone: '+237 6 15 15 15 15',
        pricingPerHour: 10000,
      },
      { 
        firstName: 'Polyana', 
        lastName: 'MATIP', 
        email: 'pmatip@dhavocats.com', 
        role: Role.JUNIOR, 
        position: 'Stagiaire',
        phone: '+237 6 16 16 16 16',
        pricingPerHour: 10000,
      },
    ].map((u) => ({ ...u, departmentId: departments['Support'].id }));

    // Combine all users
    const allUsers = [
      ...managementTeam,
      ...contentieuxTeam,
      ...conseilTeam,
      ...taxTeam,
      ...douaneTeam,
      ...commTeam,
      ...stagiaires,
    ];

    console.log(`👥 Creating ${allUsers.length} users...`);
    for (const user of allUsers) {
      const userPassword = await bcrypt.hash('password123', 10);
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: userPassword,
          role: user.role,
          departmentId: user.departmentId,
          position: user.position,
          phone: user.phone,
          pricingPerHour: user.pricingPerHour,
        },
      });
      console.log(`   ✅ ${user.firstName} ${user.lastName} - ${user.position}`);
    }

    // ======================
    // Set Department Managers
    // ======================
    console.log('🏢 Setting department managers...');
    
    // Get the manager users
    const vanessa = await prisma.user.findUnique({ where: { email: 'vdehappi@dhavocats.com' } });
    const lionel = await prisma.user.findUnique({ where: { email: 'lionelngadjui@dhavocats.com' } });
    const adamou = await prisma.user.findUnique({ where: { email: 'amfonzie@dhavocats.com' } });
    const joel = await prisma.user.findUnique({ where: { email: 'jtene@dhavocats.com' } });
    const reanie = await prisma.user.findUnique({ where: { email: 'rmboua@dhavocats.com' } });

    // Update departments with managers
    await prisma.department.update({
      where: { name: 'Conseil' },
      data: {
        managers: {
          connect: { id: vanessa?.id }
        }
      }
    });

    await prisma.department.update({
      where: { name: 'Contentieux' },
      data: {
        managers: {
          connect: { id: lionel?.id }
        }
      }
    });

    await prisma.department.update({
      where: { name: 'Tax' },
      data: {
        managers: {
          connect: { id: adamou?.id }
        }
      }
    });

    await prisma.department.update({
      where: { name: 'Douane, Changes & Investissement' },
      data: {
        managers: {
          connect: { id: joel?.id }
        }
      }
    });

    await prisma.department.update({
      where: { name: 'Communication & Marketing' },
      data: {
        managers: {
          connect: { id: reanie?.id }
        }
      }
    });

    console.log('   ✅ Department managers assigned');

    // ======================
    // 3️⃣ Create Clients
    // ======================
    console.log('🏢 Creating clients...');
    const clients = await Promise.all([
      prisma.client.upsert({
        where: { email: 'contact@abc-corporation.com' },
        update: {},
        create: {
          name: 'Jean Dupont',
          email: 'contact@abc-corporation.com',
          phone: '+237 6 12 34 56 78',
          companyName: 'ABC Corporation',
          address: '123 Avenue des Champs, Akwa',
          city: 'Douala',
          country: 'Cameroun',
          vatNumber: 'VAT123456789',
        },
      }),
      prisma.client.upsert({
        where: { email: 'info@xyz-enterprises.com' },
        update: {},
        create: {
          name: 'Marie Lambert',
          email: 'info@xyz-enterprises.com',
          phone: '+237 6 98 76 54 32',
          companyName: 'XYZ Enterprises',
          address: '456 Boulevard de la République, Bastos',
          city: 'Yaoundé',
          country: 'Cameroun',
          vatNumber: 'VAT987654321',
        },
      }),
      prisma.client.upsert({
        where: { email: 'director@global-trading.com' },
        update: {},
        create: {
          name: 'Pierre Mbappe',
          email: 'director@global-trading.com',
          phone: '+237 6 55 44 33 22',
          companyName: 'Global Trading Ltd',
          address: '789 Rue du Commerce, Bonanjo',
          city: 'Douala',
          country: 'Cameroun',
          vatNumber: 'VAT456789123',
        },
      }),
    ]);

    clients.forEach(client => console.log(`   ✅ ${client.companyName}`));

    // ======================
    // 4️⃣ Create Referents
    // ======================
    console.log('👥 Creating referents...');
    const referents = await Promise.all([
      prisma.referent.create({
        data: {
          name: 'Dr. Alain Sende',
          email: 'alain.sende@ministere-finances.cm',
          phone: '+237 6 70 70 70 70',
          company: 'Ministère des Finances',
          position: 'Directeur des Affaires Fiscales',
          address: 'Ministère des Finances, Yaoundé',
        },
      }),
      prisma.referent.create({
        data: {
          name: 'Mme. Chantal Ngo',
          email: 'chantal.ngo@douanes.cm',
          phone: '+237 6 71 71 71 71',
          company: 'Direction Générale des Douanes',
          position: 'Chef Service Contentieux',
          address: 'Direction Générale des Douanes, Douala',
        },
      }),
      prisma.referent.create({
        data: {
          name: 'M. Samuel Kengne',
          email: 'samuel.kengne@armp.cm',
          phone: '+237 6 72 72 72 72',
          company: 'ARMP Cameroun',
          position: 'Responsable des Marchés Publics',
          address: 'ARMP, Yaoundé',
        },
      }),
    ]);

    referents.forEach(referent => console.log(`   ✅ ${referent.name}`));

    // ======================
    // 5️⃣ Create Documents with Departments
    // ======================
    console.log('📄 Creating documents...');
    const ingrid = await prisma.user.findUnique({ where: { email: 'itchuem@dhavocats.com' } });
    const freedy = await prisma.user.findUnique({ where: { email: 'fnjomgang@dhavocats.com' } });

    // Pour éviter l'erreur de contrainte unique, on va d'abord vérifier si les documents existent
    const documents = await Promise.all([
      prisma.document.upsert({
        where: { reference: 'DOC-CONT-2024-001' },
        update: {},
        create: {
          title: 'Contentieux Commercial - ABC Corporation',
          reference: 'DOC-CONT-2024-001',
          type: 'Contentieux',
          description: 'Affaire de rupture de contrat commercial avec recours en indemnisation',
          status: 'ACTIVE',
          budgetAmount: 1500000.00,
          clientId: clients[0].id,
          departmentId: departments['Contentieux'].id,
          referentId: referents[1].id,
          responsableId: ingrid?.id,
          creatorId: vanessa?.id!,
        },
      }),
      prisma.document.upsert({
        where: { reference: 'DOC-CONS-2024-002' },
        update: {},
        create: {
          title: 'Conseil en Fusion-Acquisition - XYZ Enterprises',
          reference: 'DOC-CONS-2024-002',
          type: 'Conseil',
          description: 'Accompagnement juridique pour fusion acquisition entre XYZ Enterprises et Global Tech',
          status: 'ACTIVE',
          budgetAmount: 2500000.00,
          clientId: clients[1].id,
          departmentId: departments['Conseil'].id,
          referentId: referents[2].id,
          responsableId: vanessa?.id,
          creatorId: vanessa?.id!,
        },
      }),
      prisma.document.upsert({
        where: { reference: 'DOC-FISC-2024-003' },
        update: {},
        create: {
          title: 'Optimisation Fiscale - Global Trading',
          reference: 'DOC-FISC-2024-003',
          type: 'Fiscal',
          description: 'Stratégie d\'optimisation fiscale internationale et conseil en planification fiscale',
          status: 'ACTIVE',
          budgetAmount: 800000.00,
          clientId: clients[2].id,
          departmentId: departments['Tax'].id,
          referentId: referents[0].id,
          responsableId: adamou?.id,
          creatorId: vanessa?.id!,
        },
      }),
    ]);

    documents.forEach(doc => console.log(`   ✅ ${doc.title}`));

    // ======================
    // 6️⃣ Create Lists for Documents
    // ======================
    console.log('📋 Creating lists...');
    const lists = await Promise.all([
      // Lists for Document 1 (Contentieux)
      prisma.list.create({
        data: {
          name: 'Phase Préliminaire',
          description: 'Analyse initiale du dossier',
          documentId: documents[0].id,
          status: 'COMPLETED',
          dueDate: new Date('2024-02-15'),
        },
      }),
      prisma.list.create({
        data: {
          name: 'Recherche Jurisprudentielle',
          description: 'Étude de la jurisprudence applicable',
          documentId: documents[0].id,
          status: 'IN_PROGRESS',
          dueDate: new Date('2024-03-01'),
        },
      }),

      // Lists for Document 2 (Conseil)
      prisma.list.create({
        data: {
          name: 'Due Diligence',
          description: 'Audit juridique de la cible',
          documentId: documents[1].id,
          status: 'IN_PROGRESS',
          dueDate: new Date('2024-02-20'),
        },
      }),

      // Lists for Document 3 (Tax)
      prisma.list.create({
        data: {
          name: 'Analyse Fiscale',
          description: 'Étude de la situation fiscale actuelle',
          documentId: documents[2].id,
          status: 'COMPLETED',
          dueDate: new Date('2024-02-10'),
        },
      }),
    ]);

    lists.forEach(list => console.log(`   ✅ ${list.name}`));

    // ======================
    // 7️⃣ Create Tasks
    // ======================
    console.log('✅ Creating tasks...');
    const glory = await prisma.user.findUnique({ where: { email: 'ghuambo@dhavocats.com' } });
    const dylan = await prisma.user.findUnique({ where: { email: 'dyomto@dhavocats.com' } });

    const tasks = await Promise.all([
      // Tasks for Contentieux document
      prisma.task.create({
        data: {
          title: 'Analyse du contrat initial',
          description: 'Examen détaillé des clauses contractuelles',
          listId: lists[0].id,
          assigneeId: glory?.id,
          createdById: vanessa?.id!,
          maxTimeHours: 8,
          status: TaskStatus.DONE,
          dueDate: new Date('2024-02-10'),
        },
      }),
      prisma.task.create({
        data: {
          title: 'Recherche jurisprudence récente',
          description: 'Analyse des décisions similaires récentes',
          listId: lists[1].id,
          assigneeId: dylan?.id,
          createdById: vanessa?.id!,
          maxTimeHours: 12,
          status: TaskStatus.IN_PROGRESS,
          dueDate: new Date('2024-02-25'),
        },
      }),

      // Tasks for Conseil document
      prisma.task.create({
        data: {
          title: 'Audit des contrats en cours',
          description: 'Examen de tous les contrats actifs',
          listId: lists[2].id,
          assigneeId: freedy?.id,
          createdById: vanessa?.id!,
          maxTimeHours: 20,
          status: TaskStatus.IN_PROGRESS,
          dueDate: new Date('2024-02-18'),
        },
      }),

      // Tasks for Tax document
      prisma.task.create({
        data: {
          title: 'Étude des obligations déclaratives',
          description: 'Analyse des déclarations fiscales passées',
          listId: lists[3].id,
          assigneeId: adamou?.id,
          createdById: vanessa?.id!,
          maxTimeHours: 10,
          status: TaskStatus.DONE,
          dueDate: new Date('2024-02-05'),
        },
      }),
    ]);

    tasks.forEach(task => console.log(`   ✅ ${task.title}`));

    // ======================
    // 8️⃣ Create Time Entries
    // ======================
    console.log('⏱️ Creating time entries...');
    const timeEntries = await Promise.all([
      prisma.timeEntry.create({
        data: {
          taskId: tasks[0].id,
          collaboratorId: glory?.id!,
          hoursSpent: 7.5,
          description: 'Analyse complète des clauses contractuelles',
          date: new Date('2024-02-08'),
        },
      }),
      prisma.timeEntry.create({
        data: {
          taskId: tasks[0].id,
          collaboratorId: ingrid?.id!,
          hoursSpent: 2.0,
          description: 'Revue et validation de l\'analyse',
          date: new Date('2024-02-09'),
        },
      }),
      prisma.timeEntry.create({
        data: {
          taskId: tasks[1].id,
          collaboratorId: dylan?.id!,
          hoursSpent: 5.0,
          description: 'Recherche initiale de jurisprudence',
          date: new Date('2024-02-20'),
        },
      }),
      prisma.timeEntry.create({
        data: {
          taskId: tasks[2].id,
          collaboratorId: freedy?.id!,
          hoursSpent: 15.0,
          description: 'Audit complet des contrats',
          date: new Date('2024-02-15'),
        },
      }),
    ]);

    timeEntries.forEach(entry => console.log(`   ✅ ${entry.hoursSpent} hours recorded`));

    // ======================
    // 9️⃣ Create Invoices
    // ======================
    console.log('🧾 Creating invoices...');
    const invoices = await Promise.all([
      prisma.invoice.create({
        data: {
          reference: 'FACT-2024-001',
          amount: 450000.00,
          taxRate: 19.25,
          issueDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          paid: false,
          documentId: documents[0].id,
          clientId: clients[0].id,
          issuedById: vanessa?.id,
        },
      }),
      prisma.invoice.create({
        data: {
          reference: 'FACT-2024-002',
          amount: 750000.00,
          taxRate: 19.25,
          issueDate: new Date('2024-01-20'),
          dueDate: new Date('2024-02-20'),
          paid: true,
          paymentDate: new Date('2024-02-10'),
          documentId: documents[1].id,
          clientId: clients[1].id,
          issuedById: vanessa?.id,
        },
      }),
    ]);

    invoices.forEach(invoice => console.log(`   ✅ Invoice ${invoice.reference}`));

    // ======================
    // 🔟 Create Files
    // ======================
    console.log('📎 Creating files...');
    const files = await Promise.all([
      prisma.file.create({
        data: {
          name: 'contrat-initial-abc.pdf',
          path: '/uploads/documents/contrat-initial-abc.pdf',
          mimeType: 'application/pdf',
          size: 2048576,
          uploadedById: glory?.id!,
          documentId: documents[0].id,
        },
      }),
      prisma.file.create({
        data: {
          name: 'due-diligence-rapport-xyz.docx',
          path: '/uploads/documents/due-diligence-rapport-xyz.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1048576,
          uploadedById: freedy?.id!,
          documentId: documents[1].id,
        },
      }),
    ]);

    files.forEach(file => console.log(`   ✅ ${file.name}`));

    // ======================
    // 1️⃣1️⃣ Create Reports
    // ======================
    console.log('📊 Creating reports...');
    const reports = await Promise.all([
      prisma.report.create({
        data: {
          title: 'Rapport d\'Avancement - Contentieux ABC Corporation',
          content: 'Analyse complète de l\'avancement du dossier contentieux ABC Corporation. Le dossier en est à sa phase préliminaire avec collecte des pièces et analyse des preuves.',
          documentId: documents[0].id,
          generatedById: lionel?.id,
        },
      }),
      prisma.report.create({
        data: {
          title: 'Synthèse Due Diligence - XYZ Enterprises',
          content: 'Résumé des findings de l\'audit pré-fusion de XYZ Enterprises. L\'analyse révèle une situation financière saine et une conformité juridique satisfaisante.',
          documentId: documents[1].id,
          generatedById: vanessa?.id,
        },
      }),
    ]);

    reports.forEach(report => console.log(`   ✅ ${report.title}`));

    // ======================
    // 1️⃣2️⃣ Create Audit Logs
    // ======================
    console.log('📝 Creating audit logs...');
    const auditLogs = await Promise.all([
      prisma.auditLog.create({
        data: {
          description: 'Dossier créé et assigné au département Contentieux',
          entity: AuditEntity.DOCUMENT,
          entityId: documents[0].id,
          entityName: documents[0].title,
          action: AuditAction.CREATE,
          userId: vanessa?.id!,
        },
      }),
      prisma.auditLog.create({
        data: {
          description: 'Phase préliminaire complétée avec succès',
          entity: AuditEntity.DOCUMENT,
          entityId: documents[0].id,
          entityName: documents[0].title,
          action: AuditAction.UPDATE,
          userId: ingrid?.id!,
        },
      }),
    ]);

    auditLogs.forEach(log => console.log(`   ✅ ${log.description}`));

    // ======================
    // 1️⃣3️⃣ Create Notifications
    // ======================
    console.log('🔔 Creating notifications...');
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          message: 'Nouveau document assigné: Contentieux Commercial - ABC Corporation',
          userId: ingrid?.id!,
        },
      }),
      prisma.notification.create({
        data: {
          message: 'Échéance approchante pour le rapport de due diligence',
          userId: freedy?.id!,
        },
      }),
      prisma.notification.create({
        data: {
          message: 'Facture payée pour le dossier XYZ Enterprises',
          userId: vanessa?.id!,
          isRead: true,
        },
      }),
    ]);

    notifications.forEach(notification => console.log(`   ✅ Notification created`));

    console.log('🎉 Seeding completed successfully!');
    console.log(`📊 Summary: ${allUsers.length} users, ${documents.length} documents, ${tasks.length} tasks created`);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });