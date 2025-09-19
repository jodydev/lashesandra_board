import { useAppColors } from './useAppColors';

export const useToast = () => {
  const colors = useAppColors();

  // Simple console logging implementation as replacement
  const showSuccess = (message: string) => {
    console.log(`✅ Success: ${message}`);
  };

  const showError = (message: string) => {
    console.error(`❌ Error: ${message}`);
  };

  const showWarning = (message: string) => {
    console.warn(`⚠️ Warning: ${message}`);
  };

  const showInfo = (message: string) => {
    console.info(`ℹ️ Info: ${message}`);
  };

  const showCustom = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️',
    };
    
    console.log(`${icons[type]} ${type.toUpperCase()}: ${message}`);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCustom,
  };
};
