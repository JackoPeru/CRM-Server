import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Icon from '../common/Icon';
import { PROJECT_STATUS_OPTIONS } from '../../utils/constants';

const StatusChangeButtons = ({ currentStatus, onChange }) => {
  const currentIndex = PROJECT_STATUS_OPTIONS.indexOf(currentStatus);
  const nextStatus = PROJECT_STATUS_OPTIONS[currentIndex + 1];

  if (!nextStatus) return null; // già “Completato” o ultimo step

  return (
    <button
      onClick={() => onChange(nextStatus)}
      className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md shadow"
      title={`Passa a "${nextStatus}"`}
    >
      <Icon name={ArrowRight} size={14} className="mr-1" />
      <span>{nextStatus}</span>
    </button>
  );
};

export default StatusChangeButtons;
