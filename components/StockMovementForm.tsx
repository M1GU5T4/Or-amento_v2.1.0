import React, { useState } from 'react';
import { StockItem, StockMovement, StockMovementType } from '../types';
import { stockService } from '../services/api';
import { logger } from '../services/logger';
import { X, Save, TrendingUp, TrendingDown, RotateCcw, ArrowRightLeft } from 'lucide-react';

interface StockMovementFormProps {
  item: StockItem;
  onSave: (movement: StockMovement) => void;
  onClose: () => void;
}

const StockMovementForm: React.FC<StockMovementFormProps> = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    type: StockMovementType.Entrada,
    quantity: 0,
    unitPrice: item.price,
    reason: '',
    reference: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.quantity <= 0) {
      setError('Quantidade deve ser maior que zero');
      return;
    }

    if (formData.type === StockMovementType.Saida && formData.quantity > item.quantity) {
      setError(`Quantidade insuficiente em estoque. Disponível: ${item.quantity} ${item.unit}`);
      return;
    }

    const stopTimer = logger.startTimer('STOCK', 'MOVEMENT_CREATE');
    
    try {
      setLoading(true);
      setError(null);
      
      const movementData = {
        itemId: item.id,
        ...formData,
      };

      logger.saveStart('stockMovement', 'CREATE', movementData);

      const result = await stockService.createMovement(movementData);
      
      logger.saveSuccess('stockMovement', 'CREATE', result);
      logger.info('STOCK', 'MOVEMENT_CREATED', { 
        itemId: item.id, 
        itemName: item.name,
        type: formData.type,
        quantity: formData.quantity 
      });

      onSave(result);
      onClose();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar movimentação';
      setError(errorMessage);
      logger.saveError('stockMovement', 'CREATE', formData, err);
    } finally {
      setLoading(false);
      stopTimer();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (error) setError(null);
  };

  const getMovementIcon = (type: StockMovementType) => {
    switch (type) {
      case StockMovementType.Entrada:
        return <TrendingUp className="text-green-500" size={20} />;
      case StockMovementType.Saida:
        return <TrendingDown className="text-red-500" size={20} />;
      case StockMovementType.Ajuste:
        return <RotateCcw className="text-blue-500" size={20} />;
      case StockMovementType.Transferencia:
        return <ArrowRightLeft className="text-purple-500" size={20} />;
      default:
        return <TrendingUp className="text-gray-500" size={20} />;
    }
  };

  const getMovementColor = (type: StockMovementType) => {
    switch (type) {
      case StockMovementType.Entrada:
        return 'bg-green-500';
      case StockMovementType.Saida:
        return 'bg-red-500';
      case StockMovementType.Ajuste:
        return 'bg-blue-500';
      case StockMovementType.Transferencia:
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateNewQuantity = () => {
    switch (formData.type) {
      case StockMovementType.Entrada:
        return item.quantity + formData.quantity;
      case StockMovementType.Saida:
        return item.quantity - formData.quantity;
      case StockMovementType.Ajuste:
        return formData.quantity;
      case StockMovementType.Transferencia:
        return item.quantity - formData.quantity;
      default:
        return item.quantity;
    }
  };

  const totalValue = formData.quantity * formData.unitPrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${getMovementColor(formData.type)}`}>
              {getMovementIcon(formData.type)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Movimentar Estoque
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Stock Info */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Estoque Atual:</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {item.quantity.toLocaleString('pt-BR')} {item.unit}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Preço Unitário:</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Movimentação *
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
                <option value={StockMovementType.Entrada}>Entrada</option>
                <option value={StockMovementType.Saida}>Saída</option>
                <option value={StockMovementType.Ajuste}>Ajuste</option>
                <option value={StockMovementType.Transferencia}>Transferência</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade *
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
                  required
                />
              </div>

              <div>
                <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço Unitário
                </label>
                <input
                  type="number"
                  id="unitPrice"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0,00"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo
              </label>
              <input
                type="text"
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Compra, Venda, Correção de estoque"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Referência
              </label>
              <input
                type="text"
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Ex: NF-001, OS-123"
                disabled={loading}
              />
            </div>
          </div>

          {/* Preview */}
          {formData.quantity > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Resumo da Movimentação</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Novo Estoque:</span>
                  <p className="font-semibold text-blue-900 dark:text-blue-300">
                    {calculateNewQuantity().toLocaleString('pt-BR')} {item.unit}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Valor Total:</span>
                  <p className="font-semibold text-blue-900 dark:text-blue-300">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Confirmar Movimentação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockMovementForm;