import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin apenas se não existir e se as variáveis de ambiente estiverem definidas
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN',
      },
    });

    console.log('👤 Usuário admin criado:', admin.email);
  } else {
    console.log('⚠️ Variáveis ADMIN_EMAIL e ADMIN_PASSWORD não definidas. Usuário admin não criado.');
  }

  // Criar clientes
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'contato@techsolutions.com' },
      update: {},
      create: {
        name: 'Tech Solutions Ltda',
        email: 'contato@techsolutions.com',
        phone: '(11) 98765-4321',
        address: 'Av. Paulista, 1000, São Paulo - SP',
      },
    }),
    prisma.client.upsert({
      where: { email: 'financeiro@inova.com' },
      update: {},
      create: {
        name: 'Inova Corp',
        email: 'financeiro@inova.com',
        phone: '(21) 91234-5678',
        address: 'Rua das Inovações, 200, Rio de Janeiro - RJ',
      },
    }),
    prisma.client.upsert({
      where: { email: 'obras@construbem.com.br' },
      update: {},
      create: {
        name: 'Constru Bem',
        email: 'obras@construbem.com.br',
        phone: '(31) 95555-1234',
        address: 'Alameda dos Construtores, 50, Belo Horizonte - MG',
      },
    }),
  ]);

  console.log('👥 Clientes criados:', clients.length);

  // Criar ordens de serviço
  const workOrders = await Promise.all([
    prisma.workOrder.create({
      data: {
        clientId: clients[0].id,
        serviceType: 'Desenvolvimento de Website',
        technician: 'Carlos Pereira',
        scheduledDate: new Date('2024-12-01'),
        status: 'CONCLUIDO',
        value: 5000.00,
      },
    }),
    prisma.workOrder.create({
      data: {
        clientId: clients[1].id,
        serviceType: 'Consultoria de SEO',
        technician: 'Mariana Lima',
        scheduledDate: new Date('2024-12-15'),
        status: 'EM_ANDAMENTO',
        value: 1500.00,
      },
    }),
    prisma.workOrder.create({
      data: {
        clientId: clients[2].id,
        serviceType: 'Instalação de Rede',
        technician: 'João Santos',
        scheduledDate: new Date('2024-12-20'),
        status: 'PENDENTE',
        value: 2300.00,
      },
    }),
  ]);

  console.log('📋 Ordens de serviço criadas:', workOrders.length);

  // Criar orçamentos
  const quotes = await Promise.all([
    prisma.quote.create({
      data: {
        quoteNumber: 'ORC-2024-001',
        clientId: clients[0].id,
        issueDate: new Date('2024-11-01'),
        expiryDate: new Date('2024-11-15'),
        subtotal: 5000,
        tax: 0,
        total: 5000,
        status: 'APROVADO',
        lineItems: {
          create: [
            {
              description: 'Desenvolvimento de Website Responsivo',
              quantity: 1,
              unitPrice: 5000,
              total: 5000,
            },
          ],
        },
      },
    }),
    prisma.quote.create({
      data: {
        quoteNumber: 'ORC-2024-002',
        clientId: clients[1].id,
        issueDate: new Date('2024-11-05'),
        expiryDate: new Date('2024-11-20'),
        subtotal: 1500,
        tax: 0,
        total: 1500,
        status: 'ENVIADO',
        lineItems: {
          create: [
            {
              description: 'Consultoria de SEO (Pacote Mensal)',
              quantity: 1,
              unitPrice: 1500,
              total: 1500,
            },
          ],
        },
      },
    }),
  ]);

  console.log('💰 Orçamentos criados:', quotes.length);

  // Criar faturas
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'FAT-2024-001',
        clientId: clients[0].id,
        quoteId: quotes[0].id,
        issueDate: new Date('2024-11-16'),
        dueDate: new Date('2024-11-30'),
        subtotal: 5000,
        tax: 0,
        total: 5000,
        amountPaid: 5000,
        status: 'PAGO',
        lineItems: {
          create: [
            {
              description: 'Desenvolvimento de Website Responsivo',
              quantity: 1,
              unitPrice: 5000,
              total: 5000,
            },
          ],
        },
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'FAT-2024-002',
        clientId: clients[2].id,
        issueDate: new Date('2024-11-20'),
        dueDate: new Date('2024-12-05'),
        subtotal: 2300,
        tax: 0,
        total: 2300,
        amountPaid: 0,
        status: 'PENDENTE',
        lineItems: {
          create: [
            {
              description: 'Instalação de 10 pontos de rede',
              quantity: 10,
              unitPrice: 150,
              total: 1500,
            },
            {
              description: 'Configuração de Servidor',
              quantity: 1,
              unitPrice: 800,
              total: 800,
            },
          ],
        },
      },
    }),
  ]);

  console.log('🧾 Faturas criadas:', invoices.length);

  // Criar projetos
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Website Institucional Tech Solutions',
        clientId: clients[0].id,
        startDate: new Date('2024-11-17'),
        status: 'EM_ANDAMENTO',
        tasks: {
          create: [
            { name: 'Configurar ambiente de desenvolvimento', isCompleted: true },
            { name: 'Desenvolver layout da página inicial', isCompleted: true },
            { name: 'Criar integração com API de pagamentos', isCompleted: false },
            { name: 'Realizar testes de usabilidade', isCompleted: false },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        name: 'Campanha de Marketing Digital Inova Corp',
        clientId: clients[1].id,
        startDate: new Date('2024-12-01'),
        status: 'NAO_INICIADO',
      },
    }),
  ]);

  console.log('🎯 Projetos criados:', projects.length);

  // Criar despesas
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        category: 'Software',
        description: 'Assinatura Figma Pro',
        amount: 80,
        date: new Date('2024-11-05'),
      },
    }),
    prisma.expense.create({
      data: {
        category: 'Hospedagem',
        description: 'Servidor AWS - Novembro',
        amount: 250,
        date: new Date('2024-11-01'),
      },
    }),
    prisma.expense.create({
      data: {
        category: 'Marketing',
        description: 'Google Ads - Campanha Q4',
        amount: 400,
        date: new Date('2024-11-15'),
      },
    }),
  ]);

  console.log('💸 Despesas criadas:', expenses.length);

  // Seed de estoque
  console.log('📦 Iniciando seed do estoque...');

  // Criar categorias de estoque
  const categories = await Promise.all([
    prisma.stockCategory.upsert({
      where: { name: 'Eletrônicos' },
      update: {},
      create: {
        name: 'Eletrônicos',
        description: 'Componentes e equipamentos eletrônicos',
      },
    }),
    prisma.stockCategory.upsert({
      where: { name: 'Ferramentas' },
      update: {},
      create: {
        name: 'Ferramentas',
        description: 'Ferramentas e equipamentos de trabalho',
      },
    }),
    prisma.stockCategory.upsert({
      where: { name: 'Materiais de Escritório' },
      update: {},
      create: {
        name: 'Materiais de Escritório',
        description: 'Suprimentos e materiais de escritório',
      },
    }),
  ]);

  console.log('📂 Categorias de estoque criadas:', categories.length);

  // Criar itens de estoque
  const stockItems = await Promise.all([
    prisma.stockItem.create({
      data: {
        name: 'Cabo HDMI 2m',
        description: 'Cabo HDMI 2.0 de 2 metros',
        categoryId: categories[0].id,
        type: 'PRODUTO',
        unit: 'UN',
        price: 25.90,
        quantity: 50,
        minStock: 10,
        supplier: 'TechSupply Ltda',
      },
    }),
    prisma.stockItem.create({
      data: {
        name: 'Chave de Fenda Phillips',
        description: 'Chave de fenda Phillips tamanho médio',
        categoryId: categories[1].id,
        type: 'FERRAMENTA',
        unit: 'UN',
        price: 12.50,
        quantity: 25,
        minStock: 5,
        supplier: 'Ferramentas Pro',
      },
    }),
    prisma.stockItem.create({
      data: {
        name: 'Papel A4 500 folhas',
        description: 'Resma de papel A4 branco 75g',
        categoryId: categories[2].id,
        type: 'MATERIAL',
        unit: 'UN',
        price: 18.90,
        quantity: 100,
        minStock: 20,
        supplier: 'Papelaria Central',
      },
    }),
    prisma.stockItem.create({
      data: {
        name: 'Switch 8 portas',
        description: 'Switch Gigabit 8 portas',
        categoryId: categories[0].id,
        type: 'EQUIPAMENTO',
        unit: 'UN',
        price: 89.90,
        quantity: 15,
        minStock: 3,
        supplier: 'TechSupply Ltda',
      },
    }),
  ]);

  console.log('📦 Itens de estoque criados:', stockItems.length);

  // Criar alguns movimentos de estoque
  const movements = await Promise.all([
    prisma.stockMovement.create({
      data: {
        itemId: stockItems[0].id,
        type: 'ENTRADA',
        quantity: 50,
        unitPrice: 25.90,
        totalValue: 50 * 25.90,
        reason: 'Compra inicial',
      },
    }),
    prisma.stockMovement.create({
      data: {
        itemId: stockItems[0].id,
        type: 'SAIDA',
        quantity: 5,
        unitPrice: 25.90,
        totalValue: 5 * 25.90,
        reason: 'Usado em projeto Tech Solutions',
      },
    }),
    prisma.stockMovement.create({
      data: {
        itemId: stockItems[3].id,
        type: 'ENTRADA',
        quantity: 15,
        unitPrice: 89.90,
        totalValue: 15 * 89.90,
        reason: 'Compra inicial',
      },
    }),
  ]);

  console.log('📊 Movimentos de estoque criados:', movements.length);
  console.log('✅ Seed do estoque concluído!');

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });