import React, { useState, useEffect } from 'react';
import { Project, ProjectExpense, ProjectNote, ProjectExpenseCategory, ProjectNoteType } from '../types';
import { projectService } from '../services/api';

// Estilos customizados para o slider
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: 3px solid #ffffff;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;
  }
  
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
  }
  
  .slider::-moz-range-thumb {
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: 3px solid #ffffff;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;
  }
  
  .slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
  }
`;

interface ProjectDetailsProps {
  projectId: string;
  onClose: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onClose }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'notes' | 'progress'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para formulários
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);

  // Estados dos formulários
  const [expenseForm, setExpenseForm] = useState({
    category: ProjectExpenseCategory.Outros,
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    receipt: '',
  });

  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    type: ProjectNoteType.Geral,
  });

  const [progressForm, setProgressForm] = useState({
    progress: 0,
  });

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, expensesData, notesData] = await Promise.all([
        projectService.getById(projectId),
        projectService.getExpenses(projectId),
        projectService.getNotes(projectId),
      ]);

      setProject(projectData);
      setExpenses(expensesData);
      setNotes(notesData);
      setProgressForm({ progress: projectData.progress || 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectService.createExpense(projectId, expenseForm);
      setShowExpenseForm(false);
      setExpenseForm({
        category: ProjectExpenseCategory.Outros,
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        receipt: '',
      });
      loadProjectData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar despesa');
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    
    try {
      await projectService.updateExpense(projectId, editingExpense.id, expenseForm);
      setEditingExpense(null);
      setShowExpenseForm(false);
      loadProjectData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar despesa');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    try {
      await projectService.deleteExpense(projectId, expenseId);
      loadProjectData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir despesa');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Criando anotação:', { projectId, noteForm });
      const result = await projectService.createNote(projectId, noteForm);
      console.log('Anotação criada com sucesso:', result);
      setShowNoteForm(false);
      setNoteForm({
        title: '',
        content: '',
        type: ProjectNoteType.Geral,
      });
      loadProjectData();
    } catch (err) {
      console.error('Erro ao criar anotação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar anotação');
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    
    try {
      await projectService.updateNote(projectId, editingNote.id, noteForm);
      setEditingNote(null);
      setShowNoteForm(false);
      loadProjectData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar anotação');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;
    
    try {
      await projectService.deleteNote(projectId, noteId);
      loadProjectData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir anotação');
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Atualizando progresso:', { projectId, progress: progressForm.progress });
      const result = await projectService.updateProgress(projectId, progressForm.progress);
      console.log('Progresso atualizado com sucesso:', result);
      loadProjectData();
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar progresso');
    }
  };

  const startEditExpense = (expense: ProjectExpense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date.split('T')[0],
      receipt: expense.receipt || '',
    });
    setShowExpenseForm(true);
  };

  const startEditNote = (note: ProjectNote) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      type: note.type,
    });
    setShowNoteForm(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCategoryLabel = (category: ProjectExpenseCategory) => {
    const labels = {
      [ProjectExpenseCategory.Almoco]: 'Almoço',
      [ProjectExpenseCategory.Deslocamento]: 'Deslocamento',
      [ProjectExpenseCategory.Material]: 'Material',
      [ProjectExpenseCategory.Outros]: 'Outros',
    };
    return labels[category];
  };

  const getNoteTypeLabel = (type: ProjectNoteType) => {
    const labels = {
      [ProjectNoteType.Geral]: 'Geral',
      [ProjectNoteType.Progresso]: 'Progresso',
      [ProjectNoteType.Problema]: 'Problema',
      [ProjectNoteType.Observacao]: 'Observação',
    };
    return labels[type];
  };

  const getTimeRemaining = () => {
    if (!project?.endDate) return null;
    
    const now = new Date();
    const endDate = new Date(project.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} dias em atraso`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Termina hoje', isOverdue: false };
    } else {
      return { text: `${diffDays} dias restantes`, isOverdue: false };
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Erro</h3>
          <p className="text-gray-600 mb-4">{error || 'Projeto não encontrado'}</p>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <p className="text-blue-100">Cliente: {project.client?.name}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="bg-blue-500 px-2 py-1 rounded text-sm">
                  {project.status.replace('_', ' ')}
                </span>
                <span className="text-blue-100">
                  Progresso: {project.progress}%
                </span>
                {timeRemaining && (
                  <span className={`px-2 py-1 rounded text-sm ${
                    timeRemaining.isOverdue ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    ⏰ {timeRemaining.text}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex">
            {[
              { key: 'overview', label: 'Visão Geral' },
              { key: 'expenses', label: `Despesas (${expenses.length})` },
              { key: 'notes', label: `Anotações (${notes.length})` },
              { key: 'progress', label: 'Progresso' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 font-medium ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações do Projeto</h3>
                  <div className="space-y-2">
                    <p><strong>Data de Início:</strong> {formatDate(project.startDate)}</p>
                    {project.endDate && (
                      <p><strong>Data de Término:</strong> {formatDate(project.endDate)}</p>
                    )}
                    {project.budget && (
                      <p><strong>Orçamento:</strong> {formatCurrency(project.budget)}</p>
                    )}
                    {project.description && (
                      <p><strong>Descrição:</strong> {project.description}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Resumo Financeiro</h3>
                  <div className="space-y-2">
                    <p><strong>Total de Despesas:</strong> {formatCurrency(project.totalExpenses || 0)}</p>
                    {project.budget && (
                      <p><strong>Saldo Restante:</strong> {formatCurrency(project.budget - (project.totalExpenses || 0))}</p>
                    )}
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Despesas por Categoria:</h4>
                      {Object.entries(
                        expenses.reduce((acc, expense) => {
                          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, amount]) => (
                        <div key={category} className="flex justify-between">
                          <span>{getCategoryLabel(category as ProjectExpenseCategory)}:</span>
                          <span>{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progresso das tarefas */}
              {project.tasks && project.tasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tarefas</h3>
                  <div className="space-y-2">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={(e) => 
                            projectService.updateTask(projectId, task.id, e.target.checked)
                              .then(() => loadProjectData())
                          }
                          className="rounded"
                        />
                        <span className={task.isCompleted ? 'line-through text-gray-500' : ''}>
                          {task.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Despesas do Projeto</h3>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + Nova Despesa
                </button>
              </div>

              {/* Lista de despesas */}
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {getCategoryLabel(expense.category)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(expense.date)}
                          </span>
                        </div>
                        <h4 className="font-medium">{expense.description}</h4>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditExpense(expense)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {expenses.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma despesa registrada ainda.
                  </p>
                )}
              </div>

              {/* Formulário de despesa */}
              {showExpenseForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                    </h3>
                    <form onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoria
                          </label>
                          <select
                            value={expenseForm.category}
                            onChange={(e) => setExpenseForm({
                              ...expenseForm,
                              category: e.target.value as ProjectExpenseCategory
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          >
                            {Object.values(ProjectExpenseCategory).map((category) => (
                              <option key={category} value={category}>
                                {getCategoryLabel(category)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                          </label>
                          <input
                            type="text"
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm({
                              ...expenseForm,
                              description: e.target.value
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({
                              ...expenseForm,
                              amount: parseFloat(e.target.value) || 0
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data
                          </label>
                          <input
                            type="date"
                            value={expenseForm.date}
                            onChange={(e) => setExpenseForm({
                              ...expenseForm,
                              date: e.target.value
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comprovante (URL)
                          </label>
                          <input
                            type="url"
                            value={expenseForm.receipt}
                            onChange={(e) => setExpenseForm({
                              ...expenseForm,
                              receipt: e.target.value
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                        >
                          {editingExpense ? 'Atualizar' : 'Criar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowExpenseForm(false);
                            setEditingExpense(null);
                          }}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Anotações da Obra</h3>
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + Nova Anotação
                </button>
              </div>

              {/* Lista de anotações */}
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {getNoteTypeLabel(note.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditNote(note)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    <h4 className="font-medium mb-2">{note.title}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}

                {notes.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma anotação registrada ainda.
                  </p>
                )}
              </div>

              {/* Formulário de anotação */}
              {showNoteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
                    </h3>
                    <form onSubmit={editingNote ? handleUpdateNote : handleCreateNote}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                          </label>
                          <select
                            value={noteForm.type}
                            onChange={(e) => setNoteForm({
                              ...noteForm,
                              type: e.target.value as ProjectNoteType
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          >
                            {Object.values(ProjectNoteType).map((type) => (
                              <option key={type} value={type}>
                                {getNoteTypeLabel(type)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título
                          </label>
                          <input
                            type="text"
                            value={noteForm.title}
                            onChange={(e) => setNoteForm({
                              ...noteForm,
                              title: e.target.value
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Conteúdo
                          </label>
                          <textarea
                            value={noteForm.content}
                            onChange={(e) => setNoteForm({
                              ...noteForm,
                              content: e.target.value
                            })}
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                        >
                          {editingNote ? 'Atualizar' : 'Criar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNoteForm(false);
                            setEditingNote(null);
                          }}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Progresso Geral</p>
                      <p className="text-3xl font-bold">{project.progress}%</p>
                    </div>
                    <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-blue-400 bg-opacity-30 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {timeRemaining && (
                  <div className={`${
                    timeRemaining.isOverdue 
                      ? 'bg-gradient-to-r from-red-500 to-red-600' 
                      : 'bg-gradient-to-r from-green-500 to-green-600'
                  } text-white p-6 rounded-xl shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${timeRemaining.isOverdue ? 'text-red-100' : 'text-green-100'} text-sm font-medium`}>
                          {timeRemaining.isOverdue ? 'Em Atraso' : 'Tempo Restante'}
                        </p>
                        <p className="text-2xl font-bold">{timeRemaining.text.replace(' dias restantes', '').replace(' dias em atraso', '').replace('Termina hoje', '0')}{timeRemaining.text.includes('hoje') ? '' : 'd'}</p>
                      </div>
                      <div className={`${
                        timeRemaining.isOverdue ? 'bg-red-400' : 'bg-green-400'
                      } bg-opacity-30 p-3 rounded-full`}>
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {project.endDate && (
                      <p className={`mt-2 text-sm ${timeRemaining.isOverdue ? 'text-red-100' : 'text-green-100'}`}>
                        Prazo: {formatDate(project.endDate)}
                      </p>
                    )}
                  </div>
                )}

                {project.tasks && project.tasks.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Tarefas Concluídas</p>
                        <p className="text-3xl font-bold">
                          {project.tasks.filter(t => t.isCompleted).length}/{project.tasks.length}
                        </p>
                      </div>
                      <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="bg-purple-400 bg-opacity-30 rounded-full h-2">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${project.taskProgress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Atualizar progresso */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Atualizar Progresso</h3>
                </div>
                
                <form onSubmit={handleUpdateProgress}>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progresso do Projeto
                        </label>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {progressForm.progress}%
                        </span>
                      </div>
                      
                      {/* Slider customizado */}
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progressForm.progress}
                          onChange={(e) => setProgressForm({
                            progress: parseInt(e.target.value)
                          })}
                          className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${progressForm.progress}%, #E5E7EB ${progressForm.progress}%, #E5E7EB 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de progresso visual */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${progressForm.progress}%` }}
                      >
                        {progressForm.progress > 10 && (
                          <span className="text-white text-xs font-medium">
                            {progressForm.progress}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status indicators */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className={`p-2 rounded-lg ${progressForm.progress >= 25 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                        <div className="text-xs font-medium">Iniciado</div>
                        <div className="text-xs">25%</div>
                      </div>
                      <div className={`p-2 rounded-lg ${progressForm.progress >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                        <div className="text-xs font-medium">Meio</div>
                        <div className="text-xs">50%</div>
                      </div>
                      <div className={`p-2 rounded-lg ${progressForm.progress >= 75 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                        <div className="text-xs font-medium">Quase</div>
                        <div className="text-xs">75%</div>
                      </div>
                      <div className={`p-2 rounded-lg ${progressForm.progress >= 100 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                        <div className="text-xs font-medium">Completo</div>
                        <div className="text-xs">100%</div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Atualizar Progresso
                      </div>
                    </button>
                  </div>
                </form>
              </div>

              {/* Progresso das tarefas */}
              {project.tasks && project.tasks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Progresso das Tarefas</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {project.tasks.map((task, index) => (
                      <div key={task.id} className="group">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={task.isCompleted}
                              onChange={(e) => 
                                projectService.updateTask(projectId, task.id, e.target.checked)
                                  .then(() => loadProjectData())
                              }
                              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            {task.isCompleted && (
                              <svg className="absolute inset-0 w-5 h-5 text-blue-600 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className={`block text-sm font-medium transition-all duration-200 ${
                              task.isCompleted 
                                ? 'line-through text-gray-500 dark:text-gray-400' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {task.name}
                            </span>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                                Tarefa #{index + 1}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                task.isCompleted 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-1 ${
                                  task.isCompleted ? 'bg-green-400' : 'bg-yellow-400'
                                }`}></div>
                                {task.isCompleted ? 'Concluída' : 'Pendente'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progresso Geral das Tarefas
                      </span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {project.taskProgress || 0}%
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${project.taskProgress || 0}%` }}
                      >
                        {(project.taskProgress || 0) > 15 && (
                          <span className="text-white text-xs font-medium">
                            {project.taskProgress || 0}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>{project.tasks.filter(t => t.isCompleted).length} concluídas</span>
                      <span>{project.tasks.filter(t => !t.isCompleted).length} pendentes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;