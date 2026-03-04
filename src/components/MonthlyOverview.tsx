import { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  Activity,
  Eye,
  Palette,
  Sparkles,
  CircleDot,
  ChevronLeft,
} from 'lucide-react';
import PageHeader from './PageHeader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
  ArcElement,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import type {
  MonthlyStats,
  RetentionStats,
  NoShowCancellationStats,
  TreatmentMarginStats,
} from '../types';
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
  ArcElement,
  Legend,
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

function TreatmentPieChart({
  data,
  segmentColors,
}: Readonly<{
  data: Array<{ name: string; value: number; count: number; color: string }>;
  segmentColors: string[];
}>) {
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.name),
      datasets: [
        {
          data: data.map((d) => d.value),
          backgroundColor: data.map(
            (_d, index) => segmentColors[index % segmentColors.length] || '#c4c4c4',
          ),
          borderWidth: 1,
          borderColor: '#ffffff',
        },
      ],
    }),
    [data, segmentColors]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 14,
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
            label: (ctx: { label: string; raw: unknown; dataIndex: number }) => {
              const rawValue = Number(ctx.raw ?? 0);
              const count = data[ctx.dataIndex]?.count ?? 0;
              return `${ctx.label}: ${formatCurrency(rawValue)} · ${count} appuntamenti`;
            },
          },
        },
      },
    }),
    [data]
  );

  if (!data.length) return null;

  return (
    <div className="h-52 sm:h-60">
      <Pie data={chartData} options={options} />
    </div>
  );
}

// Icone per tipo servizio (fallback generico)
const SERVICE_ICONS = [Eye, Palette, Sparkles, CircleDot];

