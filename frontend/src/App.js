import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/id';

// Auth Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Patient Components
import PatientDashboard from './pages/patient/Dashboard';
import PatientProfile from './pages/patient/Profile';
import PatientAppointments from './pages/patient/Appointments';
import PatientMedicalRecords from './pages/patient/MedicalRecords';
import PatientPayments from './pages/patient/Payments';
import PatientWallet from './pages/patient/Wallet';
import PatientChat from './pages/patient/Chat';
import SearchServices from './pages/patient/SearchServices';
import BookAppointment from './pages/patient/BookAppointment';

// Nakes Components
import NakesDashboard from './pages/nakes/Dashboard';
import NakesProfile from './pages/nakes/Profile';
import NakesServices from './pages/nakes/Services';
import NakesAppointments from './pages/nakes/Appointments';
import NakesWallet from './pages/nakes/Wallet';
import NakesChat from './pages/nakes/Chat';
import NakesPatients from './pages/nakes/Patients';

// Admin Components
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import NakesVerification from './pages/admin/NakesVerification';
import PaymentManagement from './pages/admin/PaymentManagement';
import ServiceManagement from './pages/admin/ServiceManagement';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import SecurityMonitoring from './pages/admin/SecurityMonitoring';
import SystemSettings from './pages/admin/SystemSettings';

// Common Components
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Hooks
import { useAuthStore } from './store/authStore';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#10b981', // emerald-500
      light: '#34d399', // emerald-400
      dark: '#059669', // emerald-600
    },
    secondary: {
      main: '#6366f1', // indigo-500
      light: '#818cf8', // indigo-400
      dark: '#4f46e5', // indigo-600
    },
    background: {
      default: '#f9fafb', // gray-50
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // gray-900
      secondary: '#6b7280', // gray-500
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
  },
});

function App() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      {/* Patient Routes */}
                      {user?.role === 'patient' && (
                        <>
                          <Route path="/dashboard" element={<PatientDashboard />} />
                          <Route path="/profile" element={<PatientProfile />} />
                          <Route path="/appointments" element={<PatientAppointments />} />
                          <Route path="/medical-records" element={<PatientMedicalRecords />} />
                          <Route path="/payments" element={<PatientPayments />} />
                          <Route path="/wallet" element={<PatientWallet />} />
                          <Route path="/chat" element={<PatientChat />} />
                          <Route path="/search" element={<SearchServices />} />
                          <Route path="/book/:serviceId" element={<BookAppointment />} />
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </>
                      )}
                      
                      {/* Nakes Routes */}
                      {user?.role === 'nakes' && (
                        <>
                          <Route path="/dashboard" element={<NakesDashboard />} />
                          <Route path="/profile" element={<NakesProfile />} />
                          <Route path="/services" element={<NakesServices />} />
                          <Route path="/appointments" element={<NakesAppointments />} />
                          <Route path="/wallet" element={<NakesWallet />} />
                          <Route path="/chat" element={<NakesChat />} />
                          <Route path="/patients" element={<NakesPatients />} />
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </>
                      )}
                      
                      {/* Default redirect based on role */}
                      <Route
                        path="/*"
                        element={
                          <Navigate
                            to={user?.role === 'patient' ? '/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                            replace
                          />
                        }
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <Routes>
                      <Route path="/dashboard" element={<AdminDashboard />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/nakes-verification" element={<NakesVerification />} />
                      <Route path="/payments" element={<PaymentManagement />} />
                      <Route path="/services" element={<ServiceManagement />} />
                      <Route path="/reports" element={<ReportsAnalytics />} />
                      <Route path="/security/monitor" element={<SecurityMonitoring />} />
                      <Route path="/settings/general" element={<SystemSettings />} />
                      <Route path="/settings/health" element={<SystemSettings />} />
                      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                     </Routes>
                   </AdminLayout>
                 </ProtectedRoute>
               }
             />
          </Routes>
        </ErrorBoundary>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;