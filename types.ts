export enum Status {
  Pendente = 'PENDENTE',
  EmAndamento = 'EM_ANDAMENTO',
  Concluido = 'CONCLUIDO',
  Cancelado = 'CANCELADO',
}

export interface WorkOrder {
  id: string;
  clientId: string;
  serviceType: string;
  technician: string;
  scheduledDate: string;
  status: Status;
  value: number;
}

// NOVOS TIPOS ADICIONADOS

export enum QuoteStatus {
  Rascunho = 'RASCUNHO',
  Enviado = 'ENVIADO',
  Aprovado = 'APROVADO',
  Rejeitado = 'REJEITADO',
}

export enum InvoiceStatus {
  Rascunho = 'RASCUNHO',
  Pendente = 'PENDENTE',
  Pago = 'PAGO',
  Atrasado = 'ATRASADO',
  Cancelado = 'CANCELADO',
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  issueDate: string;
  expiryDate: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  notes?: string; // Campo para observações
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
}

export enum ProjectStatus {
  NaoIniciado = 'NAO_INICIADO',
  EmAndamento = 'EM_ANDAMENTO',
  Concluido = 'CONCLUIDO',
}

export enum ProjectExpenseCategory {
  Almoco = 'ALMOCO',
  Deslocamento = 'DESLOCAMENTO',
  Material = 'MATERIAL',
  Outros = 'OUTROS',
}

export enum ProjectNoteType {
  Geral = 'GERAL',
  Progresso = 'PROGRESSO',
  Problema = 'PROBLEMA',
  Observacao = 'OBSERVACAO',
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  quoteId?: string; // Referência ao orçamento de origem
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  description?: string;
  progress: number; // 0-100
  budget?: number;
  tasks: Task[];
  projectExpenses?: ProjectExpense[];
  projectNotes?: ProjectNote[];
  client?: Client;
  quote?: Quote; // Orçamento de origem
  // Campos calculados
  taskProgress?: number;
  totalExpenses?: number;
  daysRemaining?: number;
  isOverdue?: boolean;
}

export interface Task {
  id: string;
  name: string;
  isCompleted: boolean;
  projectId: string;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  category: ProjectExpenseCategory;
  description: string;
  amount: number;
  date: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: ProjectNoteType;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  invoiceId?: string; // Para vincular a despesa a uma fatura
}

// ===== SISTEMA DE ESTOQUE =====

export enum StockItemType {
  Produto = 'PRODUTO',
  MaoDeObra = 'MAO_DE_OBRA',
  Metro = 'METRO',
}

export enum StockMovementType {
  Entrada = 'ENTRADA',
  Saida = 'SAIDA',
  Ajuste = 'AJUSTE',
  Transferencia = 'TRANSFERENCIA',
}

export interface StockCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items?: StockItem[];
  _count?: {
    items: number;
  };
}

export interface StockItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  type: StockItemType;
  unit: string; // "UN", "HORA", "METRO", "KG", "LITRO", etc.
  price: number;
  quantity: number;
  minStock?: number;
  maxStock?: number;
  barcode?: string;
  supplier?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: StockCategory;
  movements?: StockMovement[];
  // Campos calculados
  totalValue?: number;
  isLowStock?: boolean;
  lastMovement?: StockMovement;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: StockMovementType;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  reason?: string;
  reference?: string;
  userId?: string;
  createdAt: string;
  item?: StockItem;
}

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  stockItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  stockItem?: StockItem;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  stockItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  stockItem?: StockItem;
}
