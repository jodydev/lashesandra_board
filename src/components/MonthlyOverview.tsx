import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Activity, Eye, Palette, Sparkles, CircleDot,
  Users, AlertTriangle, Target, BarChart2,
} from 'lucide-react';
import PageHeader from './PageHeader';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, Legend,
} from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import type {
  MonthlyStats, RetentionStats,
  NoShowCancellationStats, TreatmentMarginStats,
} from '../types';
import { useSupabaseServices } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../lib/utils';

dayjs.locale('it');

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:       '#FAF0E8',
  surface:  '#FFFFFF',
  accent:   '#C07850',
  accentDk: '#A05830',
  accentSft:'rgba(192,120,80,0.10)',
  accentMid:'rgba(192,120,80,0.18)',
  border:   '#EDE0D8',
  text:     '#2C2C2C',
  muted:    '#9A8880',
  ok:       '#22C55E',
  okSft:    'rgba(34,197,94,0.12)',
  warn:     '#F59E0B',
  warnSft:  'rgba(245,158,11,0.12)',
  red:      '#EF4444',
  redSft:   'rgba(239,68,68,0.10)',
  blue:     '#6366F1',
  blueSft:  'rgba(99,102,241,0.10)',
} as const;

const GRAD = `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`;

const WEEKDAY_LABELS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
type Period = 'day' | 'week' | 'month' | 'year';
const SERVICE_ICONS = [Eye, Palette, Sparkles, CircleDot, BarChart2];

