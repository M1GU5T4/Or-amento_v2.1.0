import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { WorkOrder, Status, Client, Quote, Invoice, Project, Expense, QuoteStatus, InvoiceStatus } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WorkOrderList from './components/WorkOrderList';
import WorkOrderForm from './components/WorkOrderForm';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import QuoteList from './components/QuoteList';
import QuoteForm from './components/QuoteForm';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import ProjectList from './components/ProjectList';
import ProjectForm from './components/ProjectForm';
import ProjectDetails from './components/ProjectDetails';
import ExpenseList from './components/ExpenseList';
import Stock from './components/Stock';
import Reports from './components/Reports';
import Settings from './components/Settings';
import ClientPortal from './components/ClientPortal';
import Login from './components/Login';
import { Plus } from 'lucide-react';
import { mockWorkOrders, mockClients, mockQuotes, mockInvoices, mockProjects, mockExpenses } from './mockData';
import { authService, clientService, workOrderService, quoteService, invoiceService, projectService, expenseService, validateAuth } from './services/api';


export type View = 'dashboard' | 'orders' | 'clients' | 'quotes' | 'invoices' | 'projects' | 'expenses' | 'stock' | 'reports' | 'portal' | 'settings';

const viewTitles: Record<View, string> = {
  dashboard: 'Painel',
  orders: 'Ordens de Serviço',
  clients: 'Clientes',
  quotes: 'Orçamentos',
  invoices: 'Faturas',
  projects: 'Projetos',
  expenses: 'Despesas',
  stock: 'Estoque',
  reports: 'Relatórios',
  portal: 'Portal do Cliente',
  settings: 'Configurações',
};

