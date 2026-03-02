import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import dayjs from 'dayjs';
import type { MonthlyStats } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
);

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

// Stat card (stile carosello: no shadow, icon con gradient, card più grande)
function StatCard({
  icon: Icon,
  title,
  value,
  accentSofter,
  accentGradient,
}: Readonly<{
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: string;
  value: string | number;
  accentSofter: string;
  accentGradient: string;
}>) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-6 sm:p-7"
      style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-2.5">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-wide" style={{ color: textSecondaryColor }}>
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-semibold dark:text-white truncate" style={{ color: textPrimaryColor }}>
            {value}
          </p>
        </div>
        <span
          className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: accentGradient }}
          aria-hidden
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2} aria-hidden />
        </span>
      </div>
    </div>
  );
}

// Grafico a barre Chart.js — ottimizzato per mobile (touch, responsive, leggibile)
function MonthlyBarChart({
  data,
  dataKey,
  formatValue,
  barColor,
  textPrimaryColor,
}: Readonly<{
  data: Array<{ day: number; revenue: number; clients: number }>;
  dataKey: 'revenue' | 'clients';
  formatValue: (value: number) => string;
  barColor: string;
  textPrimaryColor: string;
}>) {
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => String(d.day)),
      datasets: [
        {
          label: dataKey === 'revenue' ? 'Fatturato' : 'Clienti',
          data: data.map((d) => d[dataKey]),
          backgroundColor: barColor,
          borderRadius: 6,
        },
      ],
    }),
    [data, dataKey, barColor],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' as const },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          titleColor: textPrimaryColor,
          bodyColor: textPrimaryColor,
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          callbacks: {
            label: (ctx: { raw: number }) => formatValue(Number(ctx.raw)),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            font: { size: 11 },
            color: textPrimaryColor,
            maxTicksLimit: 12,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: {
            font: { size: 11 },
            color: textPrimaryColor,
            callback: (value: number | string) => (typeof value === 'number' ? formatValue(value) : value),
          },
        },
      },
    }),
    [formatValue, textPrimaryColor],
  );

  return (
    <div className="h-[220px] sm:h-[260px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Grafico a ciambella Chart.js — distribuzione trattamenti, mobile-first (legenda sotto, tap-friendly)
function TreatmentDoughnutChart({
  data,
  textPrimaryColor,
  formatCurrencyFn,
}: Readonly<{
  data: Array<{ name: string; value: number; color: string }>;
  textPrimaryColor: string;
  formatCurrencyFn: (n: number) => string;
}>) {
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.name),
      datasets: [
        {
          data: data.map((d) => d.value),
          backgroundColor: data.map((d) => d.color),
          borderWidth: 0,
        },
      ],
    }),
    [data],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 14,
            usePointStyle: true,
            font: { size: 12 },
            color: textPrimaryColor,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          titleColor: textPrimaryColor,
          bodyColor: textPrimaryColor,
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          callbacks: {
            label: (ctx: { label: string; raw: number; dataset: { data: number[] } }) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((Number(ctx.raw) / total) * 100).toFixed(0) : '0';
              return `${ctx.label}: ${formatCurrencyFn(Number(ctx.raw))} (${pct}%)`;
            },
          },
        },
      },
    }),
    [textPrimaryColor, formatCurrencyFn],
  );

  return (
    <div className="h-[280px] sm:h-[320px] w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

// Chart container (stile ClientList: bordo, titolo, no motion)
function ChartContainer({
  title,
  children,
  actions,
  accentSofter,
  textPrimaryColor,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  accentSofter: string;
  textPrimaryColor: string;
}>) {
  return (
    <div
      className="rounded-2xl shadow-lg overflow-hidden border"
      style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
    >
      <div className="p-4 sm:p-6 border-b" style={{ borderColor: accentSofter }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: textPrimaryColor }}>
            {title}
          </h3>
          {actions}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

export default function MonthlyOverview() {
  const navigate = useNavigate();
  const { statsService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#ffffff';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;
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
      <div className="min-h-screen" style={{ backgroundColor }}>
        <header
          className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800"
          style={{ borderColor: accentSofter }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-90"
            style={{ color: accentColor }}
            aria-label="Indietro"
          >
            <ChevronLeft className="h-6 w-6" />
            <span>Indietro</span>
          </button>
          <h1
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold dark:text-white"
            style={{ color: textPrimaryColor }}
          >
            Panoramica Mensile
          </h1>
          <div className="h-9 w-9" />
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 sm:h-6 bg-gray-200 dark:bg-gray-800 rounded w-12 sm:w-16" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-800 rounded w-16 sm:w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 h-64 sm:h-96 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-64 sm:h-96 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Header navigazione: Indietro | Panoramica Mensile (stile ClientList) */}
      <header
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800"
        style={{ borderColor: accentSofter }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-90"
          style={{ color: accentColor }}
          aria-label="Indietro"
        >
          <ChevronLeft className="h-6 w-6" />
          <span>Indietro</span>
        </button>
        <h1
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold dark:text-white"
          style={{ color: textPrimaryColor }}
        >
          Panoramica Mensile
        </h1>
        <div className="h-9 w-9" />
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Barra navigazione mese (stile riga filtri ClientList) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2 rounded-2xl border p-2 shadow-sm bg-white dark:bg-gray-900" style={{ borderColor: accentSofter }}>
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="p-2 rounded-xl transition-opacity hover:opacity-90"
              style={{ color: textSecondaryColor }}
              aria-label="Mese precedente"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 min-w-[160px] sm:min-w-[200px] justify-center">
              <Calendar size={14} className="sm:w-4 sm:h-4" style={{ color: accentColor }} />
              <span className="text-sm sm:text-base font-semibold capitalize" style={{ color: textPrimaryColor }}>
                {currentDate.format('MMMM YYYY')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl transition-opacity hover:opacity-90"
              style={{ color: textSecondaryColor }}
              aria-label="Mese successivo"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Error (stile ClientList) */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-800 dark:text-red-200 font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Carosello statistiche scrollabile */}
        <div className="mb-6 sm:mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >

            <div className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center">
              <StatCard
                icon={Euro}
                title="Fatturato Totale"
                value={formatCurrency(stats?.totalRevenue ?? 0)}
                accentSofter={accentSofter}
                accentGradient={accentGradient}
              />
            </div>
            <div className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center">
              <StatCard
                icon={Users}
                title="Clienti Totali"
                value={stats?.totalClients ?? 0}
                accentSofter={accentSofter}
                accentGradient={accentGradient}
              />
            </div>

            <div className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center">
              <StatCard
                icon={TrendingUp}
                title="Media per Cliente"
                value={formatCurrency(stats?.averageRevenuePerClient ?? 0)}
                accentSofter={accentSofter}
                accentGradient={accentGradient}
              />
            </div>
            <div className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center">
              <StatCard
                icon={Star}
                title="Top Clienti"
                value={stats?.topClients?.length ?? 0}
                accentSofter={accentSofter}
                accentGradient={accentGradient}
              />
            </div>
          </div>
        </div>

        {/* Charts section with improved layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Enhanced revenue chart */}
          <div className="lg:col-span-2">
            <ChartContainer
              title="Andamento Mensile"
              accentSofter={accentSofter}
              textPrimaryColor={textPrimaryColor}
              actions={
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setChartType('revenue')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap ${chartType === 'revenue' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    style={
                      chartType === 'revenue'
                        ? { background: accentGradient }
                        : { backgroundColor: surfaceColor, border: `1px solid ${accentSofter}` }
                    }
                  >
                    <Euro size={14} className="inline mr-1" />
                    <span className="">Fatturato</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('clients')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap ${chartType === 'clients' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    style={
                      chartType === 'clients'
                        ? { background: accentGradient }
                        : { backgroundColor: surfaceColor, border: `1px solid ${accentSofter}` }
                    }
                  >
                    <Users size={14} className="inline mr-1" />
                    <span className="">Clienti</span>
                  </button>
                </div>
              }
            >
              <div className="min-h-[220px] sm:min-h-[260px]">
                {getRevenueChartData().length > 0 ? (
                  <MonthlyBarChart
                    data={getRevenueChartData()}
                    dataKey={chartType === 'revenue' ? 'revenue' : 'clients'}
                    formatValue={chartType === 'revenue' ? formatCurrency : String}
                    barColor={appType === 'lashesandra' ? '#E91E63' : '#9C27B0'}
                    textPrimaryColor={textPrimaryColor}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[220px] sm:h-[260px]" style={{ color: textSecondaryColor }}>
                    <div className="text-center">
                      <Activity size={32} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">Nessun dato disponibile per questo mese</p>
                    </div>
                  </div>
                )}
              </div>
            </ChartContainer>
          </div>

          {/* Distribuzione trattamenti — Chart.js Doughnut, mobile-first */}
          <ChartContainer title="Distribuzione Trattamenti" accentSofter={accentSofter} textPrimaryColor={textPrimaryColor}>
            {getTreatmentDistribution().length > 0 ? (
              <TreatmentDoughnutChart
                data={getTreatmentDistribution()}
                textPrimaryColor={textPrimaryColor}
                formatCurrencyFn={formatCurrency}
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] sm:h-[320px]" style={{ color: textSecondaryColor }}>
                <div className="text-center">
                  <Activity size={40} className="sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-base sm:text-lg">Nessun dato disponibile per questo mese</p>
                </div>
              </div>
            )}
          </ChartContainer>
        </div>

        {/* Top clienti (stile ClientList: card semplici, no motion) */}
        <ChartContainer title="Top Clienti per Fatturato" accentSofter={accentSofter} textPrimaryColor={textPrimaryColor}>
          <div className="space-y-3 sm:space-y-4">
            {stats?.topClients.map((item, index) => (
              <div
                key={item.client.id}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {index < 3 && (
                      <div
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white"
                        style={
                          index === 0
                            ? { background: 'linear-gradient(135deg, #FACC15, #EAB308)' }
                            : index === 1
                              ? { background: 'linear-gradient(135deg, #9CA3AF, #6B7280)' }
                              : { background: 'linear-gradient(135deg, #FB923C, #EA580C)' }
                        }
                      >
                        {index + 1}
                      </div>
                    )}
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg"
                      style={{ background: accentGradient }}
                    >
                      {item.client.nome.charAt(0)}
                      {item.client.cognome.charAt(0)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                      {item.client.nome} {item.client.cognome}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 flex-shrink-0">
                  <span
                    className="px-2 sm:px-3 py-1 rounded-xl text-xs font-medium"
                    style={
                      item.client.tipo_cliente === 'nuovo'
                        ? { backgroundColor: accentSofter, color: colors.primaryDark }
                        : { backgroundColor: '#DCFCE7', color: '#047857' }
                    }
                  >
                    {item.client.tipo_cliente === 'nuovo' ? 'Nuovo' : 'Abituale'}
                  </span>
                  <div className="text-right">
                    <div
                      className="font-bold text-sm sm:text-base"
                      style={{
                        background: accentGradient,
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                      }}
                    >
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
              </div>
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
