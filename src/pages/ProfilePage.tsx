import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
          last_sign_in_at: data.user.last_sign_in_at,
          email_confirmed_at: data.user.email_confirmed_at
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center space-x-3"
          >
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Informazioni Profilo
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gestisci i tuoi dati personali e le impostazioni account
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account creato</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(profile?.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email verificata</p>
                    <p className="text-gray-900 dark:text-white">
                      {profile?.email_confirmed_at ? 'Sì' : 'No'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ultimo accesso</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(profile?.last_sign_in_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Modifica Password
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Cambia la tua password per mantenere l'account sicuro
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-xl transition-colors duration-200"
                >
                  {showPasswordForm ? 'Annulla' : 'Modifica Password'}
                </button>
              </div>

              {showPasswordForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handlePasswordChange}
                  className="space-y-4"
                >
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
                        className={`block w-full px-3 py-3 pr-10 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                          passwordErrors.currentPassword
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
                        className={`block w-full px-3 py-3 pr-10 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                          passwordErrors.newPassword
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
                        className={`block w-full px-3 py-3 pr-10 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                          passwordErrors.confirmPassword
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
                    <motion.button
                      type="submit"
                      disabled={isChangingPassword}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Aggiornamento...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Aggiorna Password</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </div>
          </motion.div>

          {/* Sidebar Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Azioni Rapide
              </h3>
              <div className="space-y-3">                
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-red-50 flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </motion.button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informazioni Account
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID Utente:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">
                    {profile?.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Stato:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Attivo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Provider:</span>
                  <span className="text-gray-900 dark:text-white">
                    Email
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
