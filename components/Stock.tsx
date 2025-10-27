import React, { useState, useEffect } from 'react';
import { StockItem, StockCategory, StockItemType, StockMovement } from '../types';
import { stockService } from '../services/api';
import { logger } from '../services/logger';
import StockCategoryForm from './StockCategoryForm';
import StockItemForm from './StockItemForm';
import StockMovementForm from './StockMovementForm';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Wrench,
  Ruler,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const Stock: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    type: '',
    lowStock: false,
  });

  // Estados dos modais
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StockCategory | null>(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      logger.info('STOCK', 'LOAD_DATA_START', { filters });

      const [itemsData, categoriesData] = await Promise.all([
        stockService.getItems(filters),
        stockService.getCategories(),
      ]);

      setItems(itemsData);
      setCategories(categoriesData);
      logger.info('STOCK', 'LOAD_DATA_SUCCESS', { 
        itemsCount: itemsData.length, 
        categoriesCount: categoriesData.length 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estoque';
      setError(errorMessage);
      logger.error('STOCK', 'LOAD_DATA_ERROR', { filters }, err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: StockItemType) => {
    switch (type) {
      case StockItemType.Produto:
        return <Package size={16} className="text-blue-500" />;
      case StockItemType.MaoDeObra:
        return <Wrench size={16} className="text-green-500" />;
      case StockItemType.Metro:
        return <Ruler size={16} className="text-purple-500" />;
      default:
        return <Package size={16} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type: StockItemType) => {
    switch (type) {
      case StockItemType.Produto:
        return 'Produto';
      case StockItemType.MaoDeObra:
        return 'Mão de Obra';
      case StockItemType.Metro:
        return 'Por Metro';
      default:
        return type;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity.toLocaleString('pt-BR')} ${unit}`;
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
  };

  const handleSaveCategory = (category: StockCategory) => {
    if (selectedCategory) {
      // Atualizar categoria existente
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
    } else {
      // Adicionar nova categoria
      setCategories(prev => [...prev, category]);
    }
    // Recarregar dados para atualizar contadores
    loadData();
  };

  const handleSaveItem = (item: StockItem) => {
    if (selectedItem) {
      // Atualizar item existente
      setItems(prev => prev.map(i => i.id === item.id ? { ...item, totalValue: item.quantity * item.price, isLowStock: item.minStock ? item.quantity <= item.minStock : false } : i));
    } else {
      // Adicionar novo item
      const itemWithCalculations = {
        ...item,
        totalValue: item.quantity * item.price,
        isLowStock: item.minStock ? item.quantity <= item.minStock : false,
      };
      setItems(prev => [...prev, itemWithCalculations]);
    }
    // Recarregar dados para atualizar contadores
    loadData();
  };

  const handleSaveMovement = (movement: StockMovement) => {
    // Recarregar dados para refletir a nova quantidade
    loadData();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      await stockService.deleteItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      logger.info('STOCK', 'ITEM_DELETED', { itemId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir item';
      setError(errorMessage);
      logger.error('STOCK', 'ITEM_DELETE_ERROR', { itemId }, err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
      await stockService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      logger.info('STOCK', 'CATEGORY_DELETED', { categoryId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir categoria';
      setError(errorMessage);
      logger.error('STOCK', 'CATEGORY_DELETE_ERROR', { categoryId }, err);
    }
  };

  // Estatísticas
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  const lowStockItems = items.filter(item => item.isLowStock).length;
  const activeItems = items.filter(item => item.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Carregando estoque...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="text-red-500 mr-2" size={20} />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
        <button
          onClick={loadData}
          className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-600">Gerencie produtos, mão de obra e materiais por metro</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowCategoryForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            <Plus size={16} />
            Nova Categoria
          </button>
          <button
            onClick={() => {
              setSelectedItem(null);
              setShowItemForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            <Plus size={16} />
            Novo Item
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total de Itens</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <Package className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalValue)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Estoque Baixo</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStockItems}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-full">
              <AlertTriangle className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Itens Ativos</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeItems}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar itens..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as categorias</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os tipos</option>
            <option value="PRODUTO">Produtos</option>
            <option value="MAO_DE_OBRA">Mão de Obra</option>
            <option value="METRO">Por Metro</option>
          </select>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Apenas estoque baixo</span>
          </label>
          
          <button
            onClick={() => setFilters({ search: '', categoryId: '', type: '', lowStock: false })}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <Filter size={16} />
            Limpar
          </button>
        </div>
      </div>

      {/* Categorias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categorias</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gerencie as categorias de itens</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryForm(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                      title="Editar categoria"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                      title="Excluir categoria"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{category.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {category._count?.items || 0} itens
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, categoryId: category.id })}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Ver itens
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma categoria encontrada</p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowCategoryForm(true);
                  }}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Criar primeira categoria
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Preço Unit.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>Nenhum item encontrado</p>
                    <p className="text-sm">Adicione itens ao estoque ou ajuste os filtros</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(item.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {getCategoryName(item.categoryId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatQuantity(item.quantity, item.unit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatCurrency(item.totalValue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {item.isLowStock && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            <AlertTriangle size={12} className="mr-1" />
                            Estoque Baixo
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {item.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowItemForm(true);
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowMovementForm(true);
                          }}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                          title="Movimentar estoque"
                        >
                          <TrendingUp size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Excluir item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      {showCategoryForm && (
        <StockCategoryForm
          category={selectedCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setShowCategoryForm(false);
            setSelectedCategory(null);
          }}
        />
      )}

      {showItemForm && (
        <StockItemForm
          item={selectedItem}
          categories={categories}
          onSave={handleSaveItem}
          onClose={() => {
            setShowItemForm(false);
            setSelectedItem(null);
          }}
        />
      )}

      {showMovementForm && selectedItem && (
        <StockMovementForm
          item={selectedItem}
          onSave={handleSaveMovement}
          onClose={() => {
            setShowMovementForm(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

export default Stock;