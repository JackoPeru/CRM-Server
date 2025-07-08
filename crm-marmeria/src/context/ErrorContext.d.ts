import React, { ReactNode } from 'react';

type ErrorType = 'general' | 'permission' | 'network' | 'validation';

interface ErrorData {
  id?: string;
  type?: ErrorType;
  message: string;
  retryAction?: () => void;
  autoClose?: boolean;
  timeout?: number;
}

interface ErrorContextType {
  errors: ErrorData[];
  addError: (error: ErrorData) => string;
  removeError: (errorId: string) => void;
  clearAllErrors: () => void;
  handlePermissionError: (message: string) => void;
  handleNetworkError: (message: string) => void;
}

export const ErrorProvider: React.FC<{ children: ReactNode }>;
export const useError: () => ErrorContextType;
export default React.Context<ErrorContextType | undefined>;