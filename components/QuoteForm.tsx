import React, { useState, useEffect, useMemo } from 'react';
import { Quote, Client, QuoteStatus, StockItem, QuoteLineItem } from '../types';
import { stockService } from '../services/api';
import { logger } from '../services/logger';
import { X, Plus, Trash2, Package, Search, FileText } from 'lucide-react';
import AddItemModal from './AddItemModal';

interface QuoteFormProps {
  quote: Quote | null;
  clients: Client[];
  onSave: (quote: Quote) => void;
  onClose: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, clients, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Quote, 'id' | 'subtotal' | 'tax' | 'total'> & { id?: string }>({
    quoteNumber: `ORC-2024-00${Math.floor(Math.random() * 100)}`,
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    lineItems: [],
    status: QuoteStatus.Rascunho,
    notes: '', // Campo para observações
  });

  // Estados para modal de adicionar item
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  useEffect(() => {
    if (quote) {
      const { subtotal, tax, total, ...rest } = quote;
      setFormData(rest);
    }
  }, [quote]);

  const handleAddItem = (newItem: Omit<QuoteLineItem, 'id' | 'quoteId'>) => {
    const itemWithId = {
      ...newItem,
      id: new Date().toISOString() + Math.random(),
    };
    
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, itemWithId]
    }));
    
    logger.info('QUOTE', 'ITEM_ADDED_VIA_MODAL', { 
      description: newItem.description,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      hasStockItem: !!newItem.stockItemId
    });
  };

  const totals = useMemo(() => {
    const subtotal = formData.lineItems.reduce((acc, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return acc + itemTotal;
    }, 0);
    const tax = subtotal * 0.0; // Assume 0% tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [formData.lineItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLineItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newLineItems = [...formData.lineItems];
    const updatedItem = { 
      ...newLineItems[index], 
      [name]: name === 'description' ? value : parseFloat(value) || 0 
    };
    
    // Calcular total do item
    updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
    
    newLineItems[index] = updatedItem;
    setFormData(prev => ({ ...prev, lineItems: newLineItems }));
  };



  const removeLineItem = (index: number) => {
    const newLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, lineItems: newLineItems }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se há pelo menos um item
    if (formData.lineItems.length === 0) {
      alert('Adicione pelo menos um item ao orçamento');
      return;
    }
    
    // Validar se todos os itens têm descrição
    const hasEmptyItems = formData.lineItems.some(item => !item.description.trim());
    if (hasEmptyItems) {
      alert('Todos os itens devem ter uma descrição');
      return;
    }
    
    logger.info('QUOTE', 'SUBMIT', { 
      itemsCount: formData.lineItems.length,
      total: totals.total,
      hasStockItems: formData.lineItems.some(item => item.stockItemId),
      hasNotes: !!formData.notes
    });
    
    onSave({ ...formData, ...totals } as Quote);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{quote ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
              <select name="clientId" id="clientId" value={formData.clientId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Selecione um cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select name="status" id="status" value={formData.status} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Emissão</label>
              <input type="date" name="issueDate" id="issueDate" value={formData.issueDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Validade</label>
              <input type="date" name="expiryDate" id="expiryDate" value={formData.expiryDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>

          {/* Campo de Observações */}
          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                Observações (Opcional)
              </div>
            </label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Adicione observações, condições especiais, prazos ou outras informações relevantes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-vertical"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Estas observações aparecerão no orçamento final
            </p>
          </div>
          
          <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Itens do Orçamento</h3>
              <button 
                type="button" 
                onClick={() => setShowAddItemModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={16}/> Adicionar Item
              </button>
            </div>

            {formData.lineItems.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400 mt-4">
                  Nenhum item adicionado ainda
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Clique em "Adicionar Item" para começar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.lineItems.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      {/* Descrição do Item */}
                      <div className="col-span-6">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Descrição
                        </label>
                        <input 
                          type="text" 
                          name="description" 
                          placeholder="Descrição do item" 
                          value={item.description} 
                          onChange={(e) => handleLineItemChange(index, e)} 
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        
                        {/* Mostrar se é item do estoque */}
                        {item.stockItemId && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <Package size={12} className="text-blue-600" />
                              <span className="text-blue-800 dark:text-blue-300">
                                Item do estoque
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quantidade */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Quantidade
                        </label>
                        <input 
                          type="number" 
                          name="quantity" 
                          placeholder="Qtd" 
                          value={item.quantity} 
                          onChange={(e) => handleLineItemChange(index, e)} 
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>

                      {/* Preço Unitário */}
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Preço Unitário
                        </label>
                        <input 
                          type="number" 
                          name="unitPrice" 
                          placeholder="0,00" 
                          value={item.unitPrice} 
                          onChange={(e) => handleLineItemChange(index, e)} 
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>

                      {/* Remover Item */}
                      <div className="col-span-1 flex items-end">
                        <button 
                          type="button" 
                          onClick={() => removeLineItem(index)} 
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remover item"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>

                    {/* Total do Item */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Total do item:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Resumo dos Totais */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Resumo do Orçamento</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Impostos:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={onClose} 
              type="button" 
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Salvar Orçamento
            </button>
          </div>
        </form>

        {/* Modal para Adicionar Item */}
        <AddItemModal
          isOpen={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
          onAddItem={handleAddItem}
        />
      </div>
    </div>
  );
};

export default QuoteForm;
