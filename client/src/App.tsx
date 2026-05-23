import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import EventTypesList from './pages/dashboard/EventTypesList';
import EventTypeEditor from './pages/dashboard/EventTypeEditor';
import AvailabilitySettings from './pages/dashboard/AvailabilitySettings';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import BookingsDashboard from './pages/dashboard/BookingsDashboard';
import PublicBookingPage from './pages/PublicBookingPage';
import PublicProfilePage from './pages/PublicProfilePage';

function App() {
  return (
    <ThemeProvider defaultTheme="system" attribute="class" storageKey="calclone-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/event-types" replace />} />
          <Route path="/:username" element={<PublicProfilePage />} />
          <Route path="/:username/:slug" element={<PublicBookingPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="event-types" element={<EventTypesList />} />
            <Route path="event-types/new" element={<EventTypeEditor />} />
            <Route path="event-types/:id" element={<EventTypeEditor />} />
            <Route path="availability" element={<AvailabilitySettings />} />
            <Route path="bookings" element={<BookingsDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
