import React, { useState, useEffect } from 'react';
import { Expense, Project, ProjectExpense, ProjectExpenseCategory } from '../types';
import { Tag, Calendar, DollarSign, Edit, Trash2, Plus, Filter, Search, Building, Receipt } from 'lucide-react';
import { expenseService, projectService } from '../services/api';

interface ExpenseListProps {
  expenses: Expense[];
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses: initialExpenses }) => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [projectExpenses, setProjectExpenses] = useState<(ProjectExpense & { project: { name: string } })[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Estados do formulário
  const [expenseForm, setExpenseForm] = useState({
    projectId: '',
    category: ProjectExpenseCategory.Outros,
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    receipt: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, expensesData] = await Promise.all([
        projectService.getAll(),
        expenseService.getAll()
      ]);
      
      setProjects(projectsData);
      setExpenses(expensesData);
      
      // Carregar despesas de todos os projetos
      const allProjectExpenses = [];
      for (const project of projectsData) {
        try {
          const projectExpensesData = await projectService.getExpenses(project.id);
          const expensesWithProject = projectExpensesData.map((expense: ProjectExpense) => ({
            ...expense,
            project: { name: project.name }
          }));
          allProjectExpenses.push(...expensesWithProject);
        } catch (error) {
          console.error(`Erro ao carregar despesas do projeto ${project.name}:`, error);
        }
      }
      
      setProjectExpenses(allProjectExpenses);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (expenseForm.projectId) {
        // Adicionar despesa ao projeto
        await projectService.createExpense(expenseForm.projectId, {
          category: expenseForm.category,
          description: expenseForm.description,
          amount: expenseForm.amount,
          date: expenseForm.date,
          receipt: expenseForm.receipt,
        });
      } else {
        // Adicionar despesa geral
        await expenseService.create({
          description: expenseForm.description,
          amount: expenseForm.amount,
          date: expenseForm.date,
          category: expenseForm.category,
        });
      }
      
      setShowAddForm(false);
      setExpenseForm({
        projectId: '',
        category: ProjectExpenseCategory.Outros,
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        receipt: '',
      });
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string, isProjectExpense: boolean) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    try {
      if (isProjectExpense) {
        // Encontrar o projeto da despesa
        const expense = projectExpenses.find(e => e.id === expenseId);
        if (expense) {
          const project = projects.find(p => p.name === expense.project.name);
          if (project) {
            await projectService.deleteExpense(project.id, expenseId);
          }
        }
      } else {
        await expenseService.delete(expenseId);
      }
      loadData();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      [ProjectExpenseCategory.Almoco]: 'Almoço',
      [ProjectExpenseCategory.Deslocamento]: 'Deslocamento',
      [ProjectExpenseCategory.Material]: 'Material',
      [ProjectExpenseCategory.Outros]: 'Outros',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      [ProjectExpenseCategory.Almoco]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [ProjectExpenseCategory.Deslocamento]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [ProjectExpenseCategory.Material]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [ProjectExpenseCategory.Outros]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // Combinar e filtrar despesas
  const allExpenses = [
    ...expenses.map(expense => ({ ...expense, isProjectExpense: false, project: null })),
    ...projectExpenses.map(expense => ({ ...expense, isProjectExpense: true }))
  ];

  const filteredExpenses = allExpenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.project?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    const matchesDate = !dateFilter || expense.date.startsWith(dateFilter);
    const matchesProject = !selectedProject || 
                          (expense.isProjectExpense && expense.project?.name === selectedProject) ||
                          (!expense.isProjectExpense && selectedProject === 'general');
    
    return matchesSearch && matchesCategory && matchesDate && matchesProject;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando despesas...</span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Despesas</h2>
            <p className="text-gray-600 dark:text-gray-400">Gerencie todas as despesas dos projetos</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Nova Despesa</span>
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Filtrado</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  R$ {totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total de Despesas</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {filteredExpenses.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Projetos</p>
                <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Categorias</p>
                <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                  {Object.keys(ProjectExpenseCategory).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search size={16} className="inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição ou projeto..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building size={16} className="inline mr-1" />
              Projeto
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos os projetos</option>
              <option value="general">Despesas gerais</option>
              {projects.map(project => (
                <option key={project.id} value={project.name}>{project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter size={16} className="inline mr-1" />
              Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todas as categorias</option>
              {Object.values(ProjectExpenseCategory).map(category => (
                <option key={category} value={category}>{getCategoryLabel(category)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Mês
            </label>
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Lista de despesas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhuma despesa encontrada</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || categoryFilter || dateFilter || selectedProject
                ? 'Tente ajustar os filtros para ver mais resultados.'
                : 'Comece adicionando uma nova despesa.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.map(expense => (
                  <tr key={`${expense.id}-${expense.isProjectExpense}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </div>
                      {(expense as any).receipt && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          <Receipt size={12} className="inline mr-1" />
                          Comprovante anexado
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {expense.project?.name || (
                          <span className="text-gray-500 dark:text-gray-400 italic">Despesa geral</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                        {getCategoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      R$ {expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDeleteExpense(expense.id, expense.isProjectExpense)}
                          className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Excluir despesa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de adicionar despesa */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nova Despesa</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Projeto (opcional)
                </label>
                <select
                  value={expenseForm.projectId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Despesa geral</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ProjectExpenseCategory })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  {Object.values(ProjectExpenseCategory).map(category => (
                    <option key={category} value={category}>{getCategoryLabel(category)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comprovante (URL - opcional)
                </label>
                <input
                  type="url"
                  value={expenseForm.receipt}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receipt: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Adicionar Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
