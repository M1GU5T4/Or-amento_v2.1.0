const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.REACT_APP_API_URL || 'http://localhost:3002/api';

// Debug: Log da URL da API
console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_URL:', (import.meta as any).env?.VITE_API_URL);
console.log('REACT_APP_API_URL:', (import.meta as any).env?.REACT_APP_API_URL);

// Função para obter o token do localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Função para fazer requisições autenticadas
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  console.log('API Request:', { 
    url: `${API_BASE_URL}${endpoint}`, 
    method: config.method || 'GET',
    headers: config.headers,
    body: config.body 
  });

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log('API Response:', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok 
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('API Error:', error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('API Success:', result);
    return result;
  } catch (fetchError) {
    console.error('Fetch Error:', fetchError);
    throw fetchError;
  }
};

// Serviços de autenticação
export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
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
  getAll: () => apiRequest('/clients'),
  getById: (id: string) => apiRequest(`/clients/${id}`),
  create: (data: any) => apiRequest('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/clients/${id}`, {
    method: 'DELETE',
  }),
};

// Serviços de ordens de serviço
export const workOrderService = {
  getAll: () => apiRequest('/work-orders'),
  getById: (id: string) => apiRequest(`/work-orders/${id}`),
  create: (data: any) => apiRequest('/work-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/work-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/work-orders/${id}`, {
    method: 'DELETE',
  }),
};

// Serviços de orçamentos
export const quoteService = {
  getAll: () => apiRequest('/quotes'),
  getById: (id: string) => apiRequest(`/quotes/${id}`),
  getApproved: () => apiRequest('/quotes/approved'), // Nova função para orçamentos aprovados
  create: (data: any) => apiRequest('/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/quotes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/quotes/${id}`, {
    method: 'DELETE',
  }),
  convertToProject: (id: string, data: any) => apiRequest(`/quotes/${id}/convert-to-project`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generatePDF: (id: string) => {
    const token = localStorage.getItem('authToken');
    return fetch(`${API_BASE_URL}/quotes/${id}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Serviços de faturas
export const invoiceService = {
  getAll: () => apiRequest('/invoices'),
  getById: (id: string) => apiRequest(`/invoices/${id}`),
  create: (data: any) => apiRequest('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  markAsPaid: (id: string, amountPaid?: number) => apiRequest(`/invoices/${id}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ amountPaid }),
  }),
  delete: (id: string) => apiRequest(`/invoices/${id}`, {
    method: 'DELETE',
  }),
};

// Serviços de projetos
export const projectService = {
  getAll: () => apiRequest('/projects'),
  getById: (id: string) => apiRequest(`/projects/${id}`),
  create: (data: any) => apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateProgress: (id: string, progress: number) => apiRequest(`/projects/${id}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ progress }),
  }),
  updateTask: (projectId: string, taskId: string, isCompleted: boolean) =>
    apiRequest(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
    }),
  delete: (id: string) => apiRequest(`/projects/${id}`, {
    method: 'DELETE',
  }),

  // Despesas do projeto
  getExpenses: (projectId: string) => apiRequest(`/projects/${projectId}/expenses`),
  createExpense: (projectId: string, data: any) => apiRequest(`/projects/${projectId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateExpense: (projectId: string, expenseId: string, data: any) =>
    apiRequest(`/projects/${projectId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExpense: (projectId: string, expenseId: string) =>
    apiRequest(`/projects/${projectId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),

  // Anotações do projeto
  getNotes: (projectId: string) => apiRequest(`/projects/${projectId}/notes`),
  createNote: (projectId: string, data: any) => apiRequest(`/projects/${projectId}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateNote: (projectId: string, noteId: string, data: any) =>
    apiRequest(`/projects/${projectId}/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteNote: (projectId: string, noteId: string) =>
    apiRequest(`/projects/${projectId}/notes/${noteId}`, {
      method: 'DELETE',
    }),

  // Relatório do projeto
  getReport: (projectId: string) => apiRequest(`/projects/${projectId}/report`),

  // Análise Financeira com IA
  getFinancialSummary: (projectId: string) => apiRequest(`/projects/${projectId}/financial-summary`),
};

// Serviços de despesas
export const expenseService = {
  getAll: (params?: { category?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiRequest(`/expenses${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => apiRequest(`/expenses/${id}`),
  create: (data: any) => apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/expenses/${id}`, {
    method: 'DELETE',
  }),
  getReportByCategory: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiRequest(`/expenses/reports/by-category${query ? `?${query}` : ''}`);
  },
};

// Serviços do dashboard
export const dashboardService = {
  getMetrics: () => apiRequest('/dashboard/metrics'),
  getRecentActivities: () => apiRequest('/dashboard/recent-activities'),
};

// Serviços de estoque
export const stockService = {
  // Categorias
  getCategories: () => apiRequest('/stock/categories'),
  createCategory: (data: any) => apiRequest('/stock/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCategory: (id: string, data: any) => apiRequest(`/stock/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCategory: (id: string) => apiRequest(`/stock/categories/${id}`, {
    method: 'DELETE',
  }),

  // Itens
  getItems: (params?: { categoryId?: string; type?: string; lowStock?: boolean; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.lowStock) queryParams.append('lowStock', 'true');
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return apiRequest(`/stock/items${query ? `?${query}` : ''}`);
  },
  getItemById: (id: string) => apiRequest(`/stock/items/${id}`),
  createItem: (data: any) => apiRequest('/stock/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateItem: (id: string, data: any) => apiRequest(`/stock/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteItem: (id: string) => apiRequest(`/stock/items/${id}`, {
    method: 'DELETE',
  }),

  // Movimentações
  getMovements: (params?: { itemId?: string; type?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.itemId) queryParams.append('itemId', params.itemId);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiRequest(`/stock/movements${query ? `?${query}` : ''}`);
  },
  createMovement: (data: any) => apiRequest('/stock/movements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Relatórios
  getStockReport: () => apiRequest('/stock/reports/stock'),
  getMovementsReport: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiRequest(`/stock/reports/movements${query ? `?${query}` : ''}`);
  },
};

// Interceptor para lidar com erros de autenticação
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  if (response.status === 401) {
    authService.logout();
    // Forçar reload da página para garantir que o login seja exibido
    window.location.reload();
  }

  return response;
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

  // Verificar se o token não expirou (básico)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;

    if (payload.exp && payload.exp < now) {
      authService.logout();
      return false;
    }
  } catch (error) {
    authService.logout();
    return false;
  }

  return true;
};

// Serviços de configurações
export const settingsService = {
  getSettings: () => apiRequest('/settings'),
  updateSettings: (data: any) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  testGeminiToken: (apiKey: string) => apiRequest('/settings/test-gemini', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  }),
  removeGeminiToken: () => apiRequest('/settings/gemini-token', {
    method: 'DELETE',
  }),
};