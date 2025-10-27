import React, { useMemo } from 'react';
import { Invoice, Expense, InvoiceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

interface ReportsProps {
  invoices: Invoice[];
  expenses: Expense[];
}

const Reports: React.FC<ReportsProps> = ({ invoices, expenses }) => {
  const financialSummary = useMemo(() => {
    const totalRevenue = invoices
      .filter(i => i.status === InvoiceStatus.Pago)
      .reduce((sum, i) => sum + i.total, 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    return { totalRevenue, totalExpenses, netProfit };
  }, [invoices, expenses]);

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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Resumo Financeiro Anual</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 text-green-500"><DollarSign size={20}/> <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Faturamento Total</h3></div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">R$ {financialSummary.totalRevenue.toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 text-red-500"><TrendingDown size={20}/> <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Despesas Totais</h3></div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">R$ {financialSummary.totalExpenses.toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 text-blue-500"><TrendingUp size={20}/> <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Lucro Líquido</h3></div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">R$ {financialSummary.netProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Desempenho Mensal</h3>
        <ResponsiveContainer width="100%" height={400}>
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
    </div>
  );
};

export default Reports;
