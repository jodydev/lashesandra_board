import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '../contexts/AppContext';
import DynamicThemeProvider from '../components/DynamicThemeProvider';
import Layout from '../components/Layout';
import HomePage from '../pages/HomePage';
import ClientsPage from '../pages/ClientsPage';
import CalendarPage from '../pages/CalendarPage';
import OverviewPage from '../pages/OverviewPage';
import AppointmentsPage from '../pages/AppointmentsPage';
import AppointmentsConfirmationPage from '../pages/AppointmentsConfirmationPage';
import ProfilePage from '../pages/ProfilePage';
import WhatsAppAdminPage from '../pages/WhatsAppAdminPage';

export default function IsabelleNailsApp() {
  return (
    <AppProvider appType="isabellenails">
      <DynamicThemeProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/isabellenails/home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="confirmations" element={<AppointmentsConfirmationPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="whatsapp-admin" element={<WhatsAppAdminPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </DynamicThemeProvider>
    </AppProvider>
  );
}
