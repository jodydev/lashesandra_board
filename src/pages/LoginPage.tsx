import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AtSign, Eye, EyeOff, AlertCircle, ScanFace, ArrowRight, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isFaceIdAvailable, performFaceIdAuth } from '../lib/faceIdPlugin';

const FACE_ID_EMAIL = 'lasheshandra@gmail.com';
const FACE_ID_PASSWORD = 'Test123';
const APP_VERSION = '2.4.0';

const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log('[LoginPage]', ...args);

const accentColor = '#E91E63';
const accentGradient = 'linear-gradient(135deg, #E91E63 0%, #C2185B 50%, #AD1457 100%)';
const textSecondary = '#6b7280';
const inputBg = '#f3f4f6';
const borderColor = '#e5e7eb';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(true);
  const [faceIdSubmitting, setFaceIdSubmitting] = useState(false);
  const [_showManualLogin, setShowManualLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const faceIdTouchHandledRef = useRef(false);

  log('render', { user: user?.email, loading, faceIdLoading, faceIdAvailable, faceIdSubmitting, error });

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
    const delay = new Promise<void>((resolve) => setTimeout(resolve, FACE_ID_CHECK_DELAY_MS));
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => resolve(false), FACE_ID_CHECK_TIMEOUT_MS);
    });
    (async () => {
      await delay;
      if (cancelled) return;
      try {
        const available = await Promise.race([isFaceIdAvailable(), timeout]);
        if (!cancelled) setFaceIdAvailable(available);
      } catch {
        if (!cancelled) setFaceIdAvailable(false);
      } finally {
        if (!cancelled) setFaceIdLoading(false);
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
      await performFaceIdAuth('Accedi a LashesAndra Board');
      const { error: signInError } = await signIn(FACE_ID_EMAIL, FACE_ID_PASSWORD);
      if (signInError) {
        setError(null);
        setShowManualLogin(true);
        return;
      }
      navigate('/lashesandra/home');
    } catch {
      setError(null);
      setShowManualLogin(true);
    } finally {
      setFaceIdSubmitting(false);
    }
  };

  const handleManualLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Inserisci email e password.');
      return;
    }
    setError(null);
    setManualSubmitting(true);
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) setError(signInError);
    } finally {
      setManualSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-[#E91E63]"
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col text-[#1a1a1a] pt-20">
      <main className="flex-1 overflow-y-auto px-6 pt-8 pb-6 flex flex-col items-center">
        {/* Logo + branding */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-4"
          >
            <img src="/logo.png" alt="LashesAndra" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight">LashesAndra</h2>
          <p className="text-sm mt-1" style={{ color: textSecondary }}>Gestionale appuntamenti</p>
        </div>

        {/* Form */}
        <div className="w-full max-w-[340px]">
          {error && (
            <div
              className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
              <p className="text-sm text-red-600 break-words">{error}</p>
            </div>
          )}

          <form onSubmit={handleManualLogin} className="flex flex-col gap-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: textSecondary }}>
                Email
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="nome@esempio.it"
                  className="w-full min-h-[52px] rounded-xl border-0 pl-4 pr-12 py-3 text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#E91E63]/30 touch-manipulation"
                  style={{ backgroundColor: inputBg }}
                />
                <span className="absolute right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                  <AtSign className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: textSecondary }}>
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="********"
                  enterKeyHint="go"
                  className="w-full min-h-[52px] rounded-xl border-0 pl-4 pr-12 py-3 text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#E91E63]/30 touch-manipulation"
                  style={{ backgroundColor: inputBg }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5 active:opacity-80"
                  style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={manualSubmitting}
              className="w-full min-h-[52px] rounded-xl py-3.5 font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70 active:opacity-90 touch-manipulation"
              style={{ background: accentGradient, boxShadow: '0 4px 14px rgba(233,30,99,0.4)' }}
            >
              {manualSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          {/* OPPURE + Accedi con FaceID */}
          {!faceIdLoading && faceIdAvailable && (
            <div className="w-full max-w-[340px] mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textSecondary }}>Oppure</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
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
                className="w-full min-h-[52px] rounded-xl border py-3.5 font-medium flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-50 active:opacity-90 disabled:opacity-70 touch-manipulation"
                style={{ borderColor }}
              >
                <span className="w-8 h-8 rounded-full flex items-center justify-center bg-pink-100 text-[#E91E63]">
                  <ScanFace className="w-4 h-4" strokeWidth={2} />
                </span>
                {faceIdSubmitting ? 'Verifica...' : 'Accedi con FaceID'}
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 py-4 text-center text-[10px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>
        Sviluppata con tanto ❤️ dal tuo Jody.
      </footer>
    </div>
  );
}
