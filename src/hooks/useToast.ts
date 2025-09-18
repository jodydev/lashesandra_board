import { toast } from 'react-toastify';
import { useAppColors } from './useAppColors';

export const useToast = () => {
  const colors = useAppColors();

  const showSuccess = (message: string) => {
    toast.success(message, {
      style: {
        backgroundColor: '#dc2a7a', // gray-800
        color: '#ffffff',
        border: '1px solid #374151', // gray-700
      }
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      style: {
        backgroundColor: '#dc2a7a', // gray-800
        color: '#ffffff',
        border: '1px solid #374151', // gray-700
      }
    });
  };

  const showWarning = (message: string) => {
    toast.warning(message, {
      style: {
        backgroundColor: '#dc2a7a', // gray-800
        color: '#ffffff',
        border: '1px solid #374151', // gray-700
      }
    });
  };

  const showInfo = (message: string) => {
    toast.info(message, {
      style: {
        backgroundColor: '#dc2a7a', // gray-800
        color: '#ffffff',
        border: '1px solid #374151', // gray-700
      }
    });
  };

  const showCustom = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const toastFunction = {
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
    }[type];

    const classNames = {
    success: { className: 'toast-success', progressClassName: 'toast-success-progress' },
      error: { className: 'toast-error', progressClassName: 'toast-error-progress' },
      info: { className: 'toast-info', progressClassName: 'toast-info-progress' },
      warning: { className: 'toast-warning', progressClassName: 'toast-warning-progress' },
    };

    toastFunction(message, {
      ...classNames[type],
      style: {
        backgroundColor: '#dc2a7a', // gray-800
        color: '#ffffff',
        border: '1px solid #374151', // gray-700
      }
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCustom,
  };
};
