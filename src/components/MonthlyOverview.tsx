import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Euro,
  Users,
  TrendingUp,
  Star,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';
import type { MonthlyStats } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../lib/utils';


// Modern metric card component with glass morphism effect
const MetricCard = ({ icon: Icon, title, value, trend, delay = 0, colors }: {
  icon: any;
  title: string;
  value: string | number;
  trend?: string;
  delay?: number;
  colors: any;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:${colors.borderPrimary} dark:hover:${colors.borderPrimary} transition-all duration-300 hover:shadow-lg ${colors.shadowPrimaryLight}`}
  >
    <div className={`absolute inset-0 ${colors.bgGradientLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    <div className="relative p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className={`p-2 sm:p-2.5 rounded-xl ${colors.bgGradient} text-white shadow-lg ${colors.shadowPrimary}`}>
              <Icon size={16} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            {trend && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                {trend}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Modern chart container with enhanced styling
const ChartContainer = ({ title, children, actions }: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-black/5 overflow-hidden"
  >
    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {actions}
      </div>
    </div>
    <div className="p-4 sm:p-6">
      {children}
    </div>
  </motion.div>
);

// Enhanced loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4 sm:space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2 h-64 sm:h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
      <div className="h-64 sm:h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
    </div>
  </div>
);

export default function MonthlyOverview() {
  const { statsService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [dailyStats, setDailyStats] = useState<Array<{ day: number; revenue: number; clients: number }>>([]);
  const [treatmentDistribution, setTreatmentDistribution] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'revenue' | 'clients'>('revenue');

  useEffect(() => {
    loadStats();
  }, [currentDate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [monthlyData, dailyData, treatmentData] = await Promise.all([
        statsService.getMonthlyStats(currentDate.year(), currentDate.month() + 1),
        statsService.getDailyStats(currentDate.year(), currentDate.month() + 1),
        statsService.getTreatmentDistribution(currentDate.year(), currentDate.month() + 1)
      ]);
      
      setStats(monthlyData);
      setDailyStats(dailyData);
      setTreatmentDistribution(treatmentData);
    } catch (err) {
      setError('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };


  const getRevenueChartData = () => {
    return dailyStats;
  };

  const getTreatmentDistribution = () => {
    return treatmentDistribution;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-${colors.primaryLight}/30 to-gray-100 dark:from-gray-900 dark:via-${colors.primaryDark}/10 dark:to-gray-800`}>
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Header with enhanced navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start justify-between gap-4"
        >
          <div className="space-y-1 w-full">
            <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-${colors.primary} to-gray-600 dark:from-white dark:via-${colors.primaryLight} dark:to-gray-300 bg-clip-text text-transparent`}>
              Panoramica Mensile
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Analisi dettagliata delle performance del mese
            </p>
          </div>
          
          {/* Enhanced month navigation */}
          <div className="flex items-center justify-center w-full sm:w-auto gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 shadow-lg">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePreviousMonth}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 min-w-[160px] sm:min-w-[200px] justify-center">
              <Calendar size={14} className={`sm:w-4 sm:h-4 ${colors.textPrimary}`} />
              <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {currentDate.format('MMMM YYYY')}
              </span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Error state with better styling */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm sm:text-base"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <MetricCard
            icon={Users}
            title="Clienti Totali"
            value={stats?.totalClients || 0}
            trend="+12% vs mese scorso"
            delay={0.1}
            colors={colors}
          />
          <MetricCard
            icon={Euro}
            title="Fatturato Totale"
            value={formatCurrency(stats?.totalRevenue || 0)}
            trend="+8% vs mese scorso"
            delay={0.2}
            colors={colors}
          />
          <MetricCard
            icon={TrendingUp}
            title="Media per Cliente"
            value={formatCurrency(stats?.averageRevenuePerClient || 0)}
            trend="+5% vs mese scorso"
            delay={0.3}
            colors={colors}
          />
          <MetricCard
            icon={Star}
            title="Top Clienti"
            value={stats?.topClients.length || 0}
            delay={0.4}
            colors={colors}
          />
        </div>

        {/* Charts section with improved layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Enhanced revenue chart */}
          <div className="lg:col-span-2">
            <ChartContainer
              title="Andamento Mensile"
              actions={
                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setChartType('revenue')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      chartType === 'revenue'
                        ? `${colors.bgGradient} text-white shadow-lg ${colors.shadowPrimary}`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Euro size={14} className="inline mr-1" />
                    <span className="hidden sm:inline">Fatturato</span>
                    <span className="sm:hidden">€</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setChartType('clients')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      chartType === 'clients'
                        ? `${colors.bgGradient} text-white shadow-lg ${colors.shadowPrimary}`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Users size={14} className="inline mr-1" />
                    <span className="hidden sm:inline">Clienti</span>
                    <span className="sm:hidden">👥</span>
                  </motion.button>
                </div>
              }
            >
              <div className="h-64 sm:h-80">
                {getRevenueChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getRevenueChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        className="sm:text-xs"
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        className="sm:text-xs"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [
                          chartType === 'revenue' ? formatCurrency(Number(value)) : value,
                          chartType === 'revenue' ? 'Fatturato' : 'Clienti'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={chartType === 'revenue' ? 'revenue' : 'clients'} 
                        stroke={appType === 'lashesandra' ? '#E91E63' : '#9C27B0'}
                        strokeWidth={2}
                        dot={{ fill: appType === 'lashesandra' ? '#E91E63' : '#9C27B0', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: appType === 'lashesandra' ? '#E91E63' : '#9C27B0', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Activity size={32} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">Nessun dato disponibile per questo mese</p>
                    </div>
                  </div>
                )}
              </div>
            </ChartContainer>
          </div>

          {/* Enhanced pie chart */}
          <ChartContainer title="Distribuzione Trattamenti">
            <div className="h-64 sm:h-80">
              {getTreatmentDistribution().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getTreatmentDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={window.innerWidth < 640 ? 60 : 80}
                      fill="#8884d8"
                      dataKey="value"
                      style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                    >
                      {getTreatmentDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Fatturato']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Activity size={32} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Nessun dato disponibile per questo mese</p>
                  </div>
                </div>
              )}
            </div>
          </ChartContainer>
        </div>

        {/* Enhanced top clients table */}
        <ChartContainer title="Top Clienti per Fatturato">
          <div className="space-y-3 sm:space-y-4">
            {stats?.topClients.map((item, index) => (
              <motion.div
                key={item.client.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {index < 3 && (
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        'bg-gradient-to-r from-orange-400 to-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colors.bgGradient} flex items-center justify-center text-white font-semibold text-xs sm:text-sm`}>
                      {item.client.nome.charAt(0)}{item.client.cognome.charAt(0)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                      {item.client.nome} {item.client.cognome}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 flex-shrink-0">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                    item.client.tipo_cliente === 'nuovo' 
                      ? `${colors.bgPrimary} ${colors.textPrimary} dark:${colors.bgPrimaryDark} dark:${colors.textPrimaryDark}`
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {item.client.tipo_cliente === 'nuovo' ? 'Nuovo' : 'Abituale'}
                  </span>
                  <div className="text-right">
                    <div className={`font-bold ${colors.textPrimary} dark:${colors.textPrimaryDark} text-sm sm:text-base`}>
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {(!stats?.topClients || stats.topClients.length === 0) && (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                <Activity size={32} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Nessun dato disponibile per questo mese</p>
              </div>
            )}
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}
