import React from 'react';
import { Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Users, IdCard, UserCog } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAppColors } from '../hooks/useAppColors';
import FloatingNotification from './FloatingNotification';

interface LayoutProps {
  readonly children: React.ReactNode;
}

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { appType } = useApp();
  const colors = useAppColors();
  const accentSofter = `${colors.primary}14`;
  const appPrefix = appType === 'isabellenails' ? '/isabellenails' : '/lashesandra';

  const isActive = (path: string) => {
    if (path === 'home') return location.pathname === appPrefix || location.pathname === `${appPrefix}/home`;
    return location.pathname === `${appPrefix}/${path}` || location.pathname.startsWith(`${appPrefix}/${path}/`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          paddingBottom: '80px',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Bottom navigation - visibile su tutte le pagine */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        style={{ borderColor: accentSofter, backgroundColor: surfaceColor }}
        role="navigation"
        aria-label="Menu principale"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/home`)}
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2"
            style={{ color: isActive('home') ? textPrimaryColor : textSecondaryColor }}
            aria-current={isActive('home') ? 'page' : undefined}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-semibold uppercase">Home</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/calendar`)}
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2"
            style={{ color: isActive('calendar') ? textPrimaryColor : textSecondaryColor }}
            aria-current={isActive('calendar') ? 'page' : undefined}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-semibold uppercase">Agenda</span>
            {isActive('calendar') && (
              <span className="w-1.5 h-1.5 rounded-full -mt-0.5" style={{ backgroundColor: colors.primary }} aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/clients`)}
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2"
            style={{ color: isActive('clients') ? textPrimaryColor : textSecondaryColor }}
            aria-current={isActive('clients') ? 'page' : undefined}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-semibold uppercase">Clienti</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/client-profiles`)}
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2"
            style={{ color: isActive('client-profiles') ? textPrimaryColor : textSecondaryColor }}
            aria-current={isActive('client-profiles') ? 'page' : undefined}
          >
            <IdCard className="h-5 w-5" />
            <span className="text-[10px] font-semibold uppercase">Schemi</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/profile`)}
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2"
            style={{ color: isActive('profile') ? textPrimaryColor : textSecondaryColor }}
            aria-current={isActive('profile') ? 'page' : undefined}
          >
            <UserCog className="h-5 w-5" />
            <span className="text-[10px] font-semibold uppercase">Menú</span>
          </button>
        </div>
      </nav>

      <FloatingNotification />
    </Box>
  );
}
