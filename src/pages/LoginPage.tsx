import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Heart, ScanFace } from 'lucide-react';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { isFaceIdAvailable, performFaceIdAuth } from '../lib/faceIdPlugin';

/** Credenziali usate dopo riconoscimento Face ID (app single-user, mock). */
const FACE_ID_EMAIL = 'lasheshandra@gmail.com';
const FACE_ID_PASSWORD = 'Test123';

const DEBUG = true; // log di debug – disattivare in produzione
const log = (...args: unknown[]) => DEBUG && console.log('[LoginPage]', ...args);

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(true);
  const [faceIdSubmitting, setFaceIdSubmitting] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const faceIdTouchHandledRef = useRef(false);

  log('render', { user: user?.email, loading, faceIdLoading, faceIdAvailable, faceIdSubmitting, error });
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;
  const background = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const textPrimaryColor = theme.palette.text.primary;
  const textSecondaryColor = theme.palette.text.secondary;
  const paletteStyles = {
    '--primary': primary,
    '--accent': primaryDark,
    '--secondary': background,
    '--surface': surface,
    '--text-primary': textPrimaryColor,
    '--text-secondary': textSecondaryColor,
  } as React.CSSProperties;
  const glassPanelStyle: React.CSSProperties = {
    backgroundColor: alpha(surface, 0.86),
    borderColor: alpha(textPrimaryColor, 0.04),
    boxShadow: `0 24px 64px -32px ${alpha(textPrimaryColor, 0.32)}`,
  };
  const iconShadow = `0 18px 36px -18px ${alpha(primaryDark, 0.4)}`;
  const accentShadow = `0 24px 50px -20px ${alpha(primaryDark, 0.55)}`;
  const accentShadowHover = `0 28px 60px -24px ${alpha(primaryDark, 0.6)}`;
  const heroGlowStyle: React.CSSProperties = { backgroundColor: alpha(primary, 0.22) };
  const accentGlowStyle: React.CSSProperties = { backgroundColor: alpha(primaryDark, 0.16) };

  useEffect(() => {
    if (user && !loading) {
      log('auth redirect', user.email);
      if (user.email === 'lasheshandra@gmail.com') {
        navigate('/lashesandra/home');
      } else if (user.email === 'isabellenails@gmail.com') {
        navigate('/isabellenails/home');
      } else {
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let cancelled = false;
    const FACE_ID_CHECK_DELAY_MS = 800;
    const FACE_ID_CHECK_TIMEOUT_MS = 5000;
    log('Face ID check scheduled', { delayMs: FACE_ID_CHECK_DELAY_MS, timeoutMs: FACE_ID_CHECK_TIMEOUT_MS });

    const delay = new Promise<void>((resolve) => setTimeout(resolve, FACE_ID_CHECK_DELAY_MS));
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => {
        log('Face ID check timeout');
        resolve(false);
      }, FACE_ID_CHECK_TIMEOUT_MS);
    });

    (async () => {
      await delay;
      if (cancelled) return;
      log('Face ID check start (after delay)');
      try {
        const available = await Promise.race([isFaceIdAvailable(), timeout]);
        log('Face ID race result', { available, cancelled });
        if (!cancelled) setFaceIdAvailable(available);
      } catch (_err) {
        log('Face ID check error', _err);
        if (!cancelled) setFaceIdAvailable(false);
      } finally {
        if (!cancelled) {
          setFaceIdLoading(false);
          log('Face ID check done, setFaceIdLoading(false)');
        }
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId!);
    };
  }, []);

  const handleFaceIdLogin = async () => {
    log('handleFaceIdLogin called');
    setFaceIdSubmitting(true);
    setError(null);
    try {
      log('Face ID auth start');
      await performFaceIdAuth('Accedi a LashesAndra Board');
      log('Face ID auth success, signing in...');
      const { error: signInError } = await signIn(FACE_ID_EMAIL, FACE_ID_PASSWORD);
      if (signInError) {
        log('signIn error', signInError);
        setError(null);
        setShowManualLogin(true);
        return;
      }
      log('signIn ok, navigate /lashesandra/home');
      navigate('/lashesandra/home');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      log('handleFaceIdLogin catch', { message, err });
      setError(null);
      setShowManualLogin(true);
    } finally {
      setFaceIdSubmitting(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Inserisci email e password.');
      return;
    }
    setError(null);
    setManualSubmitting(true);
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        setError(signInError);
        return;
      }
      // La navigazione è gestita dall'useEffect che osserva user
    } finally {
      setManualSubmitting(false);
    }
  };

  if (loading) {
    log('UI: loading (auth)');
    return (
      <div style={paletteStyles} className="min-h-[100dvh] bg-[color:var(--secondary)] flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: alpha(primary, 0.2), borderBottomColor: primary }}
        />
      </div>
    );
  }

  return (
    <div style={paletteStyles} className="relative min-h-[100dvh] bg-[color:var(--secondary)] text-[color:var(--text-primary)] flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full blur-3xl" style={heroGlowStyle} />
        <div className="absolute -right-24 -bottom-20 h-[28rem] w-[28rem] rounded-full blur-3xl" style={accentGlowStyle} />
      </div>

      <div className="relative flex flex-1 flex-col min-h-0 px-4 py-6 sm:px-6 sm:py-8 md:p-6 xl:px-16 xl:py-12">
        <header className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--accent)]"
              style={{ boxShadow: iconShadow }}
            >
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </motion.div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[color:var(--accent)]">Lashesandra Studio</p>
              <h1 className="text-sm sm:text-base font-semibold text-[color:var(--text-primary)]">Area riservata</h1>
            </div>
          </div>
        </header>

        <main className="flex flex-1 min-h-0 items-center justify-center py-4 sm:py-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md rounded-3xl border p-6 sm:p-8 md:p-10 backdrop-blur flex flex-col items-center flex-shrink-0"
            style={glassPanelStyle}
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-[color:var(--text-primary)] mb-1.5 sm:mb-2">Bentornata</h2>
            <p className="text-sm text-[color:var(--text-secondary)] mb-6 sm:mb-10 text-center max-w-[280px] sm:max-w-none">
              {(showManualLogin || !faceIdAvailable) ? 'Accedi con email e password' : 'Tocca per accedere con Face ID'}
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 flex w-full items-start gap-3 rounded-xl sm:rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                <p className="text-sm text-red-600 break-words">{error}</p>
              </motion.div>
            )}

            {(showManualLogin || !faceIdAvailable) ? (
              (log('UI: manual login form', { showManualLogin, faceIdAvailable }), (
              <form onSubmit={handleManualLogin} className="flex w-full flex-col gap-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-[color:var(--text-secondary)]">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="es. tu@email.com"
                    className="w-full min-h-[48px] rounded-xl border border-[color:var(--text-primary)]/12 bg-[color:var(--surface)] px-4 py-3 text-base text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)]/60 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20 touch-manipulation"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-[color:var(--text-secondary)]">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    enterKeyHint="go"
                    className="w-full min-h-[48px] rounded-xl border border-[color:var(--text-primary)]/12 bg-[color:var(--surface)] px-4 py-3 text-base text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)]/60 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20 touch-manipulation"
                  />
                </div>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="mt-2 w-full min-h-[48px] rounded-xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--accent)] py-3.5 font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation active:opacity-90"
                  style={{ boxShadow: accentShadow }}
                >
                  {manualSubmitting ? 'Accesso in corso...' : 'Accedi'}
                </button>
                {faceIdAvailable && (
                  <button
                    type="button"
                    onClick={() => { setShowManualLogin(false); setError(null); }}
                    className="min-h-[44px] flex items-center justify-center w-full py-3 text-sm text-[color:var(--primary)] font-medium touch-manipulation active:opacity-80"
                  >
                    Usa Face ID
                  </button>
                )}
              </form>
              ))
            ) : faceIdLoading ? (
              (log('UI: Face ID loading spinner'), (
              <div className="flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center rounded-full bg-[color:var(--surface)]/60">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--primary)]/30 border-t-[color:var(--primary)]" />
              </div>
              ))
            ) : (
              (log('UI: Face ID button'), (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex shrink-0"
              >
                <button
                  type="button"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    if (faceIdTouchHandledRef.current) {
                      faceIdTouchHandledRef.current = false;
                      e.preventDefault();
                      return;
                    }
                    handleFaceIdLogin();
                  }}
                  onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => {
                    if (e.pointerType === 'touch') {
                      faceIdTouchHandledRef.current = true;
                      handleFaceIdLogin();
                    }
                  }}
                  disabled={faceIdSubmitting}
                  className="flex min-h-[176px] min-w-[176px] sm:h-40 sm:w-40 sm:min-h-0 sm:min-w-0 flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--accent)] text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation active:opacity-90"
                  style={{ boxShadow: accentShadow }}
                  aria-label="Accedi con Face ID"
                >
                  {faceIdSubmitting ? (
                    <div className="h-12 w-12 sm:h-14 sm:w-14 animate-spin rounded-full border-[3px] border-white/80 border-t-transparent" />
                  ) : (
                    <ScanFace className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.5} />
                  )}
                  <span className="text-sm font-semibold">
                    {faceIdSubmitting ? 'Verifica...' : 'Face ID'}
                  </span>
                </button>
              </motion.div>
              ))
            )}

            <p className="mt-6 sm:mt-10 text-center text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[color:var(--text-secondary)]">
              Solo per utenti autorizzati
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
