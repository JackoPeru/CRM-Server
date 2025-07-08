import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { PROJECT_STATUS_OPTIONS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const ProjectStatusButtons = ({ currentStatus, onStatusChange }) => {
  const { hasRole } = useAuth();
  const isWorker = hasRole('worker');
  
  const currentIndex = PROJECT_STATUS_OPTIONS.indexOf(currentStatus);
  const nextStatus = PROJECT_STATUS_OPTIONS[currentIndex + 1];
  const previousStatus = PROJECT_STATUS_OPTIONS[currentIndex - 1];

  return (
    <div className="flex items-center gap-2">
      {/* Bottone per tornare indietro (solo per operai) */}
      {isWorker && previousStatus && (
        <button
          onClick={() => onStatusChange(previousStatus)}
          className="flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-md shadow"
          title={`Torna a "${previousStatus}"`}
        >
          <ArrowLeft size={14} className="mr-1" />
          <span>{previousStatus}</span>
        </button>
      )}
      
      {/* Bottone per avanzare (per tutti) */}
      {nextStatus && (
        <button
          onClick={() => onStatusChange(nextStatus)}
          className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md shadow"
          title={`Passa a "${nextStatus}"`}
        >
          <ArrowRight size={14} className="mr-1" />
          <span>{nextStatus}</span>
        </button>
      )}
    </div>
  );
};

export default ProjectStatusButtons;