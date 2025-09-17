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
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Nessun appuntamento da confermare</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className={`w-10 h-10 ${colors.bgGradient} rounded-xl flex items-center justify-center text-white`}>
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Appuntamenti da confermare
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {notifications.pendingCount} appuntamenti in attesa di conferma
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {notifications.todayCount > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Oggi</span>
            </div>
            <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
              {notifications.todayCount}
            </div>
          </div>
        )}

        {notifications.tomorrowCount > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Domani</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {notifications.tomorrowCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
