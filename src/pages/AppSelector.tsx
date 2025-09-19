import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Star, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AppSelector() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const apps = [
    {
      id: 'lashesandra',
      name: 'LashesAndra',
      description: 'Gestione clienti e appuntamenti per LashesAndra',
      color: 'from-pink-500 to-pink-600',
      icon: Heart,
      route: '/lashesandra'
    },
    {
      id: 'isabellenails',
      name: 'Isabelle Nails',
      description: 'Gestione clienti e appuntamenti per Isabelle Nails',
      color: 'from-purple-500 to-purple-600',
      icon: Star,
      route: '/isabellenails'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* User Actions */}
          <div className="flex justify-end mb-4 space-x-2">
            <motion.button
              onClick={() => navigate('/profile')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Profilo</span>
            </motion.button>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </motion.button>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Benvenuto nel Sistema di Gestione
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Scegli l'applicazione che desideri utilizzare per gestire i tuoi clienti e appuntamenti
          </p>
          {user && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Accesso effettuato come: {user.email}
            </p>
          )}
        </motion.div>

        {/* App Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {apps.map((app, index) => {
            const Icon = app.icon;
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(app.route)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative p-8">
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${app.color} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:shadow-xl transition-shadow duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {app.name}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      {app.description}
                    </p>

                    {/* CTA Button */}
                    <div className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${app.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105`}>
                      <span>Accedi all'app</span>
                      <motion.div
                        className="ml-2"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 dark:text-gray-400">
            Entrambe le applicazioni condividono la stessa interfaccia ma utilizzano database separati
          </p>
        </motion.div>
      </div>
    </div>
  );
}
