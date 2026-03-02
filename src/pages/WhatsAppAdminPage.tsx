import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import { useApp } from '../contexts/AppContext';
import { useAppColors } from '../hooks/useAppColors';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

export default function WhatsAppAdminPage() {
  const colors = useAppColors();
  const { appType } = useApp();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#ffffff';
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;

  const handleBack = () => {
    navigate(-1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4'}`} style={{ backgroundColor }}>
      <div className={`transition-all duration-300 ${isFullscreen ? 'h-screen' : 'max-w-7xl mx-auto'}`}>
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white" style={{ background: accentGradient }}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: textPrimaryColor }}>
                      Amministrazione WhatsApp
                    </h1>
                    <p style={{ color: textSecondaryColor }}>
                      Gestisci l'invio automatico dei messaggi di conferma
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="px-4 py-2 rounded-xl transition-colors duration-200 shadow-lg"
                style={{ backgroundColor: surfaceColor, color: textPrimaryColor, border: `1px solid ${accentSofter}` }}
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
