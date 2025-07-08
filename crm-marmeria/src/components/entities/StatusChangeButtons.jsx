import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PROJECT_STATUS_OPTIONS } from '../../utils/constants';

const StatusChangeButtons = ({ currentStatus, onStatusChange }) => {
  const currentIndex = PROJECT_STATUS_OPTIONS.indexOf(currentStatus);
  const nextStatus = PROJECT_STATUS_OPTIONS[currentIndex + 1];

  if (!nextStatus) return null; // già "Completato" o ultimo step

  return (
    <button
      onClick={() => onStatusChange(nextStatus)}
      className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md shadow"
      title={`Passa a "${nextStatus}"`}
    >
      <ArrowRight size={14} className="mr-1" />
      <span>{nextStatus}</span>
    </button>
  );
};

export default StatusChangeButtons;
