import React from 'react';
import { useToast } from '../hooks/useToast';
import { useAppColors } from '../hooks/useAppColors';
import { FiCheck, FiX, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const ToastDemo: React.FC = () => {
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const colors = useAppColors();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Demo Notifiche Toast
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Testa le Notifiche
              </h2>
              
              <button
                onClick={() => showSuccess('Operazione completata con successo!')}
                className={`w-full flex items-center justify-center px-6 py-3 ${colors.bgGradient} text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg ${colors.shadowPrimary}`}
              >
                <FiCheck className="w-5 h-5 mr-2" />
                Notifica di Successo
              </button>
              
              <button
                onClick={() => showError('Si è verificato un errore durante l\'operazione')}
                className="w-full flex items-center justify-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
              >
                <FiX className="w-5 h-5 mr-2" />
                Notifica di Errore
              </button>
              
              <button
                className={`w-full flex items-center justify-center px-6 py-3 ${colors.bgGradient} text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg ${colors.shadowPrimary}`}
              >
                <FiInfo className="w-5 h-5 mr-2" />
                Notifica Informativa
              </button>
              
              <button
                onClick={() => showWarning('Attenzione: questa azione potrebbe avere conseguenze')}
                className="w-full flex items-center justify-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-yellow-500/25"
              >
                <FiAlertTriangle className="w-5 h-5 mr-2" />
                Notifica di Avviso
              </button>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Caratteristiche
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className={`w-3 h-3 ${colors.bgPrimary} rounded-full mr-3`}></div>
                  <span>Colori personalizzati della tua palette</span>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span>Supporto per light/dark mode</span>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span>Animazioni fluide e moderne</span>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span>Design consistente con l'app</span>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span>Progress bar personalizzata</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastDemo;
