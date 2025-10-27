import React from 'react';
import { LayoutDashboard, ListChecks, Wrench, Users, FileText, Briefcase, DollarSign, Package, BarChart2, UserCheck, Settings, LogOut } from 'lucide-react';
import { View } from '../App';
import { authService } from '../services/api';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout }) => {
  const currentUser = authService.getCurrentUser();
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'orders', label: 'Ordens de Serviço', icon: ListChecks },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'quotes', label: 'Orçamentos', icon: FileText },
    { id: 'invoices', label: 'Faturas', icon: DollarSign },
    { id: 'projects', label: 'Projetos', icon: Briefcase },
    { id: 'expenses', label: 'Despesas', icon: Wrench },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: BarChart2 },
    { id: 'portal', label: 'Portal do Cliente', icon: UserCheck },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300">
      <div className="flex items-center justify-center md:justify-start md:pl-6 h-16 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
            <Wrench className="h-8 w-8 text-blue-600" />
            <span className="hidden md:inline text-xl font-bold text-gray-900 dark:text-white">Serviços</span>
        </div>
      </div>
      <nav className="flex-1 px-2 md:px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as View)}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors duration-200 text-left ${
              currentView === item.id
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="hidden md:inline font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* User info and logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="hidden md:block mb-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentUser?.name || 'Usuário'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {currentUser?.email || ''}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="hidden md:inline font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
