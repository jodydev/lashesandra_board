import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import { useAppColors } from '../hooks/useAppColors';

export default function WhatsAppAdminPage() {
  const colors = useAppColors();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`transition-all duration-300 ${
        isFullscreen ? 'h-screen' : 'max-w-7xl mx-auto'
      }`}>
        {/* Header */}
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">                
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colors.bgGradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Amministrazione WhatsApp
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Gestisci l'invio automatico dei messaggi di conferma
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg"
              >
                {isFullscreen ? 'Riduci' : 'Schermo Intero'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Admin Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`transition-all duration-300 ${
            isFullscreen ? 'h-full' : 'h-[calc(100vh-8rem)]'
          }`}
        >
          <AdminPanel onClose={isFullscreen ? toggleFullscreen : undefined} />
        </motion.div>
      </div>
    </div>
  );
}
