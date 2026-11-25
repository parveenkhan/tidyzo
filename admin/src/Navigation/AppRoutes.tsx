import { Navigate, Route, Routes } from 'react-router-dom';
import { Sidebar } from '../Component/Sidebar';
import { useAppSelector } from '../Redux/hooks';
import LoginScreen from '../Screens/AuthScreen/LoginScreen';
import DashboardScreen from '../Screens/DashboardScreen/DashboardScreen';
import ServicesScreen from '../Screens/ServicesScreen/ServicesScreen';
import BookingsScreen from '../Screens/BookingsScreen/BookingsScreen';
import CustomersScreen from '../Screens/CustomersScreen/CustomersScreen';
import NotificationsScreen from '../Screens/NotificationsScreen/NotificationsScreen';

export default function AppRoutes() {
  const token = useAppSelector((state) => state.auth.token);
  if (!token) return <LoginScreen />;
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardScreen />} />
          <Route path="/services" element={<ServicesScreen />} />
          <Route path="/bookings" element={<BookingsScreen />} />
          <Route path="/customers" element={<CustomersScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
