import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Star, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppColors } from '../hooks/useAppColors';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

export default function AppSelector() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const colors = useAppColors();
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;
  const backgroundColor = '#faede0';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const apps = [
    {
      id: 'lashesandra',
      name: 'LashesAndra',
      description: 'Gestione clienti e appuntamenti per LashesAndra',
      color: 'from-[#c2886d] to-[#a06d52]',
      icon: Heart,
      route: '/lashesandra'
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4" style={{ color: textPrimaryColor }}>
            Benvenuta nel Sistema di Gestione
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: textSecondaryColor }}>
            Scegli l'applicazione che desideri utilizzare per gestire i tuoi clienti e appuntamenti
          </p>
          {user && (
            <p className="text-sm mt-2" style={{ color: textSecondaryColor }}>
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
                <div className="relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border" style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}>
                  {/* Background gradient */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300" style={{ background: accentGradient }} />
                  
                  {/* Content */}
                  <div className="relative p-8">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:shadow-xl transition-shadow duration-300 text-white" style={{ background: accentGradient }}>
                      <Icon className="w-8 h-8" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-3" style={{ color: textPrimaryColor }}>
                      {app.name}
                    </h2>

                    {/* Description */}
                    <p className="mb-6 leading-relaxed" style={{ color: textSecondaryColor }}>
                      {app.description}
                    </p>

                    {/* CTA Button */}
                    <div className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105" style={{ background: accentGradient }}>
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

      </div>
    </div>
  );
}
