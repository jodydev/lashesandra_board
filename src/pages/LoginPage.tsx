import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Heart } from 'lucide-react';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryLight = theme.palette.primary.light;
  const primaryDark = theme.palette.primary.dark;
  const background = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const textPrimaryColor = theme.palette.text.primary;
  const textSecondaryColor = theme.palette.text.secondary;
  const paletteStyles = {
    '--primary': primary,
    '--primary-light': primaryLight,
    '--accent': primaryDark,
    '--secondary': background,
    '--surface': surface,
    '--text-primary': textPrimaryColor,
    '--text-secondary': textSecondaryColor,
    '--border-muted': alpha(textPrimaryColor, 0.08),
  } as React.CSSProperties;
  const glassPanelStyle: React.CSSProperties = {
    backgroundColor: alpha(surface, 0.86),
    borderColor: alpha(textPrimaryColor, 0.04),
    boxShadow: `0 24px 64px -32px ${alpha(textPrimaryColor, 0.32)}`,
  };
  const heroCardStyle: React.CSSProperties = {
    backgroundColor: alpha(surface, 0.74),
    boxShadow: `0 18px 44px -28px ${alpha(primaryDark, 0.45)}`,
  };
  const formCardStyle: React.CSSProperties = {
    backgroundColor: surface,
    boxShadow: `0 24px 64px -40px ${alpha(textPrimaryColor, 0.35)}`,
  };
  const statsCardStyle: React.CSSProperties = {
    backgroundColor: alpha(surface, 0.7),
  };
  const iconShadow = `0 18px 36px -18px ${alpha(primaryDark, 0.4)}`;
  const accentShadow = `0 24px 50px -20px ${alpha(primaryDark, 0.55)}`;
  const accentShadowHover = `0 28px 60px -24px ${alpha(primaryDark, 0.6)}`;
  const heroGlowStyle: React.CSSProperties = { backgroundColor: alpha(primary, 0.22) };
  const accentGlowStyle: React.CSSProperties = { backgroundColor: alpha(primaryDark, 0.16) };

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      // Redirect based on user email
      if (user.email === 'lasheshandra@gmail.com') {
        navigate('/lashesandra/home');
      } else if (user.email === 'isabellenails@gmail.com') {
        navigate('/isabellenails/home');
      } else {
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email è richiesta';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Inserisci un indirizzo email valido';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password è richiesta';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password deve essere di almeno 6 caratteri';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Credenziali non valide. Controlla email e password.' });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: 'Email non confermata. Controlla la tua casella di posta.' });
        } else {
          setErrors({ general: 'Errore durante il login. Riprova più tardi.' });
        }
      } else {
        // Success - redirect based on user email
        if (formData.email === 'lasheshandra@gmail.com') {
          navigate('/lashesandra/home');
        } else if (formData.email === 'isabellenails@gmail.com') {
          navigate('/isabellenails/home');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setErrors({ general: 'Errore imprevisto. Riprova più tardi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  if (loading) {
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

      <div className="relative flex min-h-screen flex-col px-6 py-10 xl:px-16 xl:py-12">
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
              <h1 className="text-base font-semibold text-[color:var(--text-primary)]">Area Riservata</h1>
            </div>
          </div>
        </header>

        <main className="mt-12 flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="grid w-full max-w-3xl grid-cols-1 gap-8 rounded-[2.5rem] border p-10 backdrop-blur"
            style={glassPanelStyle}
          >

 

              <div >
                <div className="mb-8 space-y-2">
                  <h2 className="text-3xl font-semibold text-[color:var(--text-primary)]">Bentornata</h2>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Accedi con le tue credenziali per proseguire nella tua dashboard professionale.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3"
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <p className="text-sm text-red-600">{errors.general}</p>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-[color:var(--text-primary)]">
                      Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Mail className="h-5 w-5 text-[color:var(--text-secondary)]" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        className={`w-full rounded-2xl border bg-[color:var(--surface)] px-12 py-3 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)] focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40 transition-all duration-200 ${
                          errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-[color:var(--border-muted)]'
                        }`}
                        placeholder="nome@email.com"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        id="email-error"
                        className="text-sm text-red-500"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-[color:var(--text-primary)]">
                      Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Lock className="h-5 w-5 text-[color:var(--text-secondary)]" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        className={`w-full rounded-2xl border bg-[color:var(--surface)] px-12 py-3 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)] focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40 transition-all duration-200 ${
                          errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-[color:var(--border-muted)]'
                        }`}
                        placeholder="••••••••"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--accent)] focus:text-[color:var(--accent)]"
                        aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        id="password-error"
                        className="text-sm text-red-500"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting || loading}
                    whileHover={{ scale: 1.01, boxShadow: accentShadowHover }}
                    whileTap={{ scale: 0.99 }}
                    className="group relative flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] px-4 py-3 text-base font-semibold text-white transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:bg-gradient-to-r disabled:from-gray-300 disabled:to-gray-400"
                    style={{ boxShadow: accentShadow }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                        <span>Accesso in corso...</span>
                      </div>
                    ) : (
                      'Accedi'
                    )}
                  </motion.button>
                </form>

                <div className="mt-10 text-center text-xs uppercase tracking-[0.25em] text-[color:var(--text-secondary)]">
                  Solo per utenti autorizzati
                </div>
              </div>
   
   
          </motion.div>
        </main>
      </div>
    </div>
  );
}