// ─── Tooltip personalizzato Recharts ─────────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 14, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      fontSize: 13,
    }}>
      {label && <p style={{ fontWeight: 700, color: C.muted, marginBottom: 6, fontSize: 11 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || C.accent, fontWeight: 700 }}>
          {formatter ? formatter(p.value, p.name) : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, sub, change, icon: Icon, color = C.accent,
}: {
  title: string; value: string; sub?: string;
  change?: number | null; icon: React.ElementType; color?: string;
}) {
  const up   = (change ?? 0) >= 0;
  const hasChange = change !== null && change !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 22, padding: '16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: -18, right: -18,
        width: 80, height: 80, borderRadius: '50%',
        background: `#C0785018`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: `#C0785018`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color="#C07850" strokeWidth={2} />
        </div>
        {hasChange && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '3px 8px', borderRadius: 100,
            background: up ? C.okSft : C.redSft,
            fontSize: 11, fontWeight: 800,
            color: up ? C.ok : C.red,
          }}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(change!)}%
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>
        {title}
      </p>
      <p style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{sub}</p>}
    </motion.div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children, extra }: {
  title: string; subtitle?: string;
  children: React.ReactNode; extra?: React.ReactNode;
}) {
  return (
    <div style={{
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 24, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        padding: '16px 18px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
      }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{title}</p>
          {subtitle && <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitle}</p>}
        </div>
        {extra}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

// ─── Area chart: andamento ricavi mensile ─────────────────────────────────────
function RevenueAreaChart({ data, color }: {
  data: Array<{ day: number; revenue: number; appointments: number }>;
  color: string;
}) {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'appointments'>('revenue');

  const chartData = data.map(d => ({
    label: `${d.day}`,
    value: activeMetric === 'revenue' ? d.revenue : d.appointments,
  }));

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['revenue', 'appointments'] as const).map(m => (
          <button
            key={m} type="button"
            onClick={() => setActiveMetric(m)}
            style={{
              padding: '6px 14px', borderRadius: 100,
              border: `1.5px solid ${activeMetric === m ? color : C.border}`,
              background: activeMetric === m ? color : C.surface,
              color: activeMetric === m ? '#FFF' : C.muted,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {m === 'revenue' ? 'Entrate' : 'Appuntamenti'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis
            dataKey="label" tick={{ fontSize: 11, fill: C.muted }}
            tickLine={false} axisLine={false}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: C.muted }}
            tickLine={false} axisLine={false}
            tickFormatter={v => activeMetric === 'revenue' ? `€${v}` : `${v}`}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <CustomTooltip
                active={active} payload={payload} label={`Giorno ${label}`}
                formatter={(v: number) => activeMetric === 'revenue' ? formatCurrency(v) : `${v} appuntamenti`}
              />
            )}
          />
          <Area
            type="monotone" dataKey="value"
            stroke={color} strokeWidth={2.5}
            fill="url(#areaGrad)"
            dot={false} activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#FFF' }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Bar chart settimanale ────────────────────────────────────────────────────
function WeeklyBarChart({ data, highlight, color }: {
  data: Array<{ label: string; value: number }>;
  highlight: number; color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} tickFormatter={v => `€${v}`} />
        <Tooltip
          content={({ active, payload, label }) => (
            <CustomTooltip
              active={active} payload={payload} label={label}
              formatter={(v: number) => formatCurrency(v)}
            />
          )}
        />
        <Bar dataKey="value" radius={[8, 8, 4, 4]} animationDuration={800}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === highlight ? color : C.accentSft} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Pie chart trattamenti ────────────────────────────────────────────────────
function TreatmentPieChart({ data, colors: pieColors }: {
  data: Array<{ name: string; value: number; count: number }>;
  colors: string[];
}) {
  const [active, setActive] = useState<number | null>(null);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="50%"
          innerRadius={55} outerRadius={85}
          paddingAngle={3} dataKey="value"
          onMouseEnter={(_, i) => setActive(i)}
          onMouseLeave={() => setActive(null)}
          animationDuration={800}
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={pieColors[i % pieColors.length]}
              opacity={active === null || active === i ? 1 : 0.5}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active: a, payload }) => {
            if (!a || !payload?.length) return null;
            const d = payload[0];
            return (
              <CustomTooltip
                active={a} payload={payload}
                formatter={(v: number) => `${formatCurrency(v)} · ${data[d.payload?.index ?? 0]?.count ?? ''} appt.`}
              />
            );
          }}
        />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(v) => <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Retention radial chart ───────────────────────────────────────────────────
function RetentionRadialChart({ buckets, color }: {
  buckets: Array<{ weeks: number; percentage: number; retainedClients: number; totalClients: number }>;
  color: string;
}) {
  const data = buckets.map((b, i) => ({
    name: `${b.weeks} sett.`,
    value: b.percentage,
    fill: i === 0 ? color : i === 1 ? C.accentDk : C.warn,
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {buckets.map((b, i) => {
        const hue = i === 0 ? color : i === 1 ? C.accentDk : C.warn;
        const pct = b.percentage;
        const r = 28, circ = 2 * Math.PI * r;
        const dash = (pct / 100) * circ;
        return (
          <motion.div
            key={b.weeks}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '14px 8px', borderRadius: 18,
              background: `${hue}10`, border: `1.5px solid ${hue}28`,
            }}
          >
            {/* SVG ring */}
            <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={36} cy={36} r={r} fill="none" stroke={C.border} strokeWidth={6} />
              <motion.circle
                cx={36} cy={36} r={r} fill="none"
                stroke={hue} strokeWidth={6}
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circ}` }}
                animate={{ strokeDasharray: `${dash} ${circ}` }}
                transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 + 0.2 }}
              />
            </svg>
            <p style={{ fontWeight: 900, fontSize: 18, color: hue, marginTop: -8 }}>{pct}%</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 2 }}>{b.weeks} settimane</p>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {b.retainedClients}/{b.totalClients}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── No-show horizontal bar ───────────────────────────────────────────────────
function NoShowBar({ label, pct, count, color }: {
  label: string; pct: number; count: number; color: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}% <span style={{ fontWeight: 500, color: C.muted }}>({count})</span></span>
      </div>
      <div style={{ height: 8, borderRadius: 100, background: C.border, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 100, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Treatment margin horizontal bars ────────────────────────────────────────
function MarginChart({ items, color }: {
  items: Array<{ name: string; marginTotal: number; marginAverage: number; count: number }>;
  color: string;
}) {
  const max = Math.max(...items.map(i => i.marginTotal), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.slice(0, 6).map((item, i) => {
        const pct = (item.marginTotal / max) * 100;
        return (
          <div key={item.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.name}</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.muted }}>{formatCurrency(item.marginAverage)} media</span>
                <span style={{ fontSize: 13, fontWeight: 800, color }}>{formatCurrency(item.marginTotal)}</span>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 100, background: C.border, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.06 }}
                style={{ height: '100%', borderRadius: 100, background: `linear-gradient(90deg, ${color}, ${C.accentDk})` }}
              />
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{item.count} trattamenti</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mini heatmap ricavi giornalieri ──────────────────────────────────────────
function DayHeatmap({ data, color, daysInMonth }: {
  data: Array<{ day: number; revenue: number; appointments: number }>;
  color: string; daysInMonth: number;
}) {
  const map = new Map(data.map(d => [d.day, d]));
  const max = Math.max(...data.map(d => d.revenue), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const d = map.get(day);
          const intensity = d ? d.revenue / max : 0;
          const isHov = hovered === day;
          return (
            <div
              key={day}
              onMouseEnter={() => setHovered(day)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: d && d.revenue > 0
                  ? `rgba(192,120,80,${0.12 + intensity * 0.78})`
                  : C.border,
                border: isHov ? `1.5px solid ${color}` : '1.5px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
                transition: 'all 0.12s ease',
                transform: isHov ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: intensity > 0.5 ? '#FFF' : C.muted }}>
                {day}
              </span>

              {/* Tooltip */}
              {isHov && d && (
                <div style={{
                  position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                  zIndex: 10, minWidth: 110,
                  background: C.text, borderRadius: 10,
                  padding: '7px 10px', pointerEvents: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#FFF' }}>Giorno {day}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                    {formatCurrency(d.revenue)}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                    {d.appointments} appuntamenti
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: C.muted }}>Basso</span>
        {[0.12, 0.3, 0.5, 0.7, 0.9].map(o => (
          <div key={o} style={{ width: 14, height: 14, borderRadius: 4, background: `rgba(192,120,80,${o})` }} />
        ))}
        <span style={{ fontSize: 10, color: C.muted }}>Alto</span>
      </div>
    </div>
  );
}

// ─── Risky client card ────────────────────────────────────────────────────────
function RiskyClientRow({ entry }: { entry: any }) {
  const total = entry.noShowCount + entry.cancellationCount;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', borderRadius: 14,
      background: C.warnSft, border: `1.5px solid rgba(245,158,11,0.2)`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: 'rgba(245,158,11,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 15, color: C.warn,
      }}>
        {entry.client.nome.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
          {entry.client.nome} {entry.client.cognome}
        </p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
          {entry.noShowCount} no-show · {entry.cancellationCount} cancellazioni
        </p>
      </div>
      <div style={{
        padding: '3px 10px', borderRadius: 100,
        background: 'rgba(245,158,11,0.25)',
        fontSize: 11, fontWeight: 800, color: '#78350F',
        whiteSpace: 'nowrap' as const,
      }}>
        {total} eventi
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 44, borderRadius: 100, background: C.border }} className="animate-pulse" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ height: 120, borderRadius: 22, background: C.border }} className="animate-pulse" />
        ))}
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 220, borderRadius: 24, background: C.border }} className="animate-pulse" />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MonthlyOverview() {
  const { statsService } = useSupabaseServices();
  const colors = useAppColors();
  const { appType } = useApp();

  const [period,      setPeriod]      = useState<Period>('month');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [stats,       setStats]       = useState<MonthlyStats | null>(null);
  const [prevStats,   setPrevStats]   = useState<MonthlyStats | null>(null);
  const [dailyStats,  setDailyStats]  = useState<Array<{ day: number; revenue: number; clients: number; appointments: number }>>([]);
  const [treatmentDist,  setTreatmentDist]  = useState<Array<{ name: string; value: number; count: number; color: string }>>([]);
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [noShowStats,    setNoShowStats]    = useState<NoShowCancellationStats | null>(null);
  const [marginStats,    setMarginStats]    = useState<TreatmentMarginStats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const accentColor = colors.primary;
  const pieColors   = useMemo(() => [accentColor, colors.primaryDark, colors.primaryLight, C.warn, C.blue], [colors]);

  useEffect(() => { loadStats(); }, [currentDate, appType]);

  const loadStats = async () => {
    try {
      setLoading(true); setError(null);
      const y = currentDate.year(), m = currentDate.month() + 1;
      const prev = currentDate.subtract(1, 'month');
      const pStart = currentDate.startOf('month').format('YYYY-MM-DD');
      const pEnd   = currentDate.endOf('month').format('YYYY-MM-DD');

      const [monthly, daily, treatment, prevMonthly, retention, noShow, margin] = await Promise.all([
        statsService.getMonthlyStats(y, m),
        statsService.getDailyStats(y, m),
        statsService.getTreatmentDistribution(y, m),
        statsService.getMonthlyStats(prev.year(), prev.month() + 1),
        statsService.getRetentionStats(pStart, pEnd),
        statsService.getNoShowCancellationStats(pStart, pEnd),
        statsService.getTreatmentMarginStats(pStart, pEnd, appType),
      ]);

      setStats(monthly); setPrevStats(prevMonthly);
      setDailyStats(daily); setTreatmentDist(treatment);
      setRetentionStats(retention); setNoShowStats(noShow); setMarginStats(margin);
    } catch {
      setError('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived KPI values ─────────────────────────────────────────────────────
  const pctRevenue = stats && prevStats && prevStats.totalRevenue > 0
    ? Math.round(((stats.totalRevenue - prevStats.totalRevenue) / prevStats.totalRevenue) * 100)
    : null;

  const pctAppts = stats && prevStats && prevStats.totalAppointments > 0
    ? Math.round(((stats.totalAppointments - prevStats.totalAppointments) / prevStats.totalAppointments) * 100)
    : null;

  const displayTotals = useMemo(() => {
    if (!stats) return { revenue: 0, appointments: 0, clients: 0 };
    if (!dailyStats.length || period === 'month' || period === 'year')
      return { revenue: stats.totalRevenue, appointments: stats.totalAppointments, clients: stats.totalClients ?? 0 };

    if (period === 'day') {
      const d = dailyStats.find(x => x.day === currentDate.date());
      return { revenue: d?.revenue ?? 0, appointments: d?.appointments ?? 0, clients: d?.clients ?? 0 };
    }

    if (period === 'week') {
      const ws = currentDate.startOf('isoWeek'), we = currentDate.endOf('isoWeek');
      const ms = currentDate.startOf('month'), me = currentDate.endOf('month');
      const s = ws.isBefore(ms) ? ms : ws, e = we.isAfter(me) ? me : we;
      let rev = 0, apts = 0, cls = 0;
      for (let d = s.date(); d <= e.date(); d++) {
        const x = dailyStats[d - 1];
        if (!x) continue;
        rev += x.revenue; apts += x.appointments; cls += x.clients;
      }
      return { revenue: rev, appointments: apts, clients: cls };
    }

    return { revenue: stats.totalRevenue, appointments: stats.totalAppointments, clients: stats.totalClients ?? 0 };
  }, [stats, dailyStats, period, currentDate]);

  // Weekly chart data
  const weeklyChartData = useMemo(() => {
    const mo = currentDate.month(), yr = currentDate.year();
    const dayToRev = new Map(dailyStats.map(d => [d.day, d.revenue]));
    const ref = currentDate.isAfter(dayjs()) ? currentDate.endOf('month') : dayjs();
    const ws  = ref.startOf('isoWeek');
    return WEEKDAY_LABELS.map((lbl, i) => {
      const d = ws.add(i, 'day');
      const inMonth = d.month() === mo && d.year() === yr;
      return { label: lbl, value: inMonth ? dayToRev.get(d.date()) ?? 0 : 0 };
    });
  }, [dailyStats, currentDate]);

  const weekHighlight = useMemo(() => {
    const d = dayjs().day();
    return d === 0 ? 6 : d - 1;
  }, []);

  const daysInMonth = currentDate.daysInMonth();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <PageHeader title="Statistiche" showBack backLabel="Indietro" />

      {loading ? (
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <StatSkeleton />
        </div>
      ) : (
        <main style={{ maxWidth: 540, margin: '0 auto', padding: '16px 16px 80px' }}
          className="safe-area-content-below-header">

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '12px 16px', borderRadius: 14,
              background: '#FEF2F2', border: '1.5px solid rgba(239,68,68,0.3)',
              fontSize: 13, color: C.red, fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* Period tabs */}
          <div style={{
            display: 'flex', background: C.surface,
            border: `1.5px solid ${C.border}`, borderRadius: 100,
            padding: 4, marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            {(['day', 'week', 'month', 'year'] as Period[]).map((p, i) => {
              const labels = ['Giorno', 'Settimana', 'Mese', 'Anno'];
              const active = period === p;
              return (
                <button
                  key={p} type="button"
                  onClick={() => setPeriod(p)}
                  style={{
                    flex: 1, padding: '9px 4px', borderRadius: 100,
                    border: 'none',
                    background: active ? accentColor : 'transparent',
                    color: active ? '#FFF' : C.muted,
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  {labels[i]}
                </button>
              );
            })}
          </div>

          {/* Month navigator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20, padding: '8px 4px',
          }}>
            <button
              type="button"
              onClick={() => setCurrentDate(d => d.subtract(1, 'month'))}
              style={{
                width: 36, height: 36, borderRadius: 12,
                background: C.surface, border: `1.5px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={18} color={C.muted} />
            </button>
            <p style={{ fontWeight: 800, fontSize: 16, color: C.text, textTransform: 'capitalize' }}>
              {currentDate.format('MMMM YYYY')}
            </p>
            <button
              type="button"
              onClick={() => setCurrentDate(d => d.add(1, 'month'))}
              style={{
                width: 36, height: 36, borderRadius: 12,
                background: C.surface, border: `1.5px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={18} color={C.muted} />
            </button>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
            <KpiCard
              title="Entrate"
              value={formatCurrency(displayTotals.revenue)}
              sub={period === 'month' && prevStats ? `vs ${formatCurrency(prevStats.totalRevenue)} mese prec.` : undefined}
              change={period === 'month' ? pctRevenue : null}
              icon={TrendingUp} color={accentColor}
            />
            <KpiCard
              title="Appuntamenti"
              value={String(displayTotals.appointments)}
              sub={period === 'month' && prevStats ? `vs ${prevStats.totalAppointments} mese prec.` : undefined}
              change={period === 'month' ? pctAppts : null}
              icon={Activity} color={C.blue}
            />
          </div>

          {/* Andamento ricavi (area + toggle) */}
          {dailyStats.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionCard
                title="Andamento mensile"
                subtitle={currentDate.format('MMMM YYYY')}
              >
                <RevenueAreaChart data={dailyStats} color={accentColor} />
              </SectionCard>
            </div>
          )}

          {/* Heatmap giornaliero */}
          {dailyStats.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionCard
                title="Mappa ricavi"
                subtitle="Intensità entrate per giorno"
              >
                <DayHeatmap data={dailyStats} color={accentColor} daysInMonth={daysInMonth} />
              </SectionCard>
            </div>
          )}

          {/* Grafico settimanale */}
          <div style={{ marginBottom: 16 }}>
            <SectionCard title="Settimana corrente" subtitle="Entrate da lunedì a domenica">
              {weeklyChartData.some(d => d.value > 0)
                ? <WeeklyBarChart data={weeklyChartData} highlight={weekHighlight} color={accentColor} />
                : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <Activity size={28} color={C.border} />
                    <p style={{ fontSize: 13, color: C.muted }}>Nessun dato per questa settimana</p>
                  </div>
                )
              }
            </SectionCard>
          </div>

          {/* Servizi più richiesti */}
          {treatmentDist.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionCard title="Servizi più richiesti" subtitle="Distribuzione entrate per tipo">
                <TreatmentPieChart data={treatmentDist} colors={pieColors} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  {treatmentDist.slice(0, 5).map((item, i) => {
                    const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                    const cl = pieColors[i % pieColors.length];
                    return (
                      <div key={item.name} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 14,
                        background: `${cl}0F`, border: `1.5px solid ${cl}22`,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                          background: `${cl}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={16} color={cl} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{item.name}</p>
                          <p style={{ fontSize: 12, color: C.muted }}>{item.count} appuntamenti</p>
                        </div>
                        <p style={{ fontWeight: 800, fontSize: 14, color: cl, flexShrink: 0 }}>
                          {formatCurrency(item.value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          )}

          {/* Retention */}
          {retentionStats?.buckets?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionCard
                title="Retention clienti"
                subtitle="% che tornano entro 3, 4 e 5 settimane"
              >
                <RetentionRadialChart buckets={retentionStats.buckets} color={accentColor} />
              </SectionCard>
            </div>
          )}

          {/* No-show e cancellazioni */}
          {noShowStats && (
            <div style={{ marginBottom: 16 }}>
              <SectionCard
                title="No-show e cancellazioni"
                subtitle={`Su ${noShowStats.totalAppointments} appuntamenti totali`}
              >
                <NoShowBar
                  label="No-show"
                  pct={noShowStats.noShowPercentage}
                  count={noShowStats.noShowCount}
                  color={C.red}
                />
                <NoShowBar
                  label="Cancellazioni"
                  pct={noShowStats.cancellationPercentage}
                  count={noShowStats.cancellationCount}
                  color={C.warn}
                />

                {noShowStats.riskyClients?.length > 0 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 10px' }}>
                      <AlertTriangle size={14} color={C.warn} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Clienti a rischio
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {noShowStats.riskyClients.slice(0, 5).map(entry => (
                        <RiskyClientRow key={entry.client.id} entry={entry} />
                      ))}
                    </div>
                  </>
                )}
              </SectionCard>
            </div>
          )}

          {/* Margini trattamenti */}
          {marginStats?.items?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionCard
                title="Margini per trattamento"
                subtitle="Ordinati per margine totale"
              >
                <MarginChart items={marginStats.items} color={accentColor} />
              </SectionCard>
            </div>
          )}

        </main>
      )}
    </div>
  );
}