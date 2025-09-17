import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  BarChart as ChartIcon,
  Home as HomeIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/home', badge: null },
  { text: 'Clienti', icon: <PeopleIcon />, path: '/clients', badge: null },
  { text: 'Appuntamenti', icon: <CalendarIcon />, path: '/appointments', badge: null },
  { text: 'Calendario', icon: <CalendarIcon />, path: '/calendar', badge: null },
  { text: 'Statistiche', icon: <ChartIcon />, path: '/overview', badge: null },
  { text: 'Conferma Appuntamenti', icon: <CheckCircleIcon />, path: '/confirmations', badge: null },
];

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <div className="h-full flex flex-col bg-gradient-to-br from-white via-pink-50/30 to-pink-100/20 dark:from-gray-900 dark:via-gray-900 dark:to-pink-950/20">
      {/* Modern Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 dark:from-pink-600 dark:via-pink-700 dark:to-pink-800">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
          <div className="absolute top-8 right-8 w-24 h-24 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-4 left-1/3 w-16 h-16 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center justify-between mb-2"
          >
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-white font-bold text-xl tracking-tight">
                  LashesAndra
                </h1>
                <p className="text-pink-100 text-sm font-medium">
                  Workspace 
                </p>
              </div>
            </div>
            
            {isMobile && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDrawerToggle}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-200"
              >
                <CloseIcon className="w-5 h-5" />
              </motion.button>
            )}
          </motion.div>
          
        </div>
        
        {/* Subtle bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-pink-500/20 to-pink-600/20 backdrop-blur-sm" />
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => {
          const isSelected = location.pathname === item.path;
          const Icon = item.icon.type;
          
          return (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.08,
                ease: "easeOut"
              }}
            >
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigation(item.path)}
                className={`w-full group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 hover:text-pink-600 dark:hover:text-pink-400 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700'
                }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                  isSelected 
                    ? 'opacity-0' 
                    : 'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-pink-500/5 to-pink-600/5'
                }`} />
                
                <div className="relative flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? 'bg-white/20 backdrop-blur-sm'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30'
                  }`}>
                    <Icon className={`w-5 h-5 transition-colors duration-300 ${
                      isSelected 
                        ? 'text-white' 
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <span className={`font-semibold text-sm transition-colors duration-300 ${
                      isSelected 
                        ? 'text-white' 
                        : 'text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                    }`}>
                      {item.text}
                    </span>
                  </div>
                  
                  {item.badge && (
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold transition-all duration-300 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                    }`}>
                      {item.badge}
                    </div>
                  )}
                  
                  {/* Arrow indicator for selected item */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced User Profile Section */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-gray-50 to-pink-50/50 dark:from-gray-800 dark:to-pink-900/20 rounded-2xl p-4 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                LashesAndra
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Proprietaria
              </p>
            </div>
  
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Modern App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { md: 'none' },
                color: theme.palette.text.primary,
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>
          
        </Toolbar>
      </AppBar>
      
      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'white',
              borderRight: '1px solid rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'white',
              borderRight: '1px solid rgba(0, 0, 0, 0.05)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)',
        }}
      >
        <Toolbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
