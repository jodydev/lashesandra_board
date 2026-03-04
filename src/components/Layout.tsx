import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Users, IdCard, UserCog } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAppColors } from '../hooks/useAppColors';
import FloatingNotification from './FloatingNotification';
import { initLocalNotifications } from '../lib/localNotifications';

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

  useEffect(() => {
    initLocalNotifications();
  }, []);

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
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 1, y: 0 }}
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
        className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-bottom"
        style={{ borderColor: accentSofter, backgroundColor: surfaceColor }}
        role="navigation"
        aria-label="Menu principale"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around p-3">
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/home`)}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition`}
            style={{
              color: isActive('home') ? textPrimaryColor : textSecondaryColor,
              background: isActive('home') ? accentSofter : undefined,
            }}
            aria-current={isActive('home') ? 'page' : undefined}
          >
            <Home
              className="h-5 w-5"
              style={
                isActive('home')
                  ? {
                      color: colors.primary,
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
                      fontWeight: 700,
                    }
                  : undefined
              }
            />
            <span
              className="text-[10px] font-semibold uppercase"
              style={
                isActive('home')
                  ? { color: colors.primary }
                  : undefined
              }
            >
              Home
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/calendar`)}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition`}
            style={{
              color: isActive('calendar') ? textPrimaryColor : textSecondaryColor,
              background: isActive('calendar') ? accentSofter : undefined,
            }}
            aria-current={isActive('calendar') ? 'page' : undefined}
          >
            <Calendar
              className="h-5 w-5"
              style={
                isActive('calendar')
                  ? {
                      color: colors.primary,
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
                      fontWeight: 700,
                    }
                  : undefined
              }
            />
            <span
              className="text-[10px] font-semibold uppercase"
              style={
                isActive('calendar')
                  ? { color: colors.primary }
                  : undefined
              }
            >
              Agenda
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/clients`)}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition`}
            style={{
              color: isActive('clients') ? textPrimaryColor : textSecondaryColor,
              background: isActive('clients') ? accentSofter : undefined,
            }}
            aria-current={isActive('clients') ? 'page' : undefined}
          >
            <Users
              className="h-5 w-5"
              style={
                isActive('clients')
                  ? {
                      color: colors.primary,
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
                      fontWeight: 700,
                    }
                  : undefined
              }
            />
            <span
              className="text-[10px] font-semibold uppercase"
              style={
                isActive('clients')
                  ? { color: colors.primary }
                  : undefined
              }
            >
              Clienti
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/client-profiles`)}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition`}
            style={{
              color: isActive('client-profiles') ? textPrimaryColor : textSecondaryColor,
              background: isActive('client-profiles') ? accentSofter : undefined,
            }}
            aria-current={isActive('client-profiles') ? 'page' : undefined}
          >
            <IdCard
              className="h-5 w-5"
              style={
                isActive('client-profiles')
                  ? {
                      color: colors.primary,
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
                      fontWeight: 700,
                    }
                  : undefined
              }
            />
            <span
              className="text-[10px] font-semibold uppercase"
              style={
                isActive('client-profiles')
                  ? { color: colors.primary }
                  : undefined
              }
            >
              Schemi
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${appPrefix}/profile`)}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition`}
            style={{
              color: isActive('profile') ? textPrimaryColor : textSecondaryColor,
              background: isActive('profile') ? accentSofter : undefined,
            }}
            aria-current={isActive('profile') ? 'page' : undefined}
          >
            <UserCog
              className="h-5 w-5"
              style={
                isActive('profile')
                  ? {
                      color: colors.primary,
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
                      fontWeight: 700,
                    }
                  : undefined
              }
            />
            <span
              className="text-[10px] font-semibold uppercase"
              style={
                isActive('profile')
                  ? { color: colors.primary }
                  : undefined
              }
            >
              Menú
            </span>
          </button>
        </div>
      </nav>

      <FloatingNotification />
    </Box>
  );
}
