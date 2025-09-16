import clsx from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"

export function cn(...inputs) {
  return twMerge(clsx(...inputs))
}

// Date formatting utilities for consistent dd/mm/yyyy format
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return 'Nessuno';
  
  const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
  
  if (!dayjsDate.isValid()) return 'Data non valida';
  
  return dayjsDate.format('DD/MM/YYYY');
};

export const formatDateForDisplay = (date) => {
  if (!date) return 'Nessuno';
  
  const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
  
  if (!dayjsDate.isValid()) return 'Data non valida';
  
  return dayjsDate.format('DD MMMM YYYY');
};

export const formatDateForDatabase = (date) => {
  if (!date) return null;
  
  const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
  
  if (!dayjsDate.isValid()) return null;
  
  return dayjsDate.format('YYYY-MM-DD');
};

export const parseDateFromDatabase = (dateString) => {
  if (!dateString) return null;
  
  return dayjs(dateString);
};
