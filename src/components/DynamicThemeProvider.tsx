import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useApp } from '../contexts/AppContext';

interface DynamicThemeProviderProps {
  children: React.ReactNode;
}

export default function DynamicThemeProvider({ children }: DynamicThemeProviderProps) {
  const { appType } = useApp();
  
  const isIsabelle = appType === 'isabellenails';
  
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: isIsabelle ? '#9C27B0' : '#E91E63', // Purple for Isabelle, Pink for LashesAndra
        light: isIsabelle ? '#BA68C8' : '#F8BBD9',
        dark: isIsabelle ? '#7B1FA2' : '#C2185B',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#000000', // Pure black
        light: '#424242',
        dark: '#000000',
        contrastText: '#FFFFFF',
      },
      background: {
        default: '#FAFAFA', // Soft white
        paper: '#FFFFFF',
      },
      text: {
        primary: '#212121',
        secondary: '#757575',
      },
      grey: {
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#EEEEEE',
        300: '#E0E0E0',
        400: '#BDBDBD',
        500: '#9E9E9E',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0px 1px 2px rgba(0, 0, 0, 0.05)',
      '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
      '0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.06)',
      '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
      '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
      '0px 25px 50px rgba(0, 0, 0, 0.15)',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isIsabelle 
                ? '0px 4px 12px rgba(156, 39, 176, 0.3)'
                : '0px 4px 12px rgba(233, 30, 99, 0.3)',
            },
          },
          contained: {
            background: isIsabelle 
              ? 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
              : 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
            '&:hover': {
              background: isIsabelle 
                ? 'linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 100%)'
                : 'linear-gradient(135deg, #C2185B 0%, #AD1457 100%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
