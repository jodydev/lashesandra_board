import { createContext, useContext, type ReactNode } from 'react';

export type AppType = 'lashesandra' | 'isabellenails';

interface AppContextType {
  appType: AppType;
  tablePrefix: string;
  appName: string;
  appColor: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  appType: AppType;
}

export function AppProvider({ children, appType }: AppProviderProps) {
  const contextValue: AppContextType = {
    appType,
    tablePrefix: appType === 'isabellenails' ? 'isabelle_' : '',
    appName: appType === 'isabellenails' ? 'Isabelle Nails' : 'LashesAndra',
    appColor: appType === 'isabellenails' ? '#9C27B0' : '#E91E63', // Purple for Isabelle, Pink for LashesAndra
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
