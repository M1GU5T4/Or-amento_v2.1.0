import { WorkOrder, Status, Client, Quote, QuoteStatus, Invoice, InvoiceStatus, Project, Task, Expense } from './types';

export const mockClients: Client[] = [
  { id: 'c1', name: 'Tech Solutions Ltda', email: 'contato@techsolutions.com', phone: '(11) 98765-4321', address: 'Av. Paulista, 1000' },
  { id: 'c2', name: 'Inova Corp', email: 'financeiro@inova.com', phone: '(21) 91234-5678', address: 'Rua das Inovações, 200' },
  { id: 'c3', name: 'Constru Bem', email: 'obras@construbem.com.br', phone: '(31) 95555-1234', address: 'Alameda dos Construtores, 50' },
];

export const mockWorkOrders: WorkOrder[] = [
  { id: '1', clientName: 'Ana Silva', clientAddress: 'Rua das Flores, 123', serviceType: 'Instalação Elétrica', technician: 'Carlos Pereira', scheduledDate: '2024-07-28', status: Status.Concluido, value: 450.00 },
  { id: '2', clientName: 'Bruno Costa', clientAddress: 'Av. Principal, 456', serviceType: 'Manutenção Hidráulica', technician: 'Mariana Lima', scheduledDate: '2024-08-05', status: Status.EmAndamento, value: 250.50 },
  { id: '3', clientName: 'Carla Dias', clientAddress: 'Praça Central, 789', serviceType: 'Pintura', technician: 'João Santos', scheduledDate: '2024-08-10', status: Status.Pendente, value: 1200.00 },
];

export const mockQuotes: Quote[] = [
  {
    id: 'q1',
    quoteNumber: 'ORC-2024-001',
    clientId: 'c1',
    issueDate: '2024-07-01',
    expiryDate: '2024-07-15',
    lineItems: [{ id: 'li1', description: 'Desenvolvimento de Website', quantity: 1, unitPrice: 5000 }],
    subtotal: 5000,
    tax: 0,
    total: 5000,
    status: QuoteStatus.Aprovado,
  },
  {
    id: 'q2',
    quoteNumber: 'ORC-2024-002',
    clientId: 'c2',
    issueDate: '2024-07-05',
    expiryDate: '2024-07-20',
    lineItems: [{ id: 'li2', description: 'Consultoria de SEO (Pacote Mensal)', quantity: 1, unitPrice: 1500 }],
    subtotal: 1500,
    tax: 0,
    total: 1500,
    status: QuoteStatus.Enviado,
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'i1',
    invoiceNumber: 'FAT-2024-001',
    quoteId: 'q1',
    clientId: 'c1',
    issueDate: '2024-07-16',
    dueDate: '2024-07-30',
    lineItems: [{ id: 'li1', description: 'Desenvolvimento de Website', quantity: 1, unitPrice: 5000 }],
    subtotal: 5000,
    tax: 0,
    total: 5000,
    amountPaid: 5000,
    status: InvoiceStatus.Pago,
  },
  {
    id: 'i2',
    invoiceNumber: 'FAT-2024-002',
    clientId: 'c3',
    issueDate: '2024-07-20',
    dueDate: '2024-08-05',
    lineItems: [
      { id: 'li3', description: 'Instalação de 10 pontos de rede', quantity: 10, unitPrice: 150 },
      { id: 'li4', description: 'Configuração de Servidor', quantity: 1, unitPrice: 800 },
    ],
    subtotal: 2300,
    tax: 0,
    total: 2300,
    amountPaid: 0,
    status: InvoiceStatus.Pendente,
  },
    {
    id: 'i3',
    invoiceNumber: 'FAT-2024-003',
    clientId: 'c2',
    issueDate: '2024-06-10',
    dueDate: '2024-06-25',
    lineItems: [{ id: 'li5', description: 'Manutenção Preventiva Servidores', quantity: 1, unitPrice: 950 }],
    subtotal: 950,
    tax: 0,
    total: 950,
    amountPaid: 950,
    status: InvoiceStatus.Pago,
  },
];

export const mockTasks: Task[] = [
    { id: 't1', name: 'Configurar ambiente de desenvolvimento', isCompleted: true },
    { id: 't2', name: 'Desenvolver layout da página inicial', isCompleted: true },
    { id: 't3', name: 'Criar integração com API de pagamentos', isCompleted: false },
    { id: 't4', name: 'Realizar testes de usabilidade', isCompleted: false },
]

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Website Institucional Tech Solutions',
    clientId: 'c1',
    startDate: '2024-07-17',
    status: 'Em Andamento',
    tasks: mockTasks
  },
  {
    id: 'p2',
    name: 'Campanha de Marketing Digital Inova Corp',
    clientId: 'c2',
    startDate: '2024-08-01',
    status: 'Não Iniciado',
    tasks: []
  },
];

export const mockExpenses: Expense[] = [
    { id: 'e1', category: 'Software', description: 'Assinatura Figma', amount: 80, date: '2024-07-05' },
    { id: 'e2', category: 'Hospedagem', description: 'Servidor AWS - Julho', amount: 250, date: '2024-07-01' },
    { id: 'e3', category: 'Marketing', description: 'Google Ads', amount: 400, date: '2024-07-15' },
];