const App: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States for all data models
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      const [clientsData, workOrdersData, quotesData, invoicesData, projectsData, expensesData] = await Promise.all([
        clientService.getAll(),
        workOrderService.getAll(),
        quoteService.getAll(),
        invoiceService.getAll(),
        projectService.getAll(),
        expenseService.getAll(),
      ]);

      setClients(clientsData);
      setWorkOrders(workOrdersData);
      setQuotes(quotesData);
      setInvoices(invoicesData);
      setProjects(projectsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Em caso de erro, usar dados mock como fallback
      setClients(mockClients);
      setWorkOrders(mockWorkOrders);
      setQuotes(mockQuotes);
      setInvoices(mockInvoices);
      setProjects(mockProjects);
      setExpenses(mockExpenses);
    }
  }, []);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Usar validação mais robusta
      const authenticated = validateAuth();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        try {
          await loadData();
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
          // Se falhar ao carregar dados, pode ser problema de autenticação
          authService.logout();
          setIsAuthenticated(false);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [loadData]);
  
  // Form states
  const [isWorkOrderFormOpen, setWorkOrderFormOpen] = useState(false);
  const [isClientFormOpen, setClientFormOpen] = useState(false);
  const [isQuoteFormOpen, setQuoteFormOpen] = useState(false);
  const [isInvoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [isProjectFormOpen, setProjectFormOpen] = useState(false);

  // Editing states
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Project details state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);


  const handleOpenForm = useCallback((view: View) => {
    switch(view) {
      case 'orders': setEditingWorkOrder(null); setWorkOrderFormOpen(true); break;
      case 'clients': setEditingClient(null); setClientFormOpen(true); break;
      case 'quotes': setEditingQuote(null); setQuoteFormOpen(true); break;
      case 'invoices': setEditingInvoice(null); setInvoiceFormOpen(true); break;
      case 'projects': setEditingProject(null); setProjectFormOpen(true); break;
    }
  }, []);

  const handleSaveWorkOrder = useCallback(async (order: WorkOrder) => {
    try {
      let result;
      if (order.id) {
        result = await workOrderService.update(order.id, order);
        setWorkOrders(prev => prev.map(o => o.id === order.id ? result : o));
      } else {
        result = await workOrderService.create(order);
        setWorkOrders(prev => [...prev, result]);
      }
      
      setWorkOrderFormOpen(false);
      
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error);
      alert(`Erro ao ${order.id ? 'atualizar' : 'criar'} ordem de serviço. Verifique os dados e tente novamente.`);
    }
  }, []);

  const handleSaveClient = useCallback(async (client: Client) => {
    try {
      // Validação adicional
      if (!client.name || !client.email || !client.phone || !client.address) {
        throw new Error('Todos os campos são obrigatórios: nome, email, telefone e endereço');
      }
      
      let result;
      if (client.id) {
        result = await clientService.update(client.id, client);
        setClients(prev => prev.map(c => c.id === client.id ? result : c));
      } else {
        result = await clientService.create(client);
        setClients(prev => [...prev, result]);
      }
      
      setClientFormOpen(false);
      
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = `Erro ao ${client.id ? 'atualizar' : 'criar'} cliente.`;
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          errorMessage += ' Verifique se o email é válido e não está em uso.';
        } else if (error.message.includes('required') || error.message.includes('obrigatório')) {
          errorMessage += ' Todos os campos são obrigatórios.';
        } else {
          errorMessage += ` Detalhes: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  }, []);
  
  const handleSaveQuote = useCallback(async (quote: Quote) => {
    try {
      let result;
      if (quote.id) {
        result = await quoteService.update(quote.id, quote);
        setQuotes(prev => prev.map(q => q.id === quote.id ? result : q));
      } else {
        result = await quoteService.create(quote);
        setQuotes(prev => [...prev, result]);
      }
      
      setQuoteFormOpen(false);
      
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      alert(`Erro ao ${quote.id ? 'atualizar' : 'criar'} orçamento. Verifique os dados e tente novamente.`);
    }
  }, []);

  const handleSaveInvoice = useCallback(async (invoice: Invoice) => {
    try {
      let result;
      if (invoice.id) {
        result = await invoiceService.update(invoice.id, invoice);
        setInvoices(prev => prev.map(i => i.id === invoice.id ? result : i));
      } else {
        result = await invoiceService.create(invoice);
        setInvoices(prev => [...prev, result]);
      }
      
      setInvoiceFormOpen(false);
      
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      alert(`Erro ao ${invoice.id ? 'atualizar' : 'criar'} fatura. Verifique os dados e tente novamente.`);
    }
  }, []);

  const handleSaveProject = useCallback(async (project: Project) => {
    try {
      let result;
      if (project.id) {
        result = await projectService.update(project.id, project);
        setProjects(prev => prev.map(p => p.id === project.id ? result : p));
      } else {
        result = await projectService.create(project);
        setProjects(prev => [...prev, result]);
      }
      
      setProjectFormOpen(false);
      
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      alert(`Erro ao ${project.id ? 'atualizar' : 'criar'} projeto. Verifique os dados e tente novamente.`);
    }
  }, []);


  const viewContent = useMemo(() => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard workOrders={workOrders} invoices={invoices} expenses={expenses} projects={projects} />;
      case 'orders':
        return <WorkOrderList workOrders={workOrders} clients={clients} onEdit={(order) => { setEditingWorkOrder(order); setWorkOrderFormOpen(true);}} onDelete={(id) => setWorkOrders(prev => prev.filter(o => o.id !== id))} />;
      case 'clients':
        return <ClientList clients={clients} onEdit={(client) => { setEditingClient(client); setClientFormOpen(true);}} onDelete={(id) => setClients(prev => prev.filter(c => c.id !== id))} />;
      case 'quotes':
        return <QuoteList quotes={quotes} clients={clients} onEdit={(quote) => {setEditingQuote(quote); setQuoteFormOpen(true);}} onDelete={(id) => setQuotes(prev => prev.filter(q => q.id !== id))} />;
      case 'invoices':
        return <InvoiceList invoices={invoices} clients={clients} onEdit={(invoice) => {setEditingInvoice(invoice); setInvoiceFormOpen(true);}} onDelete={(id) => setInvoices(prev => prev.filter(i => i.id !== id))} />;
      case 'projects':
        return <ProjectList 
          projects={projects} 
          clients={clients} 
          onEdit={(project) => { setEditingProject(project); setProjectFormOpen(true);}} 
          onDelete={(id) => setProjects(prev => prev.filter(p => p.id !== id))} 
          onViewDetails={(projectId) => setSelectedProjectId(projectId)}
        />;
      case 'expenses':
        return <ExpenseList expenses={expenses} />;
      case 'stock':
        return <Stock />;
      case 'reports':
        return <Reports invoices={invoices} expenses={expenses} />;
      case 'portal':
        return <ClientPortal clients={clients} invoices={invoices} quotes={quotes} projects={projects} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard workOrders={workOrders} invoices={invoices} expenses={expenses} projects={projects} />;
    }
  }, [currentView, workOrders, clients, quotes, invoices, projects, expenses]);

  const handleLogin = useCallback(async () => {
    setIsAuthenticated(true);
    await loadData();
  }, [loadData]);

  const handleLogout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const showAddButton = ['orders', 'clients', 'quotes', 'invoices', 'projects', 'expenses'].includes(currentView);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{viewTitles[currentView]}</h1>
          {showAddButton && (
             <button
                onClick={() => handleOpenForm(currentView)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Adicionar Novo</span>
              </button>
          )}
        </header>
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {viewContent}
        </div>
      </main>

      {isWorkOrderFormOpen && <WorkOrderForm workOrder={editingWorkOrder} clients={clients} onSave={handleSaveWorkOrder} onClose={() => setWorkOrderFormOpen(false)} />}
      {isClientFormOpen && <ClientForm client={editingClient} onSave={handleSaveClient} onClose={() => setClientFormOpen(false)} />}
      {isQuoteFormOpen && <QuoteForm quote={editingQuote} clients={clients} onSave={handleSaveQuote} onClose={() => setQuoteFormOpen(false)} />}
      {isInvoiceFormOpen && <InvoiceForm invoice={editingInvoice} clients={clients} onSave={handleSaveInvoice} onClose={() => setInvoiceFormOpen(false)} />}
      {isProjectFormOpen && <ProjectForm project={editingProject} quotes={quotes} clients={clients} onSave={handleSaveProject} onClose={() => setProjectFormOpen(false)} />}
      
      {/* Project Details Modal */}
      {selectedProjectId && (
        <ProjectDetails 
          projectId={selectedProjectId} 
          onClose={() => setSelectedProjectId(null)} 
        />
      )}
    </div>
  );
};

export default App;