export default function MonthlyOverview() {
  const { statsService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const accentColor = colors.primary;
  const accentDarkColor = colors.primaryDark;

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
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [noShowStats, setNoShowStats] = useState<NoShowCancellationStats | null>(null);
  const [treatmentMarginStats, setTreatmentMarginStats] = useState<TreatmentMarginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const treatmentPieColors = useMemo(
    () => [colors.primary, colors.primaryLight, colors.primaryDark],
    [colors.primary, colors.primaryLight, colors.primaryDark],
  );

  useEffect(() => {
    loadStats();
  }, [currentDate, appType]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const y = currentDate.year();
      const m = currentDate.month() + 1;
      const prev = currentDate.subtract(1, 'month');

      const periodStart = currentDate.startOf('month').format('YYYY-MM-DD');
      const periodEnd = currentDate.endOf('month').format('YYYY-MM-DD');

      const [
        monthlyData,
        dailyData,
        treatmentData,
        prevMonthlyData,
        retentionData,
        noShowData,
        treatmentMarginData,
      ] = await Promise.all([
        statsService.getMonthlyStats(y, m),
        statsService.getDailyStats(y, m),
        statsService.getTreatmentDistribution(y, m),
        statsService.getMonthlyStats(prev.year(), prev.month() + 1),
        statsService.getRetentionStats(periodStart, periodEnd),
        statsService.getNoShowCancellationStats(periodStart, periodEnd),
        statsService.getTreatmentMarginStats(periodStart, periodEnd, appType),
      ]);

      setStats(monthlyData);
      setPrevStats(prevMonthlyData);
      setDailyStats(dailyData);
      setTreatmentDistribution(treatmentData);
      setRetentionStats(retentionData);
      setNoShowStats(noShowData);
      setTreatmentMarginStats(treatmentMarginData);
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
            100,
        )
      : null;
  const percentChangeAppointments =
    stats && prevStats && prevStats.totalAppointments > 0
      ? Math.round(
          ((stats.totalAppointments - prevStats.totalAppointments) /
            prevStats.totalAppointments) *
            100,
        )
      : null;

  const displayTotals = useMemo(
    () => {
      if (!stats) {
        return { revenue: 0, appointments: 0 };
      }

      if (!dailyStats.length || period === 'month') {
        return {
          revenue: stats.totalRevenue,
          appointments: stats.totalAppointments,
        };
      }

      if (period === 'day') {
        const targetDay = currentDate.date();
        const dayStats = dailyStats.find((d) => d.day === targetDay);
        return {
          revenue: dayStats?.revenue ?? 0,
          appointments: dayStats?.appointments ?? 0,
        };
      }

      if (period === 'week') {
        const weekStart = currentDate.startOf('isoWeek');
        const weekEnd = currentDate.endOf('isoWeek');
        const monthStart = currentDate.startOf('month');
        const monthEnd = currentDate.endOf('month');

        const start = weekStart.isBefore(monthStart) ? monthStart : weekStart;
        const end = weekEnd.isAfter(monthEnd) ? monthEnd : weekEnd;

        let revenue = 0;
        let appointments = 0;
        for (
          let d = start.date();
          d <= end.date();
          d += 1
        ) {
          const statsForDay = dailyStats[d - 1];
          if (!statsForDay) continue;
          revenue += statsForDay.revenue;
          appointments += statsForDay.appointments;
        }

        return { revenue, appointments };
      }

      // Per "anno" usiamo per ora gli stessi totali mensili
      return {
        revenue: stats.totalRevenue,
        appointments: stats.totalAppointments,
      };
    },
    [stats, dailyStats, period, currentDate],
  );

  const displayPercentChangeRevenue =
    period === 'month' ? percentChangeRevenue : null;
  const displayPercentChangeAppointments =
    period === 'month' ? percentChangeAppointments : null;

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
        <PageHeader
          title="Statistiche"
          backLabel="Indietro" 
          showBack
        />
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
      <PageHeader
        title="Statistiche"
        showBack
        backLabel="Indietro"
      />

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
                      backgroundColor: accentDarkColor,
                      color: '#FFFFFF',
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
            value={formatCurrency(displayTotals.revenue)}
            percentChange={displayPercentChangeRevenue}
            sparklineData={last7Revenue.length ? last7Revenue : [0]}
            accentColor={accentColor}
          />
          <KpiCard
            title="Appuntamenti"
            value={String(displayTotals.appointments)}
            percentChange={displayPercentChangeAppointments}
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
            {treatmentDistribution.length > 0 && (
              <div className="mb-3">
                <TreatmentPieChart
                  data={treatmentDistribution}
                  segmentColors={treatmentPieColors}
                />
              </div>
            )}
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

        {/* Retention clienti 3/4/5 settimane */}
        {retentionStats && (
          <div
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: surfaceColor, borderColor: `${accentColor}20` }}
          >
            <div
              className="p-4 sm:p-5 border-b"
              style={{ borderColor: `${accentColor}14` }}
            >
              <h2
                className="text-base sm:text-lg font-semibold"
                style={{ color: textPrimaryColor }}
              >
                Retention clienti
              </h2>
              <p
                className="mt-1 text-xs sm:text-sm"
                style={{ color: textSecondaryColor }}
              >
                Percentuale di clienti che tornano entro 3, 4 o 5 settimane
              </p>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {retentionStats.buckets.map((bucket) => (
                <div
                  key={bucket.weeks}
                  className="rounded-xl border px-4 py-3 flex flex-col gap-1"
                  style={{
                    backgroundColor: `${accentColor}08`,
                    borderColor: `${accentColor}18`,
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: textSecondaryColor }}
                  >
                    {bucket.weeks} settimane
                  </p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: textPrimaryColor }}
                  >
                    {bucket.percentage}%
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: textSecondaryColor }}
                  >
                    {bucket.retainedClients} su {bucket.totalClients} clienti
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No-show, cancellazioni e clienti a rischio */}
        {noShowStats && (
          <div
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: surfaceColor, borderColor: `${accentColor}20` }}
          >
            <div
              className="p-4 sm:p-5 border-b"
              style={{ borderColor: `${accentColor}14` }}
            >
              <h2
                className="text-base sm:text-lg font-semibold"
                style={{ color: textPrimaryColor }}
              >
                No-show e cancellazioni
              </h2>
              <p
                className="mt-1 text-xs sm:text-sm"
                style={{ color: textSecondaryColor }}
              >
                Ultimo mese selezionato
              </p>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-col gap-1 text-sm">
                <p style={{ color: textPrimaryColor }}>
                  <span className="font-semibold">Totale appuntamenti:</span>{' '}
                  {noShowStats.totalAppointments}
                </p>
                <p style={{ color: textPrimaryColor }}>
                  <span className="font-semibold">No-show:</span>{' '}
                  {noShowStats.noShowCount} (
                  {noShowStats.noShowPercentage}%)
                </p>
                <p style={{ color: textPrimaryColor }}>
                  <span className="font-semibold">Cancellazioni:</span>{' '}
                  {noShowStats.cancellationCount} (
                  {noShowStats.cancellationPercentage}%)
                </p>
              </div>

              <div className="space-y-2">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: textSecondaryColor }}
                >
                  Clienti a rischio
                </p>
                {noShowStats.riskyClients.length === 0 ? (
                  <p
                    className="text-xs"
                    style={{ color: textSecondaryColor }}
                  >
                    Nessun cliente a rischio nel periodo analizzato.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {noShowStats.riskyClients.slice(0, 5).map((entry) => (
                      <div
                        key={entry.client.id}
                        className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                        style={{
                          backgroundColor: `${accentColor}08`,
                          borderColor: `${accentColor}18`,
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: textPrimaryColor }}
                          >
                            {entry.client.nome} {entry.client.cognome}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: textSecondaryColor }}
                          >
                            {entry.noShowCount} no-show ·{' '}
                            {entry.cancellationCount} cancellazioni
                          </p>
                        </div>
                        <p
                          className="text-[11px]"
                          style={{ color: textSecondaryColor }}
                        >
                          Ultimo: {dayjs(entry.lastIssueDate).format('D MMM')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Trattamenti top per margine */}
        {treatmentMarginStats && treatmentMarginStats.items.length > 0 && (
          <div
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: surfaceColor, borderColor: `${accentColor}20` }}
          >
            <div
              className="p-4 sm:p-5 border-b"
              style={{ borderColor: `${accentColor}14` }}
            >
              <h2
                className="text-base sm:text-lg font-semibold"
                style={{ color: textPrimaryColor }}
              >
                Trattamenti top per margine
              </h2>
              <p
                className="mt-1 text-xs sm:text-sm"
                style={{ color: textSecondaryColor }}
              >
                Ordinati per margine totale (prezzo meno costo stimato)
              </p>
            </div>
            <div className="p-4 sm:p-5 overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr
                    className="text-left"
                    style={{ color: textSecondaryColor }}
                  >
                    <th className="pb-2 pr-4 font-medium">Trattamento</th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Margine totale
                    </th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Margine medio
                    </th>
                    <th className="pb-2 font-medium text-right">N°</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentMarginStats.items.slice(0, 6).map((item) => (
                    <tr key={item.name}>
                      <td
                        className="py-1.5 pr-4"
                        style={{ color: textPrimaryColor }}
                      >
                        {item.name}
                      </td>
                      <td
                        className="py-1.5 pr-4 text-right"
                        style={{ color: textPrimaryColor }}
                      >
                        {formatCurrency(item.marginTotal)}
                      </td>
                      <td
                        className="py-1.5 pr-4 text-right"
                        style={{ color: textPrimaryColor }}
                      >
                        {formatCurrency(item.marginAverage)}
                      </td>
                      <td
                        className="py-1.5 text-right"
                        style={{ color: textSecondaryColor }}
                      >
                        {item.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
