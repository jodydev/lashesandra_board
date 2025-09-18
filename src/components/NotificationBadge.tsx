import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertCircle, Clock, Calendar } from 'lucide-react';
import { useAppointmentNotifications } from '../hooks/useAppointmentNotifications';
import { useAppColors } from '../hooks/useAppColors';

interface NotificationBadgeProps {
  variant?: 'menu' | 'header' | 'floating';
  showDetails?: boolean;
  onClick?: () => void;
}

export default function NotificationBadge({ 
  variant = 'menu', 
  showDetails = false,
  onClick 
}: NotificationBadgeProps) {
  const { notifications, loading } = useAppointmentNotifications();
  const colors = useAppColors();

  if (loading) {
    return (
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    );
  }

  if (!notifications.hasNotifications) {
    return null;
  }

  const getBadgeContent = () => {
    if (notifications.urgentCount > 0) {
      return {
        count: notifications.urgentCount,
        color: 'bg-red-500',
        textColor: 'text-white',
        icon: AlertCircle,
        label: 'Urgenti'
      };
    } else if (notifications.todayCount > 0) {
      return {
        count: notifications.todayCount,
        color: 'bg-amber-500',
        textColor: 'text-white',
        icon: Clock,
        label: 'Oggi'
      };
    } else {
      return {
        count: notifications.pendingCount,
        color: `${colors.bgPrimary} dark:${colors.bgPrimaryDark}`,
        textColor: `${colors.textPrimary} dark:${colors.textPrimaryDark}`,
        icon: Calendar,
        label: 'In attesa'
      };
    }
  };

  const badgeContent = getBadgeContent();
  const Icon = badgeContent.icon;

  if (variant === 'floating') {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`fixed bottom-1 right-0 left-0 z-50 w-14 h-14 ${badgeContent.color} ${badgeContent.textColor} rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group`}
      >
        <Bell className="w-6 h-6" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-2 -right-2 w-6 h-6 ${colors.bgGradient} rounded-full flex items-center justify-center text-white text-xs font-bold`}
        >
          {badgeContent.count}
        </motion.div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {badgeContent.count} appuntamenti da confermare
        </div>
      </motion.button>
    );
  }

  if (variant === 'header') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 w-5 h-5 ${badgeContent.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}
        >
          {badgeContent.count}
        </motion.div>
      </motion.button>
    );
  }

  // Menu variant (default)
  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`w-6 h-6 ${badgeContent.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}
      >
        {badgeContent.count}
      </motion.div>
      
      {showDetails && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {badgeContent.label}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {notifications.pendingCount} totali
          </span>
        </div>
      )}
    </div>
  );
}

// Componente per mostrare un riassunto delle notifiche
export function NotificationSummary() {
  const { notifications } = useAppointmentNotifications();
  const colors = useAppColors();

  if (!notifications.hasNotifications) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 text-gray-500 dark:text-gray-400"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center"
        >
          <Bell className="w-8 h-8 opacity-50" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tutto sotto controllo
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nessun appuntamento da confermare al momento
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header principale */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`w-12 h-12 ${colors.bgGradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}
          >
            <Bell className="w-6 h-6" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Appuntamenti da confermare
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {notifications.pendingCount} {notifications.pendingCount === 1 ? 'appuntamento' : 'appuntamenti'} in attesa
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-right"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {notifications.pendingCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Totale
            </div>
          </motion.div>
        </div>
        
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
      </motion.div>

      {/* Cards per oggi e domani */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {notifications.todayCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group relative overflow-hidden p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 bg-gradient-to-br ${colors.gradientFrom} ${colors.gradientTo} rounded-xl flex items-center justify-center`}>
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Oggi
                </span>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              </motion.div>
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-1">
              {notifications.todayCount}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300 opacity-80">
              {notifications.todayCount === 1 ? 'Appuntamento' : 'Appuntamenti'}
            </div>
            
            {/* Decorative element */}
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-amber-500/10 rounded-full group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
        )}

        {notifications.tomorrowCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group relative overflow-hidden p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 bg-gradient-to-br ${colors.gradientFrom} ${colors.gradientTo} rounded-xl flex items-center justify-center`}>
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Domani
                </span>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              </motion.div>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {notifications.tomorrowCount}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 opacity-80">
              {notifications.tomorrowCount === 1 ? 'Appuntamento' : 'Appuntamenti'}
            </div>
            
            {/* Decorative element */}
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
        )}
      </div>

    </motion.div>
  );
}
