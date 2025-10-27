// Utilitário para preload de componentes críticos
export const preloadComponent = (componentImport: () => Promise<any>) => {
  // Preload apenas em produção e quando o navegador está idle
  if (process.env.NODE_ENV === 'production' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      componentImport();
    });
  }
};

// Preload dos componentes mais utilizados
export const preloadCriticalComponents = () => {
  // Dashboard é sempre o primeiro a ser carregado
  preloadComponent(() => import('../components/Dashboard'));
  
  // Componentes de navegação frequente
  preloadComponent(() => import('../components/ClientList'));
  preloadComponent(() => import('../components/ProjectList'));
  preloadComponent(() => import('../components/QuoteList'));
  
  // Formulários mais utilizados
  preloadComponent(() => import('../components/ClientForm'));
  preloadComponent(() => import('../components/ProjectForm'));
};

// Preload baseado na rota atual
export const preloadRouteComponents = (currentView: string) => {
  switch (currentView) {
    case 'clients':
      preloadComponent(() => import('../components/ClientForm'));
      break;
    case 'projects':
      preloadComponent(() => import('../components/ProjectForm'));
      preloadComponent(() => import('../components/ProjectDetails'));
      break;
    case 'quotes':
      preloadComponent(() => import('../components/QuoteForm'));
      break;
    case 'invoices':
      preloadComponent(() => import('../components/InvoiceForm'));
      break;
    case 'orders':
      preloadComponent(() => import('../components/WorkOrderForm'));
      break;
    case 'stock':
      preloadComponent(() => import('../components/StockItemForm'));
      preloadComponent(() => import('../components/AddItemModal'));
      break;
  }
};