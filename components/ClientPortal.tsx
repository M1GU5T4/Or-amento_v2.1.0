import React, { useState, useMemo } from 'react';
import { Client, Invoice, Quote, Project } from '../types';
import { FileText, DollarSign, Briefcase } from 'lucide-react';
import InvoiceList from './InvoiceList';
import QuoteList from './QuoteList';
import ProjectList from './ProjectList';

interface ClientPortalProps {
  clients: Client[];
  invoices: Invoice[];
  quotes: Quote[];
  projects: Project[];
}

const ClientPortal: React.FC<ClientPortalProps> = ({ clients, invoices, quotes, projects }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);

  const selectedClientData = useMemo(() => {
    if (!selectedClientId) return null;
    return {
      client: clients.find(c => c.id === selectedClientId),
      invoices: invoices.filter(i => i.clientId === selectedClientId),
      quotes: quotes.filter(q => q.clientId === selectedClientId),
      projects: projects.filter(p => p.clientId === selectedClientId),
    };
  }, [selectedClientId, clients, invoices, quotes, projects]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selecione um cliente para visualizar o portal
        </label>
        <select
          id="client-select"
          value={selectedClientId || ''}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="" disabled>Selecione...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {selectedClientData && selectedClientData.client ? (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Briefcase /> Projetos</h2>
                <ProjectList projects={selectedClientData.projects} clients={clients} />
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><FileText /> Orçamentos</h2>
                <QuoteList quotes={selectedClientData.quotes} clients={clients} onEdit={() => {}} onDelete={() => {}}/>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><DollarSign /> Faturas</h2>
                <InvoiceList invoices={selectedClientData.invoices} clients={clients} onEdit={() => {}} onDelete={() => {}}/>
            </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400">Selecione um cliente para ver seus detalhes.</p>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
