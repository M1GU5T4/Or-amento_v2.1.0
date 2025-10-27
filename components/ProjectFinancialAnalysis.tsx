import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, CheckCircle, Clock, BarChart3, Loader2, Brain } from 'lucide-react';
import { Project, Expense } from '../types';
import { projectService } from '../services/api';

interface ProjectFinancialAnalysisProps {
  project: Project;
  onClose: () => void;
}

interface FinancialData {
  totalBudget: number;
  totalExpenses: number;
  remainingBudget: number;
  budgetUtilization: number;
  profitMargin: number;
  expenses: Expense[];
  expensesByCategory: { [key: string]: number };
  monthlyExpenses: { month: string; amount: number }[];
}

const ProjectFinancialAnalysis: React.FC<ProjectFinancialAnalysisProps> = ({ project, onClose }) => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para análise com IA
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, [project.id]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [expenses, projectDetails] = await Promise.all([
        projectService.getExpenses(project.id),
        projectService.getById(project.id)
      ]);

      const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
      const totalBudget = projectDetails.budget || 0;
      const remainingBudget = totalBudget - totalExpenses;
      const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
      const profitMargin = totalBudget > 0 ? ((remainingBudget / totalBudget) * 100) : 0;

      // Agrupar despesas por categoria
      const expensesByCategory = expenses.reduce((acc: any, expense: any) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});

      // Agrupar despesas por mês
      const monthlyExpenses = expenses.reduce((acc: any, expense: any) => {
        const month = new Date(expense.date).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'short' 
        });
        const existing = acc.find((item: any) => item.month === month);
        if (existing) {
          existing.amount += expense.amount;
        } else {
          acc.push({ month, amount: expense.amount });
        }
        return acc;
      }, []);

      setFinancialData({
        totalBudget,
        totalExpenses,
        remainingBudget,
        budgetUtilization,
        profitMargin,
        expenses,
        expensesByCategory,
        monthlyExpenses: monthlyExpenses.sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime())
      });
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (utilization: number) => {
    if (utilization <= 70) return 'text-green-600 bg-green-100';
    if (utilization <= 90) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (utilization: number) => {
    if (utilization <= 70) return <CheckCircle className="w-5 h-5" />;
    if (utilization <= 90) return <Clock className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  // Função para gerar análise com IA
  const handleGenerateAIAnalysis = async () => {
    try {
      setIsLoadingAI(true);
      setAiError(null);
      setAiAnalysis('');
      
      const response = await projectService.getFinancialSummary(project.id);
      setAiAnalysis(response.summary);
    } catch (err: any) {
      setAiError(err.message || 'Falha ao carregar análise. Verifique o console para mais detalhes.');
      console.error('Erro na análise IA:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando análise financeira...</p>
        </div>
      </div>
    );
  }

  if (error || !financialData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Erro ao Carregar Dados
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'Não foi possível carregar a análise financeira'}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Análise Financeira
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {project.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Orçamento Total */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Orçamento Total
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(financialData.totalBudget)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Total de Despesas */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                    Total de Despesas
                  </p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {formatCurrency(financialData.totalExpenses)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Orçamento Restante */}
            <div className={`rounded-lg p-4 ${
              financialData.remainingBudget >= 0 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    financialData.remainingBudget >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    Orçamento Restante
                  </p>
                  <p className={`text-2xl font-bold ${
                    financialData.remainingBudget >= 0 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {formatCurrency(financialData.remainingBudget)}
                  </p>
                </div>
                {financialData.remainingBudget >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>

            {/* Utilização do Orçamento */}
            <div className={`rounded-lg p-4 ${getStatusColor(financialData.budgetUtilization)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Utilização do Orçamento
                  </p>
                  <p className="text-2xl font-bold">
                    {financialData.budgetUtilization.toFixed(1)}%
                  </p>
                </div>
                {getStatusIcon(financialData.budgetUtilization)}
              </div>
            </div>
          </div>

          {/* Gráficos e Análises */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Despesas por Categoria */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Despesas por Categoria
              </h3>
              <div className="space-y-3">
                {Object.entries(financialData.expensesByCategory).map(([category, amount]) => {
                  const percentage = financialData.totalExpenses > 0 
                    ? ((amount as number) / financialData.totalExpenses) * 100 
                    : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {category}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(amount as number)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Despesas Mensais */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Despesas Mensais
              </h3>
              <div className="space-y-3">
                {financialData.monthlyExpenses.map((item, index) => {
                  const maxAmount = Math.max(...financialData.monthlyExpenses.map(m => m.amount));
                  const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {item.month}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Análise e Recomendações */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Análise e Recomendações
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status Financeiro</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {financialData.budgetUtilization <= 70 && (
                    <p className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Projeto dentro do orçamento previsto
                    </p>
                  )}
                  {financialData.budgetUtilization > 70 && financialData.budgetUtilization <= 90 && (
                    <p className="flex items-center text-yellow-600 dark:text-yellow-400">
                      <Clock className="w-4 h-4 mr-2" />
                      Atenção: Orçamento sendo utilizado rapidamente
                    </p>
                  )}
                  {financialData.budgetUtilization > 90 && (
                    <p className="flex items-center text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Alerta: Orçamento quase esgotado
                    </p>
                  )}
                  {financialData.remainingBudget < 0 && (
                    <p className="flex items-center text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Crítico: Orçamento ultrapassado
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Métricas</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Margem de Lucro: <span className="font-medium">{financialData.profitMargin.toFixed(1)}%</span></p>
                  <p>Total de Despesas: <span className="font-medium">{financialData.expenses.length}</span></p>
                  <p>Maior Categoria: <span className="font-medium">
                    {Object.entries(financialData.expensesByCategory).reduce((a, b) => 
                      (a[1] as number) > (b[1] as number) ? a : b
                    )[0]}
                  </span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Análise Financeira com IA */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Análise Financeira com IA
              </h3>
            </div>

            {!aiAnalysis && !isLoadingAI && (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Clique no botão para gerar uma análise automática da saúde financeira deste projeto usando Inteligência Artificial.
                </p>
                <button
                  onClick={handleGenerateAIAnalysis}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Gerar Análise com IA
                </button>
              </div>
            )}

            {isLoadingAI && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-4" />
                <div className="text-center">
                  <p className="text-blue-600 dark:text-blue-400 font-medium">Analisando dados financeiros...</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">A IA está processando os dados do projeto</p>
                </div>
              </div>
            )}

            {aiError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <div>
                    <p className="text-red-600 dark:text-red-400 font-medium">Erro na Análise IA</p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{aiError}</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateAIAnalysis}
                  className="mt-3 inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            {aiAnalysis && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {aiAnalysis}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleGenerateAIAnalysis}
                    disabled={isLoadingAI}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoadingAI ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4 mr-2" />
                    )}
                    {isLoadingAI ? 'Gerando...' : 'Gerar Novamente'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectFinancialAnalysis;