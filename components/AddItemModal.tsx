import React, { useState, useEffect } from 'react';
import { StockItem, QuoteLineItem } from '../types';
import { stockService } from '../services/api';
import { logger } from '../services/logger';
import { X, Package, Search, Plus } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<QuoteLineItem, 'id' | 'quoteId'>) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'stock' | 'custom'>('stock');
  
  // Estados para item personalizado
  const [customItem, setCustomItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadStockItems();
      // Reset form when modal opens
      setCustomItem({
        description: '',
        quantity: 1,
        unitPrice: 0,
      });
      setStockSearch('');
    }
  }, [isOpen]);

  const loadStockItems = async () => {
    try {
      setLoadingStock(true);
      logger.info('ADD_ITEM_MODAL', 'LOAD_STOCK_ITEMS_START');
      
      const items = await stockService.getItems({ search: stockSearch });
      const activeItems = items.filter((item: StockItem) => item.isActive);
      setStockItems(activeItems);
      
      logger.info('ADD_ITEM_MODAL', 'LOAD_STOCK_ITEMS_SUCCESS', { itemsCount: activeItems.length });
    } catch (error) {
      logger.error('ADD_ITEM_MODAL', 'LOAD_STOCK_ITEMS_ERROR', { search: stockSearch }, error);
      console.error('Erro ao carregar itens do estoque:', error);
    } finally {
      setLoadingStock(false);
    }
  };

  // Recarregar itens quando a busca mudar
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        loadStockItems();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [stockSearch, isOpen]);

  const handleStockItemSelect = (stockItem: StockItem, quantity: number = 1) => {
    const newItem = {
      stockItemId: stockItem.id,
      description: stockItem.name,
      quantity: quantity,
      unitPrice: stockItem.price,
      total: quantity * stockItem.price,
    };
    
    onAddItem(newItem);
    logger.info('ADD_ITEM_MODAL', 'STOCK_ITEM_ADDED', { 
      stockItemId: stockItem.id, 
      itemName: stockItem.name,
      quantity,
      price: stockItem.price 
    });
    onClose();
  };

  const handleCustomItemAdd = () => {
    if (!customItem.description.trim()) {
      alert('Por favor, preencha a descrição do item');
      return;
    }

    const newItem = {
      stockItemId: '',
      description: customItem.description,
      quantity: customItem.quantity,
      unitPrice: customItem.unitPrice,
      total: customItem.quantity * customItem.unitPrice,
    };
    
    onAddItem(newItem);
    logger.info('ADD_ITEM_MODAL', 'CUSTOM_ITEM_ADDED', { 
      description: customItem.description,
      quantity: customItem.quantity,
      unitPrice: customItem.unitPrice 
    });
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    item.description?.toLowerCase().includes(stockSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Item ao Orçamento</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab('stock')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'stock'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={16} />
              Itens do Estoque
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('custom')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'custom'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus size={16} />
              Item Personalizado
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'stock' ? (
            <div>
              {/* Busca */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar itens do estoque..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Lista de Itens */}
              {loadingStock ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 dark:text-gray-400 ml-3">Carregando itens...</p>
                </div>
              ) : filteredStockItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400 mt-4">
                    {stockSearch ? 'Nenhum item encontrado' : 'Nenhum item disponível no estoque'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStockItems.map((stockItem) => (
                    <StockItemCard
                      key={stockItem.id}
                      stockItem={stockItem}
                      onSelect={handleStockItemSelect}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Criar Item Personalizado
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição do Item
                  </label>
                  <textarea
                    value={customItem.description}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Digite a descrição do item..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      value={customItem.quantity}
                      onChange={(e) => setCustomItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preço Unitário
                    </label>
                    <input
                      type="number"
                      value={customItem.unitPrice}
                      onChange={(e) => setCustomItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total do item:</span>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      {formatCurrency(customItem.quantity * customItem.unitPrice)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCustomItemAdd}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Adicionar Item Personalizado
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para cada item do estoque
const StockItemCard: React.FC<{
  stockItem: StockItem;
  onSelect: (item: StockItem, quantity: number) => void;
  formatCurrency: (value: number) => string;
}> = ({ stockItem, onSelect, formatCurrency }) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            {stockItem.name}
          </h4>
          {stockItem.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stockItem.description}
            </p>
          )}
        </div>
        <div className="text-right ml-3">
          <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
            {formatCurrency(stockItem.price)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            por {stockItem.unit}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
          {stockItem.type.replace('_', ' ')}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Estoque: {stockItem.quantity} {stockItem.unit}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Quantidade
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
            min="0.01"
            max={stockItem.quantity}
            step="0.01"
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <button
          onClick={() => onSelect(stockItem, quantity)}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Adicionar
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Total:</span>
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {formatCurrency(quantity * stockItem.price)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;