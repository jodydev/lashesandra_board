import { useState, useEffect } from 'react';
import { useSupabaseServices } from '../lib/supabaseService';
import type { Appointment } from '../types';

export interface AppointmentNotification {
  pendingCount: number;
  urgentCount: number;
  todayCount: number;
  tomorrowCount: number;
  hasNotifications: boolean;
}

export function useAppointmentNotifications() {
  const { appointmentService } = useSupabaseServices();
  const [notifications, setNotifications] = useState<AppointmentNotification>({
    pendingCount: 0,
    urgentCount: 0,
    todayCount: 0,
    tomorrowCount: 0,
    hasNotifications: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const appointments = await appointmentService.getAll();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

      const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
      const todayAppointments = pendingAppointments.filter(apt => {
        const aptDate = new Date(apt.data);
        return aptDate >= today && aptDate < tomorrow;
      });
      const tomorrowAppointments = pendingAppointments.filter(apt => {
        const aptDate = new Date(apt.data);
        return aptDate >= tomorrow && aptDate < dayAfterTomorrow;
      });
      
      // Appuntamenti urgenti: oggi o domani
      const urgentAppointments = [...todayAppointments, ...tomorrowAppointments];

      const newNotifications: AppointmentNotification = {
        pendingCount: pendingAppointments.length,
        urgentCount: urgentAppointments.length,
        todayCount: todayAppointments.length,
        tomorrowCount: tomorrowAppointments.length,
        hasNotifications: pendingAppointments.length > 0
      };

      setNotifications(newNotifications);
    } catch (err) {
      setError('Errore nel caricamento delle notifiche');
      console.error('Error loading appointment notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Ricarica le notifiche ogni 30 secondi per tenere aggiornato il contatore
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    loading,
    error,
    refreshNotifications: loadNotifications
  };
}
