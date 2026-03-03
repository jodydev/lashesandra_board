import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertCircle, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAppointmentNotifications } from '../hooks/useAppointmentNotifications';
import { useAppColors } from '../hooks/useAppColors';

export default function FloatingNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { notifications } = useAppointmentNotifications();
  const { appType } = useApp();
  const colors = useAppColors();
  const navigate = useNavigate();

  useEffect(() => {
    // Mostra la notifica solo se ci sono appuntamenti urgenti (oggi o domani)
    if (notifications.urgentCount > 0 && !dismissed) {
      setIsVisible(true);
      
      // Auto-dismiss dopo 5 secondi
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notifications.urgentCount, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
  };

  const handleClick = () => {
    const appPrefix = appType === 'isabellenails' ? '/isabellenails' : '/lashesandra';
    navigate(`${appPrefix}/confirmations`);
    handleDismiss();
  };

  if (!isVisible) return null;

  const getNotificationContent = () => {
    if (notifications.todayCount > 0) {
      return {
        icon: AlertCircle,
        title: 'Appuntamenti urgenti!',
        message: `${notifications.todayCount} appuntamenti da confermare oggi`,
        color: 'bg-red-500',
        textColor: 'text-red-100',
        borderColor: 'border-red-300'
      };
    } else if (notifications.tomorrowCount > 0) {
      return {
        icon: Clock,
        title: 'Appuntamenti domani',
        message: `${notifications.tomorrowCount} appuntamenti da confermare domani`,
        color: 'bg-amber-500',
        textColor: 'text-amber-100',
        borderColor: 'border-amber-300'
      };
    }
    return null;
  };

  const content = getNotificationContent();
  if (!content) return null;

  const Icon = content.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
        className="fixed bottom-10 right-10 lg:right-6 z-50 max-w-sm"
      >
        <div className={`${content.color} ${content.textColor} rounded-2xl shadow-2xl border-2 ${content.borderColor} overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{content.title}</h3>
                <p className="text-sm opacity-90">{content.message}</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDismiss}
              className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors mb-5"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Action Button */}
          <div className="px-4 pb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClick}
              className="w-full bg-white/20 hover:bg-white/30 rounded-xl py-3 px-4 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Vai alle conferme
            </motion.button>
          </div>

          {/* Progress indicator */}
          <div className="h-1 bg-white/20">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-white/40"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
