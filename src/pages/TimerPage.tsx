import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';

const PRESETS_SEC = [30, 45, 60, 90] as const;

type TimerMode = 'countdown' | 'stopwatch';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTimeLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerPage() {
  const colors = useAppColors();
  const { appType } = useApp();
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [remaining, setRemaining] = useState(60);
  const [initialSeconds, setInitialSeconds] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const surfaceColor = '#FFFFFF';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;
  const accentSoft = `${colors.primary}29`;

  const tickCountdown = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setIsComplete(true);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  const tickStopwatch = useCallback(() => {
    setElapsed((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const tick = mode === 'countdown' ? tickCountdown : tickStopwatch;
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode, tickCountdown, tickStopwatch]);

  const handleStart = () => {
    setIsComplete(false);
    if (mode === 'countdown' && remaining === 0) {
      setRemaining(initialSeconds);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    if (mode === 'countdown') {
      setIsRunning(false);
      setIsComplete(false);
      setRemaining(initialSeconds);
    } else {
      setElapsed(0);
      // in stopwatch il cronometro continua dopo il reset
    }
  };

  const handlePreset = (seconds: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsComplete(false);
    setInitialSeconds(seconds);
    setRemaining(seconds);
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsComplete(false);
    setMode(newMode);
    if (newMode === 'stopwatch') {
      setElapsed(0);
    } else {
      setRemaining(initialSeconds);
    }
  };

  const displayBorderColor =
    mode === 'countdown' && isComplete ? '#22c55e' : accentSofter;
  const subtitleText =
    mode === 'countdown'
      ? 'Tempo di posa della colla per le ciglia'
      : "Il timer scorre all'infinito. Avvia per iniziare.";

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <PageHeader
        title="Timer colla"
        showBack
        backLabel="Indietro"
      />

      <main className="mx-auto max-w-lg px-4 pb-8 safe-area-content-below-header pt-6">
        {/* Mode toggle */}
        <div className="flex rounded-2xl border-2 p-1 mb-6" style={{ borderColor: accentSofter, backgroundColor: surfaceColor }}>
          <button
            type="button"
            onClick={() => handleModeChange('countdown')}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-opacity"
            style={{
              backgroundColor: mode === 'countdown' ? accentSoft : 'transparent',
              color: mode === 'countdown' ? accentColor : textSecondaryColor,
            }}
          >
            Tempo di posa
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('stopwatch')}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-opacity"
            style={{
              backgroundColor: mode === 'stopwatch' ? accentSoft : 'transparent',
              color: mode === 'stopwatch' ? accentColor : textSecondaryColor,
            }}
          >
            Cronometro
          </button>
        </div>

        <p className="text-center text-sm mb-6" style={{ color: textSecondaryColor }}>
          {subtitleText}
        </p>

        {/* Preset buttons - solo in countdown */}
        {mode === 'countdown' && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {PRESETS_SEC.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handlePreset(sec)}
                disabled={isRunning}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-opacity border"
                style={{
                  borderColor: initialSeconds === sec ? accentColor : accentSofter,
                  backgroundColor: initialSeconds === sec ? accentSoft : surfaceColor,
                  color: initialSeconds === sec ? accentColor : textPrimaryColor,
                }}
              >
                {sec}s
              </button>
            ))}
          </div>
        )}

        {/* Display */}
        <div
          className="rounded-3xl border-2 flex flex-col items-center justify-center py-10 px-6 mb-8 min-h-[200px]"
          style={{
            borderColor: displayBorderColor,
            backgroundColor: surfaceColor,
          }}
        >
          {mode === 'stopwatch' && (
            <>
              <span
                className="text-6xl font-bold tabular-nums tracking-tight"
                style={{ color: textPrimaryColor }}
              >
                {formatTimeLong(elapsed)}
              </span>
              <p className="text-sm mt-2" style={{ color: textSecondaryColor }}>
                {isRunning ? 'In corso...' : 'Avvia per far partire il cronometro'}
              </p>
            </>
          )}
          {mode === 'countdown' && isComplete && (
            <>
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <Timer className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">Pronto!</p>
              <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
                La colla è pronta per l&apos;applicazione
              </p>
            </>
          )}
          {mode === 'countdown' && !isComplete && (
            <>
              <span
                className="text-6xl font-bold tabular-nums tracking-tight"
                style={{ color: textPrimaryColor }}
              >
                {formatTime(remaining)}
              </span>
              <p className="text-sm mt-2" style={{ color: textSecondaryColor }}>
                {isRunning ? 'In attesa...' : 'Imposta il tempo e avvia'}
              </p>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {isRunning ? (
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center gap-2 rounded-2xl px-8 py-4 text-white font-semibold shadow-lg transition-opacity hover:opacity-90"
              style={{ background: accentGradient }}
            >
              <Pause className="h-6 w-6" />
              Pausa
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="flex items-center gap-2 rounded-2xl px-8 py-4 text-white font-semibold shadow-lg transition-opacity hover:opacity-90"
              style={{ background: accentGradient }}
            >
              <Play className="h-6 w-6" />
              {remaining === 0 ? 'Ricomincia' : 'Avvia'}
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            disabled={mode === 'countdown' && isRunning}
            className="flex items-center gap-2 rounded-2xl px-6 py-4 border-2 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              borderColor: accentSofter,
              backgroundColor: surfaceColor,
              color: textPrimaryColor,
            }}
          >
            <RotateCcw className="h-5 w-5" />
            Reset
          </button>
        </div>
      </main>
    </div>
  );
}
