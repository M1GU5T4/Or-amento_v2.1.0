
import React from 'react';
import { WorkOrder, Status, Client } from '../types';
import { Edit, Trash2, Calendar, User, Wrench as WrenchIcon, MapPin } from 'lucide-react';

interface WorkOrderListProps {
  workOrders: WorkOrder[];
  clients: Client[];
  onEdit: (order: WorkOrder) => void;
  onDelete: (id: string) => void;
}

const statusColors: { [key in Status]: string } = {
  [Status.Pendente]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  [Status.EmAndamento]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  [Status.Concluido]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  [Status.Cancelado]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const WorkOrderCard: React.FC<{ order: WorkOrder; client: Client | undefined; onEdit: (order: WorkOrder) => void; onDelete: (id: string) => void; }> = ({ order, client, onEdit, onDelete }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{client?.name || 'Cliente não encontrado'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <MapPin size={14} /> {client?.address || 'Endereço não disponível'}
                        </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>{order.status}</span>
                </div>
                
                <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                   <div className="flex items-center gap-2">
                        <WrenchIcon size={14} className="text-blue-500" />
                        <span>{order.serviceType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-purple-500" />
                        <span>Técnico: {order.technician}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-green-500" />
                        <span>{new Date(order.scheduledDate).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">R$ {order.value.toFixed(2)}</p>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onEdit(order)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <Edit size={18} />
                        </button>
                        <button onClick={() => onDelete(order.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const WorkOrderList: React.FC<WorkOrderListProps> = ({ workOrders, clients, onEdit, onDelete }) => {
  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">Nenhuma ordem de serviço encontrada.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {workOrders.map(order => (
        <WorkOrderCard key={order.id} order={order} client={getClient(order.clientId)} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default WorkOrderList;
