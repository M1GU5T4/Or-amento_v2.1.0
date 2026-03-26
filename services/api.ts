import { mockClients, mockWorkOrders, mockQuotes, mockInvoices, mockProjects, mockExpenses } from '../mockData';

// Função para obter o token do localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Serviços de autenticação
export const authService = {
  login: async (email: string, password: string) => {
    // Credenciais padrão do admin
    if (email === 'admin@admin.com' && password === 'admin') {
      const response = {
        message: 'Login realizado com sucesso',
        user: {
          id: 'admin',
          name: 'Administrador',
          email: 'admin@admin.com',
          role: 'admin'
        },
        token: 'mock-token-admin'
      };

      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } else {
      throw new Error('Credenciais inválidas');
    }
  },

  register: async (name: string, email: string, password: string) => {
    // Para modo sem banco, apenas aceitar registro do admin
    if (email === 'admin@admin.com') {
      const response = {
        message: 'Usuário criado com sucesso',
        user: {
          id: 'admin',
          name: name || 'Administrador',
          email,
          role: 'admin',
          createdAt: new Date()
        },
        token: 'mock-token-admin'
      };

      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } else {
      throw new Error('Registro desabilitado no modo sem banco de dados');
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },
};

// Serviços de clientes
export const clientService = {
  getAll: async () => {
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockClients.map(client => ({
      ...client,
      _count: {
        workOrders: 0,
        quotes: 0,
        invoices: 0,
        projects: 0,
      }
    }));
  },
  getById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const client = mockClients.find(c => c.id === id);
    if (!client) throw new Error('Cliente não encontrado');
    return {
      ...client,
      workOrders: [],
      quotes: [],
      invoices: [],
      projects: [],
    };
  },
  create: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const existingClient = mockClients.find(c => c.email === data.email);
    if (existingClient) throw new Error('Email já está em uso');
    const newClient = {
      id: `c${Date.now()}`,
      ...data,
      createdAt: new Date()
    };
    mockClients.push(newClient);
    return newClient;
  },
  update: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const clientIndex = mockClients.findIndex(c => c.id === id);
    if (clientIndex === -1) throw new Error('Cliente não encontrado');
    const emailInUse = mockClients.find(c => c.email === data.email && c.id !== id);
    if (emailInUse) throw new Error('Email já está em uso');
    mockClients[clientIndex] = { ...mockClients[clientIndex], ...data };
    return mockClients[clientIndex];
  },
  delete: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const clientIndex = mockClients.findIndex(c => c.id === id);
    if (clientIndex === -1) throw new Error('Cliente não encontrado');
    mockClients.splice(clientIndex, 1);
    return { message: 'Cliente deletado com sucesso' };
  },
};

// Serviços de ordens de serviço
export const workOrderService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockWorkOrders;
  },
  getById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const workOrder = mockWorkOrders.find(w => w.id === id);
    if (!workOrder) throw new Error('Ordem de serviço não encontrada');
    return workOrder;
  },
  create: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newWorkOrder = {
      id: `w${Date.now()}`,
      ...data
    };
    mockWorkOrders.push(newWorkOrder);
    return newWorkOrder;
  },
  update: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockWorkOrders.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Ordem de serviço não encontrada');
    mockWorkOrders[index] = { ...mockWorkOrders[index], ...data };
    return mockWorkOrders[index];
  },
  delete: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockWorkOrders.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Ordem de serviço não encontrada');
    mockWorkOrders.splice(index, 1);
    return { message: 'Ordem de serviço deletada com sucesso' };
  },
};

// Serviços de orçamentos
export const quoteService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockQuotes;
  },
  getById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const quote = mockQuotes.find(q => q.id === id);
    if (!quote) throw new Error('Orçamento não encontrado');
    return quote;
  },
  getApproved: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockQuotes.filter(q => q.status === 'Aprovado');
  },
  create: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newQuote = {
      id: `q${Date.now()}`,
      ...data
    };
    mockQuotes.push(newQuote);
    return newQuote;
  },
  update: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockQuotes.findIndex(q => q.id === id);
    if (index === -1) throw new Error('Orçamento não encontrado');
    mockQuotes[index] = { ...mockQuotes[index], ...data };
    return mockQuotes[index];
  },
  delete: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockQuotes.findIndex(q => q.id === id);
    if (index === -1) throw new Error('Orçamento não encontrado');
    mockQuotes.splice(index, 1);
    return { message: 'Orçamento deletado com sucesso' };
  },
  convertToProject: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Simular conversão
    return { message: 'Projeto criado com sucesso' };
  },
  generatePDF: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Simular geração de PDF
    return new Response('Mock PDF content', { status: 200 });
  },
};

// Serviços de faturas
export const invoiceService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockInvoices;
  },
  getById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const invoice = mockInvoices.find(i => i.id === id);
    if (!invoice) throw new Error('Fatura não encontrada');
    return invoice;
  },
  create: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newInvoice = {
      id: `i${Date.now()}`,
      ...data
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  },
  update: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockInvoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Fatura não encontrada');
    mockInvoices[index] = { ...mockInvoices[index], ...data };
    return mockInvoices[index];
  },
  markAsPaid: async (id: string, amountPaid?: number) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockInvoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Fatura não encontrada');
    mockInvoices[index] = { ...mockInvoices[index], status: 'Pago' };
    return mockInvoices[index];
  },
  delete: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockInvoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Fatura não encontrada');
    mockInvoices.splice(index, 1);
    return { message: 'Fatura deletada com sucesso' };
  },
};

