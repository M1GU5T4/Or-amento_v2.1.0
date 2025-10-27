import React, { useMemo } from 'react';
import { WorkOrder, Invoice, Expense, Project, InvoiceStatus } from '../types';
import StatCard from './StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, CheckCircle, Clock, TrendingUp, Briefcase, TrendingDown } from 'lucide-react';

interface DashboardProps {
  workOrders: WorkOrder[];
  invoices: Invoice[];
  expenses: Expense[];
  projects: Project[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard: React.FC<DashboardProps> = ({ workOrders, invoices, expenses, projects }) => {

  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter(i => i.status === InvoiceStatus.Pago)
      .reduce((sum, i) => sum + i.total, 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    const openInvoices = invoices.filter(i => i.status === InvoiceStatus.Pendente || i.status === InvoiceStatus.Atrasado).length;
    const outstandingRevenue = invoices
      .filter(i => i.status === InvoiceStatus.Pendente || i.status === InvoiceStatus.Atrasado)
      .reduce((sum, i) => sum + i.total, 0);

    const projectsInProgress = projects.filter(p => p.status === 'Em Andamento').length;
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      openInvoices,
      outstandingRevenue,
      projectsInProgress,
    };
  }, [invoices, expenses, projects]);

  const monthlyData = useMemo(() => {
    const dataByMonth: { [key: string]: { revenue: number, expenses: number } } = {};
    
    invoices.forEach(invoice => {
      if (invoice.status === InvoiceStatus.Pago) {
        const month = new Date(invoice.issueDate).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!dataByMonth[month]) dataByMonth[month] = { revenue: 0, expenses: 0 };
        dataByMonth[month].revenue += invoice.total;
      }
    });

    expenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!dataByMonth[month]) dataByMonth[month] = { revenue: 0, expenses: 0 };
      dataByMonth[month].expenses += expense.amount;
    });

    return Object.entries(dataByMonth)
        .map(([name, values]) => ({ name, Faturamento: values.revenue, Despesas: values.expenses }))
        .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [invoices, expenses]);
  
  const projectStatusData = useMemo(() => {
    const countByStatus: { [key: string]: number } = {};
    projects.forEach(project => {
      if (!countByStatus[project.status]) {
        countByStatus[project.status] = 0;
      }
      countByStatus[project.status]++;
    });

    return Object.entries(countByStatus).map(([name, value]) => ({ name, value }));
  }, [projects]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Faturamento Total" 
          value={`R$ ${stats.totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="h-8 w-8 text-green-500" />} 
        />
        <StatCard 
          title="Despesas Totais" 
          value={`R$ ${stats.totalExpenses.toFixed(2)}`}
          icon={<TrendingDown className="h-8 w-8 text-red-500" />} 
        />
        <StatCard 
          title="Lucro Líquido" 
          value={`R$ ${stats.netProfit.toFixed(2)}`}
          icon={<TrendingUp className="h-8 w-8 text-blue-500" />} 
        />
        <StatCard 
          title="Pendente Receber" 
          value={`R$ ${stats.outstandingRevenue.toFixed(2)}`}
          icon={<Clock className="h-8 w-8 text-yellow-500" />} 
        />
         <StatCard 
          title="Faturas Abertas" 
          value={stats.openInvoices.toString()}
          icon={<CheckCircle className="h-8 w-8 text-indigo-500" />} 
        />
        <StatCard 
          title="Projetos em Andamento" 
          value={stats.projectsInProgress.toString()} 
          icon={<Briefcase className="h-8 w-8 text-purple-500" />} 
        />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Receita vs. Despesas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `R$${value}`} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(31, 41, 55, 0.8)', 
                  borderColor: 'rgba(55, 65, 81, 1)',
                  color: '#ffffff'
                }}
                cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="Faturamento" fill="#3b82f6" name="Faturamento" />
              <Bar dataKey="Despesas" fill="#ef4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Status dos Projetos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(31, 41, 55, 0.8)', 
                  borderColor: 'rgba(55, 65, 81, 1)',
                  color: '#ffffff'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
