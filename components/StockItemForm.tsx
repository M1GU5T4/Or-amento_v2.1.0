import React, { useState, useEffect } from 'react';
import { StockItem, StockCategory, StockItemType } from '../types';
import { stockService } from '../services/api';
import { logger } from '../services/logger';
import { X, Save, Package, Wrench, Ruler } from 'lucide-react';

interface StockItemFormProps {
  item?: StockItem | null;
  categories: StockCategory[];
  onSave: (item: StockItem) => void;
  onClose: () => void;
}

const StockItemForm: React.FC<StockItemFormProps> = ({ item, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    type: StockItemType.Produto,
    unit: 'UN',
    price: 0,
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    barcode: '',
    supplier: '',
    location: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        categoryId: item.categoryId,
        type: item.type,
        unit: item.unit,
        price: item.price,
        quantity: item.quantity,
        minStock: item.minStock || 0,
        maxStock: item.maxStock || 0,
        barcode: item.barcode || '',
        supplier: item.supplier || '',
        location: item.location || '',
        isActive: item.isActive,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome do item é obrigatório');
      return;
    }

    if (!formData.categoryId) {
      setError('Categoria é obrigatória');
      return;
    }

    if (formData.price <= 0) {
      setError('Preço deve ser maior que zero');
      return;
    }

    const operation = item ? 'UPDATE' : 'CREATE';
    const stopTimer = logger.startTimer('STOCK', `ITEM_${operation}`);
    
    try {
      setLoading(true);
      setError(null);
      
      logger.saveStart('stockItem', operation, formData);

      let result;
      if (item) {
        result = await stockService.updateItem(item.id, formData);
        logger.info('STOCK', 'ITEM_UPDATED', { itemId: item.id, name: formData.name });
      } else {
        result = await stockService.createItem(formData);
        logger.info('STOCK', 'ITEM_CREATED', { name: formData.name, type: formData.type });
      }

      logger.saveSuccess('stockItem', operation, result);
      onSave(result);
      onClose();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar item';
      setError(errorMessage);
      logger.saveError('stockItem', operation, formData, err);
    } finally {
      setLoading(false);
      stopTimer();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
               type === 'number' ? parseFloat(value) || 0 :
               value
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (error) setError(null);
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

  const getUnitsForType = (type: StockItemType) => {
    switch (type) {
      case StockItemType.Produto:
        return ['UN', 'KG', 'LITRO', 'CAIXA', 'PACOTE', 'METRO'];
      case StockItemType.MaoDeObra:
        return ['HORA', 'DIA', 'SERVICO'];
      case StockItemType.Metro:
        return ['METRO', 'METRO²', 'METRO³'];
      default:
        return ['UN'];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-full">
              {getTypeIcon(formData.type)}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {item ? 'Editar Item' : 'Novo Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informações Básicas</h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Fio Flexível 2,5mm²"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Descrição detalhada do item"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                  required
                >
                  <option value={StockItemType.Produto}>Produto</option>
                  <option value={StockItemType.MaoDeObra}>Mão de Obra</option>
                  <option value={StockItemType.Metro}>Por Metro</option>
                </select>
              </div>
            </div>

            {/* Preço e Estoque */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preço e Estoque</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preço Unitário *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0,00"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unidade *
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                    required
                  >
                    {getUnitsForType(formData.type).map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade Inicial
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    id="minStock"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="maxStock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estoque Máximo
                  </label>
                  <input
                    type="number"
                    id="maxStock"
                    name="maxStock"
                    value={formData.maxStock}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informações Adicionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código de Barras
                </label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: 7891234567890"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Prysmian"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Prateleira A1"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Item ativo
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{item ? 'Atualizar' : 'Criar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockItemForm;