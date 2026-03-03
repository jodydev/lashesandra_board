import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Activity,
  Eye,
  Palette,
  Sparkles,
  CircleDot,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import type { MonthlyStats } from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../lib/utils';

dayjs.locale('it');

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
);

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';
const greenPill = '#DCFCE7';
const greenText = '#15803D';
const grayBar = 'rgba(0,0,0,0.08)';

type Period = 'day' | 'week' | 'month' | 'year';

const WEEKDAY_LABELS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

// Mini sparkline (SVG) per le card KPI — scala in base a min/max per rendere la linea dinamica
function Sparkline({ data, color }: Readonly<{ data: number[]; color: string }>) {
  if (!data.length) return null;
  const w = 80;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // evita divisione per zero quando tutti i valori sono uguali
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8); // riserva 4px sopra/sotto, scala su range reale
    return `${x},${y}`;
  });
  const path = `M ${points.join(' L ')}`;
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

// Card KPI in stile screenshot: titolo, pill % change, valore, sparkline
function KpiCard({
  title,
  value,
  percentChange,
  sparklineData,
  accentColor,
}: Readonly<{
  title: string;
  value: string;
  percentChange: number | null;
  sparklineData: number[];
  accentColor: string;
}>) {
  return (
    <div
      className="rounded-2xl border p-4 sm:p-5 flex flex-col gap-3 shadow-sm"
      style={{ backgroundColor: surfaceColor, borderColor: `${accentColor}20` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: textSecondaryColor }}
        >
          {title}
        </p>
        {percentChange !== null && (
          <span
            className="rounded-lg px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: greenPill,
              color: greenText,
            }}
          >
            {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange)}%
          </span>
        )}
      </div>
      <p
        className="text-xl sm:text-2xl font-bold truncate"
        style={{ color: textPrimaryColor }}
      >
        {value}
      </p>
      <div className="mt-auto pt-1">
        <Sparkline data={sparklineData} color={accentColor} />
      </div>
    </div>
  );
}

// Grafico a barre settimanale LUN–DOM con giorno evidenziato in rosa
function WeeklyRevenueChart({
  data,
  highlightIndex,
  barColor,
  textPrimaryColor,
}: Readonly<{
  data: Array<{ label: string; value: number }>;
  highlightIndex: number;
  barColor: string;
  textPrimaryColor: string;
}>) {
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.label),
      datasets: [
        {
          data: data.map((d) => d.value),
          backgroundColor: data.map((_, i) =>
            i === highlightIndex ? barColor : grayBar
          ),
          borderRadius: 6,
        },
      ],
    }),
    [data, highlightIndex, barColor]
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
            label: (ctx: { raw: unknown }) =>
              formatCurrency(Number(ctx.raw ?? 0)),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            color: textPrimaryColor,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: {
            font: { size: 11 },
            color: textPrimaryColor,
            callback: (value: number | string) =>
              typeof value === 'number' ? formatCurrency(value) : value,
          },
        },
      },
    }),
    [textPrimaryColor]
  );

  return (
    <div className="h-[200px] sm:h-[240px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Icone per tipo servizio (fallback generico)
const SERVICE_ICONS = [Eye, Palette, Sparkles, CircleDot];

export default function MonthlyOverview() {
  const navigate = useNavigate();
  const { statsService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const accentColor = colors.primary;

  const [period, setPeriod] = useState<Period>('month');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [prevStats, setPrevStats] = useState<MonthlyStats | null>(null);
  const [dailyStats, setDailyStats] = useState<
    Array<{ day: number; revenue: number; clients: number; appointments: number }>
  >([]);
  const [treatmentDistribution, setTreatmentDistribution] = useState<
    Array<{ name: string; value: number; count: number; color: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [currentDate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const y = currentDate.year();
      const m = currentDate.month() + 1;
      const prev = currentDate.subtract(1, 'month');

      const [
        monthlyData,
        dailyData,
        treatmentData,
        prevMonthlyData,
      ] = await Promise.all([
        statsService.getMonthlyStats(y, m),
        statsService.getDailyStats(y, m),
        statsService.getTreatmentDistribution(y, m),
        statsService.getMonthlyStats(prev.year(), prev.month() + 1),
      ]);

      setStats(monthlyData);
      setPrevStats(prevMonthlyData);
      setDailyStats(dailyData);
      setTreatmentDistribution(treatmentData);
    } catch {
      setError('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  // Percentuale variazione vs mese precedente
  const percentChangeRevenue =
    stats && prevStats && prevStats.totalRevenue > 0
      ? Math.round(
          ((stats.totalRevenue - prevStats.totalRevenue) /
            prevStats.totalRevenue) *
            100
        )
      : null;
  const percentChangeAppointments =
    stats && prevStats && prevStats.totalAppointments > 0
      ? Math.round(
          ((stats.totalAppointments - prevStats.totalAppointments) /
            prevStats.totalAppointments) *
            100
        )
      : null;

  // Ultimi 7 giorni fino a oggi (o fine mese se mese passato) per sparkline dinamica
  const last7Revenue = useMemo(() => {
    const isCurrentMonth = currentDate.isSame(dayjs(), 'month');
    const endDay = isCurrentMonth
      ? Math.min(dayjs().date(), currentDate.endOf('month').date())
      : currentDate.endOf('month').date();
    const startDay = Math.max(1, endDay - 6);
    const daysInMonth = currentDate.endOf('month').date();
    const dayToRevenue = new Map(dailyStats.map((d) => [d.day, d.revenue]));
    return Array.from({ length: 7 }, (_, i) => {
      const day = startDay + i;
      return day <= daysInMonth ? dayToRevenue.get(day) ?? 0 : 0;
    });
  }, [dailyStats, currentDate]);

  const last7Appointments = useMemo(() => {
    const isCurrentMonth = currentDate.isSame(dayjs(), 'month');
    const endDay = isCurrentMonth
      ? Math.min(dayjs().date(), currentDate.endOf('month').date())
      : currentDate.endOf('month').date();
    const startDay = Math.max(1, endDay - 6);
    const daysInMonth = currentDate.endOf('month').date();
    const dayToAppointments = new Map(dailyStats.map((d) => [d.day, d.appointments]));
    return Array.from({ length: 7 }, (_, i) => {
      const day = startDay + i;
      return day <= daysInMonth ? dayToAppointments.get(day) ?? 0 : 0;
    });
  }, [dailyStats, currentDate]);

  // Dati grafico settimanale: settimana corrente (LUN–DOM) con ricavi per ogni giorno
  const weeklyChartData = useMemo(() => {
    const year = currentDate.year();
    const month = currentDate.month();
    const dayToRevenue = new Map(
      dailyStats.map((d) => [d.day, d.revenue])
    );
    // Settimana che contiene il giorno corrente (o ultimo giorno del mese se futuro)
    const refDate =
      currentDate.isAfter(dayjs()) ? currentDate.endOf('month') : dayjs();
    const weekStart = refDate.startOf('isoWeek');
    return WEEKDAY_LABELS.map((_, i) => {
      const d = weekStart.add(i, 'day');
      const inMonth =
        d.month() === month && d.year() === year;
      const value = inMonth ? dayToRevenue.get(d.date()) ?? 0 : 0;
      return { label: WEEKDAY_LABELS[i], value };
    });
  }, [dailyStats, currentDate]);

  const weeklyHighlightIndex = useMemo(() => {
    const today = dayjs();
    const dayOfWeek = today.day();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor }}>
        <header
          className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm"
          style={{ borderColor: `${accentColor}14` }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full -ml-1"
            style={{ color: accentColor }}
            aria-label="Indietro"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1
            className="text-lg font-bold absolute left-1/2 -translate-x-1/2"
            style={{ color: textPrimaryColor }}
          >
            Statistiche
          </h1>
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full"
            style={{ color: accentColor }}
          >
            <Calendar className="h-5 w-5" />
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="h-10 bg-white rounded-full border animate-pulse" style={{ borderColor: `${accentColor}20` }} />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border p-5 bg-white h-32 animate-pulse" style={{ borderColor: `${accentColor}20` }} />
            <div className="rounded-2xl border p-5 bg-white h-32 animate-pulse" style={{ borderColor: `${accentColor}20` }} />
          </div>
          <div className="rounded-2xl border bg-white p-5 h-64 animate-pulse" style={{ borderColor: `${accentColor}20` }} />
          <div className="rounded-2xl border bg-white p-5 h-48 animate-pulse" style={{ borderColor: `${accentColor}20` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor }}>
      {/* Header: freccia, titolo Statistiche, icona calendario */}
      <header
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm"
        style={{ borderColor: `${accentColor}14` }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full -ml-1 transition-opacity hover:opacity-90"
          style={{ color: accentColor }}
          aria-label="Indietro"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1
          className="text-lg font-bold absolute left-1/2 -translate-x-1/2"
          style={{ color: textPrimaryColor }}
        >
          Statistiche
        </h1>
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ color: accentColor }}
          aria-label="Calendario"
        >
          <Calendar className="h-5 w-5" />
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* Segmented control: Giorno, Settimana, Mese, Anno */}
        <div
          className="flex rounded-full border p-1 shadow-sm"
          style={{ backgroundColor: surfaceColor, borderColor: `${accentColor}20` }}
        >
          {(
            [
              ['day', 'Giorno'],
              ['week', 'Settimana'],
              ['month', 'Mese'],
              ['year', 'Anno'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className="flex-1 py-2.5 rounded-full text-sm font-medium transition-colors"
              style={
                period === key
                  ? {
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                    }
                  : { color: textSecondaryColor }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-medium"
          >
            {error}
          </div>
        )}

        {/* Due card KPI: Entrate e Appuntamenti */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            title="Entrate"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            percentChange={percentChangeRevenue}
            sparklineData={last7Revenue.length ? last7Revenue : [0]}
            accentColor={accentColor}
          />
          <KpiCard
            title="Appuntamenti"
            value={String(stats?.totalAppointments ?? 0)}
            percentChange={percentChangeAppointments}
            sparklineData={last7Appointments.length ? last7Appointments : [0]}
            accentColor={accentColor}
          />
        </div>

        {/* Andamento Ricavi: titolo + mese in rosa, grafico LUN–DOM */}
        <div
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: surfaceColor, borderColor: `${accentColor}20` }}
        >
          <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ borderColor: `${accentColor}14` }}>
            <h2
              className="text-base sm:text-lg font-semibold"
              style={{ color: textPrimaryColor }}
            >
              Andamento Ricavi
            </h2>
            <div className="flex items-center gap-1 justify-center">
              <button
                type="button"
                onClick={() => setCurrentDate((d) => d.subtract(1, 'month'))}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                style={{ color: textSecondaryColor }}
                aria-label="Mese precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span
                className="min-w-[140px] text-center text-sm font-medium capitalize"
              >
                {currentDate.format('MMMM YYYY')}
              </span>
              <button
                type="button"
                onClick={() => setCurrentDate((d) => d.add(1, 'month'))}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                style={{ color: textSecondaryColor }}
                aria-label="Mese successivo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {weeklyChartData.some((d) => d.value > 0) ? (
              <WeeklyRevenueChart
                data={weeklyChartData}
                highlightIndex={weeklyHighlightIndex}
                barColor={accentColor}
                textPrimaryColor={textPrimaryColor}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center h-[200px] text-center"
                style={{ color: textSecondaryColor }}
              >
                <Activity size={40} className="opacity-50 mb-3" />
                <p className="text-sm">Nessun dato per questo periodo</p>
              </div>
            )}
          </div>
        </div>

        {/* Servizi Più Richiesti */}
        <div
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: surfaceColor, borderColor: `${accentColor}20` }}
        >
          <div className="p-4 sm:p-5 border-b" style={{ borderColor: `${accentColor}14` }}>
            <h2
              className="text-base sm:text-lg font-semibold"
              style={{ color: textPrimaryColor }}
            >
              Servizi Più Richiesti
            </h2>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {treatmentDistribution.length > 0 ? (
              treatmentDistribution.slice(0, 5).map((item, index) => {
                const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-colors"
                    style={{
                      backgroundColor: `${accentColor}08`,
                      borderColor: `${accentColor}18`,
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm sm:text-base truncate"
                        style={{ color: textPrimaryColor }}
                      >
                        {item.name}
                      </p>
                      <p
                        className="text-xs sm:text-sm"
                        style={{ color: textSecondaryColor }}
                      >
                        {item.count} Appuntamenti
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p
                        className="font-semibold text-sm sm:text-base"
                        style={{ color: accentColor }}
                      >
                        {formatCurrency(item.value)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: textSecondaryColor }}
                      >
                        0%
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className="flex flex-col items-center justify-center py-10 text-center"
                style={{ color: textSecondaryColor }}
              >
                <Activity size={32} className="opacity-50 mb-2" />
                <p className="text-sm">Nessun servizio nel periodo selezionato</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
