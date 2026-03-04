import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  Shield,
  LogOut,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
  Package,
  Sparkles,
  Euro,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FullPageLoader from '../components/FullPageLoader';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { useAppColors } from '../hooks/useAppColors';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { appType } = useApp();
  const colors = useAppColors();
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;
  const accentSoft = `${colors.primary}29`;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        setProfile({
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at,
          last_sign_in_at: data.user.last_sign_in_at || null,
          email_confirmed_at: data.user.email_confirmed_at || null
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const validatePasswordForm = (): boolean => {
    const errors: PasswordErrors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Password attuale è richiesta';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Nuova password è richiesta';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'La nuova password deve essere di almeno 6 caratteri';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Conferma password è richiesta';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Le password non coincidono';
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'La nuova password deve essere diversa da quella attuale';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    setPasswordErrors({});

    try {
      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword
      });

      if (signInError) {
        setPasswordErrors({ currentPassword: 'Password attuale non corretta' });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        setPasswordErrors({ general: 'Errore durante l\'aggiornamento della password' });
        return;
      }

      setSuccessMessage('Password aggiornata con successo!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setPasswordErrors({ general: 'Errore imprevisto durante l\'aggiornamento' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));

    // Clear specific field error when user starts typing
    if (passwordErrors[name as keyof PasswordErrors]) {
      setPasswordErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Mai';
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <FullPageLoader message="Caricamento profilo..." />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <PageHeader title="Profilo" showBack backLabel="Indietro" />

      <main className="max-w-7xl mx-auto p-4">
        {/* Success Message (stile ClientList: no motion) */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

               {/* Sidebar Actions (stile ClientList: card con bordo accentSofter) */}
               <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl shadow-lg border p-6" style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: textPrimaryColor }}>
                Azioni Rapide
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate(appType === 'isabellenails' ? '/isabellenails/listino' : '/lashesandra/listino')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 hover:opacity-90"
                  style={{ backgroundColor: accentSofter, color: textPrimaryColor }}
                >
                  <Euro className="w-5 h-5" style={{ color: accentColor }} />
                  <span>Gestione listino prezzi</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>


          </div>

          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Card */}
            <div className="rounded-2xl shadow-lg border p-6" style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}>
              <div className="flex items-center space-x-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: textPrimaryColor }}>
                    Informazioni Profilo
                  </h2>
                  <p className="text-sm" style={{ color: textSecondaryColor }}>
                    Dati anagrafici e informazioni di contatto
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 rounded-xl" style={{ backgroundColor: accentSofter }}>
                  <Mail className="w-5 h-5" style={{ color: textSecondaryColor }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: textSecondaryColor }}>Email</p>
                    <p style={{ color: textPrimaryColor }}>{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl" style={{ backgroundColor: accentSofter }}>
                  <Calendar className="w-5 h-5" style={{ color: textSecondaryColor }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: textSecondaryColor }}>Account creato</p>
                    <p style={{ color: textPrimaryColor }}>{formatDate(profile?.created_at || null)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl" style={{ backgroundColor: accentSofter }}>
                  <Shield className="w-5 h-5" style={{ color: textSecondaryColor }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: textSecondaryColor }}>Email verificata</p>
                    <p style={{ color: textPrimaryColor }}>
                      {profile?.email_confirmed_at ? 'Sì' : 'No'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl" style={{ backgroundColor: accentSofter }}>
                  <Calendar className="w-5 h-5" style={{ color: textSecondaryColor }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: textSecondaryColor }}>Ultimo accesso</p>
                    <p style={{ color: textPrimaryColor }}>{formatDate(profile?.last_sign_in_at || null)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="rounded-2xl shadow-lg border p-6" style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: textPrimaryColor }}>
                Informazioni Account
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: textSecondaryColor }}>ID Utente:</span>
                  <span className="font-mono text-xs" style={{ color: textPrimaryColor }}>
                    {profile?.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: textSecondaryColor }}>Stato:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">Attivo</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: textSecondaryColor }}>Provider:</span>
                  <span style={{ color: textPrimaryColor }}>Email</span>
                </div>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="rounded-2xl shadow-lg border p-6" style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: textPrimaryColor }}>
                    Modifica Password
                  </h3>
                  <p style={{ color: textSecondaryColor }}>
                    Cambia la tua password per mantenere l'account sicuro
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-4 py-2 hover:opacity-90 text-white font-medium rounded-xl transition-all duration-200"
                  style={{ background: accentGradient }}
                >
                  {showPasswordForm ? 'Annulla' : 'Modifica Password'}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* General Error */}
                  {passwordErrors.general && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-400">{passwordErrors.general}</p>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password Attuale
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 pr-10 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors ${passwordErrors.currentPassword
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                          }`}
                        placeholder="Inserisci la password attuale"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nuova Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 pr-10 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors ${passwordErrors.newPassword
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                          }`}
                        placeholder="Inserisci la nuova password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Conferma Nuova Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 pr-10 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors ${passwordErrors.confirmPassword
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                          }`}
                        placeholder="Conferma la nuova password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex-1 text-white font-semibold py-3 px-4 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      style={{ background: accentGradient }}
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                          <span>Aggiornamento...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Aggiorna Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

     
        </div>
      </main>
    </div>
  );
}
