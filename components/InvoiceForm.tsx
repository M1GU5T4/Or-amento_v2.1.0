import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, Client, LineItem, InvoiceStatus } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface InvoiceFormProps {
  invoice: Invoice | null;
  clients: Client[];
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, clients, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Invoice, 'id' | 'subtotal' | 'tax' | 'total'> & { id?: string }>({
    invoiceNumber: `FAT-2024-00${Math.floor(Math.random() * 100)}`,
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    lineItems: [{ id: new Date().toISOString(), description: '', quantity: 1, unitPrice: 0 }],
    amountPaid: 0,
    status: InvoiceStatus.Rascunho,
  });

  useEffect(() => {
    if (invoice) {
      const { subtotal, tax, total, ...rest } = invoice;
      setFormData(rest);
    }
  }, [invoice]);

  const totals = useMemo(() => {
    const subtotal = formData.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.0; // Assume 0% tax for now
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [formData.lineItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLineItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [name]: name === 'description' ? value : parseFloat(value) || 0 };
    setFormData(prev => ({ ...prev, lineItems: newLineItems }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
        ...prev,
        lineItems: [...prev.lineItems, { id: new Date().toISOString(), description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeLineItem = (index: number) => {
    const newLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, lineItems: newLineItems }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, ...totals } as Invoice);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{invoice ? 'Editar Fatura' : 'Nova Fatura'}</h2>
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
                {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Emissão</label>
              <input type="date" name="issueDate" id="issueDate" value={formData.issueDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Vencimento</label>
              <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Itens da Fatura</h3>
            <div className="space-y-3">
              {formData.lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" name="description" placeholder="Descrição" value={item.description} onChange={(e) => handleLineItemChange(index, e)} className="col-span-6 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="number" name="quantity" placeholder="Qtd" value={item.quantity} onChange={(e) => handleLineItemChange(index, e)} className="col-span-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="number" name="unitPrice" placeholder="Preço" value={item.unitPrice} onChange={(e) => handleLineItemChange(index, e)} className="col-span-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <button type="button" onClick={() => removeLineItem(index)} className="col-span-1 p-2 text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLineItem} className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"><Plus size={16}/> Adicionar Item</button>
          </div>

          <div className="flex justify-between items-center p-5 mt-auto border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
            <div className="text-lg font-bold">
                Total: <span className="text-blue-600 dark:text-blue-400">R$ {totals.total.toFixed(2)}</span>
            </div>
            <div>
                <button onClick={onClose} type="button" className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 mr-3 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors">Salvar Fatura</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