// Serviços de projetos
export const projectService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockProjects;
  },
  getById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const project = mockProjects.find(p => p.id === id);
    if (!project) throw new Error('Projeto não encontrado');
    return project;
  },
  create: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newProject = {
      id: `p${Date.now()}`,
      ...data
    };
    mockProjects.push(newProject);
    return newProject;
  },
  update: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Projeto não encontrado');
    mockProjects[index] = { ...mockProjects[index], ...data };
    return mockProjects[index];
  },
  updateProgress: async (id: string, progress: number) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Projeto não encontrado');
    mockProjects[index] = { ...mockProjects[index], progress };
    return mockProjects[index];
  },
  updateTask: async (projectId: string, taskId: string, isCompleted: boolean) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Simular atualização de tarefa
    return { message: 'Tarefa atualizada com sucesso' };
  },
  delete: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Projeto não encontrado');
    mockProjects.splice(index, 1);
    return { message: 'Projeto deletado com sucesso' };
  },

  // Despesas do projeto
  getExpenses: async (projectId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockExpenses.filter(e => e.projectId === projectId);
  },
  createExpense: async (projectId: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newExpense = {
      id: `e${Date.now()}`,
      projectId,
      ...data
    };
    mockExpenses.push(newExpense);
    return newExpense;
  },
  updateExpense: async (projectId: string, expenseId: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockExpenses.findIndex(e => e.id === expenseId && e.projectId === projectId);
    if (index === -1) throw new Error('Despesa não encontrada');
    mockExpenses[index] = { ...mockExpenses[index], ...data };
    return mockExpenses[index];
  },
  deleteExpense: async (projectId: string, expenseId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockExpenses.findIndex(e => e.id === expenseId && e.projectId === projectId);
    if (index === -1) throw new Error('Despesa não encontrada');
    mockExpenses.splice(index, 1);
    return { message: 'Despesa deletada com sucesso' };
  },
  getNotes: async (projectId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
  createNote: async (projectId: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: `note${Date.now()}`, projectId, ...data };
  },
  updateNote: async (projectId: string, noteId: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: noteId, projectId, ...data };
  },
  deleteNote: async (projectId: string, noteId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { message: 'Nota deletada com sucesso' };
  },

  // Relatório do projeto
  getReport: async (projectId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { projectId, report: null };
  },

  // Análise Financeira com IA
  getFinancialSummary: async (projectId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { projectId, summary: null };
  },
};

// Serviços de despesas
export const expenseService = {
  getAll: async (params?: { category?: string; startDate?: string; endDate?: string }) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    let expenses = mockExpenses;
    if (params?.category) {
      expenses = expenses.filter(e => e.category === params.category);
    }
    if (params?.startDate) {
      expenses = expenses.filter(e => new Date(e.date) >= new Date(params.startDate!));
    }
    if (params?.endDate) {
      expenses = expenses.filter(e => new Date(e.date) <= new Date(params.endDate!));
    }
    return expenses;
  },
  getById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const expense = mockExpenses.find(e => e.id === id);
    if (!expense) throw new Error('Despesa não encontrada');
    return expense;
  },
  create: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newExpense = {
      id: `e${Date.now()}`,
      ...data
    };
    mockExpenses.push(newExpense);
    return newExpense;
  },
  update: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockExpenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Despesa não encontrada');
    mockExpenses[index] = { ...mockExpenses[index], ...data };
    return mockExpenses[index];
  },
  delete: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockExpenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Despesa não encontrada');
    mockExpenses.splice(index, 1);
    return { message: 'Despesa deletada com sucesso' };
  },
  getReportByCategory: async (params?: { startDate?: string; endDate?: string }) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Simular relatório
    return { categories: [], total: 0 };
  },
};

// Serviços do dashboard
export const dashboardService = {
  getMetrics: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      totalProjects: mockProjects.length,
      totalInvoices: mockInvoices.length,
      totalRevenue: mockInvoices.reduce((sum, i) => sum + i.total, 0),
      totalExpenses: mockExpenses.reduce((sum, e) => sum + e.amount, 0),
    };
  },
  getRecentActivities: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
};

// Serviços de estoque
export const stockService = {
  // Categorias
  getCategories: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
  createCategory: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: `cat${Date.now()}`, ...data };
  },
  updateCategory: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id, ...data };
  },
  deleteCategory: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { message: 'Categoria deletada' };
  },

  // Itens
  getItems: async (params?: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
  getById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return null;
  },
  createItem: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: `item${Date.now()}`, ...data };
  },
  updateItem: async (id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id, ...data };
  },
  deleteItem: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { message: 'Item deletado' };
  },

  // Movimentações
  getMovements: async (itemId?: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
  createMovement: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: `mov${Date.now()}`, ...data };
  },

  // Relatórios
  getStockReport: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
  getMovementsReport: async (params?: { startDate?: string; endDate?: string }) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
};

// Verificação adicional de autenticação na inicialização
export const validateAuth = () => {
  const token = getAuthToken();
  const user = localStorage.getItem('user');

  // Se não há token ou usuário, limpar tudo
  if (!token || !user) {
    authService.logout();
    return false;
  }

  // Para modo sem banco, sempre retornar true se houver token
  return true;
};

// Serviços de configurações
export const settingsService = {
  getSettings: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { geminiApiKey: null };
  },
  updateSettings: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return data;
  },
  testGeminiToken: async (apiKey: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { valid: true };
  },
  removeGeminiToken: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { message: 'Token removido' };
  },
};