import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

// Date formatting utilities for consistent dd/mm/yyyy format
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatDate = (date: string | Date | dayjs.Dayjs | null): string => {
  if (!date) return 'Nessuno';
  
  const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
  
  if (!dayjsDate.isValid()) return 'Data non valida';
  
  return dayjsDate.format('DD/MM/YYYY');
};

export const formatDateForDisplay = (date: string | Date | dayjs.Dayjs | null): string => {
  if (!date) return 'Nessuno';
  
  const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
  
  if (!dayjsDate.isValid()) return 'Data non valida';
  
  return dayjsDate.format('DD MMMM YYYY');
};

export const formatDateForDatabase = (date: string | Date | dayjs.Dayjs | null): string | null => {
  if (!date) return null;
  
  const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
  
  if (!dayjsDate.isValid()) return null;
  
  return dayjsDate.format('YYYY-MM-DD');
};

export const parseDateFromDatabase = (dateString: string | null): dayjs.Dayjs | null => {
  if (!dateString) return null;
  
  return dayjs(dateString);
};
