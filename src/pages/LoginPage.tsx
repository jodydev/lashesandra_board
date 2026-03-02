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
        setError('Accesso non riuscito. Riprova.');
        return;
      }
      log('signIn ok, navigate /lashesandra/home');
      navigate('/lashesandra/home');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      log('handleFaceIdLogin catch', { message, err });
      if (message?.toLowerCase().includes('cancel') || message?.toLowerCase().includes('user')) {
        setError('Accesso annullato.');
      } else {
        setError('Face ID non disponibile. Riprova.');
      }
    } finally {
      setFaceIdSubmitting(false);
    }
  };

  if (loading) {
    log('UI: loading (auth)');
    return (
      <div style={paletteStyles} className="min-h-screen bg-[color:var(--secondary)] flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: alpha(primary, 0.2), borderBottomColor: primary }}
        />
      </div>
    );
  }

  return (
    <div style={paletteStyles} className="relative min-h-screen bg-[color:var(--secondary)] text-[color:var(--text-primary)]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full blur-3xl" style={heroGlowStyle} />
        <div className="absolute -right-24 -bottom-20 h-[28rem] w-[28rem] rounded-full blur-3xl" style={accentGlowStyle} />
      </div>

      <div className="relative flex min-h-screen flex-col px-6 py-20 xl:px-16 xl:py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--accent)]"
              style={{ boxShadow: iconShadow }}
            >
              <Heart className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">Lashesandra Studio</p>
              <h1 className="text-base font-semibold text-[color:var(--text-primary)]">Area riservata</h1>
            </div>
          </div>
        </header>

        <main className="mt-12 flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md rounded-[2.5rem] border p-10 backdrop-blur flex flex-col items-center"
            style={glassPanelStyle}
          >
            <h2 className="text-2xl font-semibold text-[color:var(--text-primary)] mb-2">Bentornata</h2>
            <p className="text-sm text-[color:var(--text-secondary)] mb-10 text-center">
              Tocca per accedere con Face ID
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {faceIdLoading ? (
              (log('UI: Face ID loading spinner'), (
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[color:var(--surface)]/60">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--primary)]/30 border-t-[color:var(--primary)]" />
              </div>
              ))
            ) : faceIdAvailable ? (
              (log('UI: Face ID button'), (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex shrink-0"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if (faceIdTouchHandledRef.current) {
                      faceIdTouchHandledRef.current = false;
                      e.preventDefault();
                      return;
                    }
                    handleFaceIdLogin();
                  }}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      faceIdTouchHandledRef.current = true;
                      handleFaceIdLogin();
                    }
                  }}
                  disabled={faceIdSubmitting}
                  className="flex h-40 w-40 flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--accent)] text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation active:opacity-90"
                  style={{ boxShadow: accentShadow }}
                  aria-label="Accedi con Face ID"
                >
                  {faceIdSubmitting ? (
                    <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-white/80 border-t-transparent" />
                  ) : (
                    <ScanFace className="h-20 w-20" strokeWidth={1.5} />
                  )}
                  <span className="text-sm font-semibold">
                    {faceIdSubmitting ? 'Verifica...' : 'Face ID'}
                  </span>
                </button>
              </motion.div>
              ))
            ) : (
              (log('UI: fallback (Face ID non disponibile)'), (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-dashed border-[color:var(--text-secondary)]/30 bg-[color:var(--surface)]/40">
                  <ScanFace className="h-20 w-20 text-[color:var(--text-secondary)]/50" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-[color:var(--text-secondary)] max-w-[260px]">
                  Apri l&apos;app su iPhone o iPad per accedere con Face ID
                </p>
              </div>
              ))
            )}



            <p className="mt-10 text-center text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
              Solo per utenti autorizzati
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
