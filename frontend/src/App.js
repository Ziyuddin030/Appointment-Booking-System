import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Calendar from './components/Calendar';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import AppointmentsPage from './pages/AppointmentsPage';
import api from './api';
import dayjs from 'dayjs';
import './App.css';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#3498db',
    },
    secondary: {
      main: '#2ecc71',
    },
    error: {
      main: '#e74c3c',
    },
  },
});

export default function App() {
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsMeta, setAppointmentsMeta] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    async function initializeData() {
      if (isAuthenticated) {
        try {
          console.log('Initializing data...');
          await fetchSlots();
          await fetchAppointments(1);
        } catch (error) {
          console.error('Error initializing data:', error);
        }
      }
    }
    initializeData();
  }, [isAuthenticated]);

  async function fetchSlots(invalidateCache = true) {
    setSlotsLoading(true);
    try {
      console.log('Fetching available slots...');
      // Add timezone and cache-busting parameters
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const url = `/appointments/available?timezone=${encodeURIComponent(timezone)}${invalidateCache ? `&t=${Date.now()}` : ''}`;
      const res = await api.get(url);
      console.log('Raw API Response for slots:', res);
      
      if (!res.data) {
        console.error('No data received from slots API');
        setSlots([]);
        return [];
      }
      
      // Get slots array from response, ensuring we handle both array and object responses
      let slotsData = Array.isArray(res.data) ? res.data : 
                      Array.isArray(res.data.slots) ? res.data.slots : [];
      
      // Generate all possible slots for the current week
      const currentWeek = dayjs().startOf('isoWeek');
      const allSlots = [];
      
      // Generate slots for each working day (Mon-Fri)
      for (let day = 0; day < 5; day++) {
        const currentDate = currentWeek.add(day, 'day');
        
        // Generate slots for business hours (9 AM to 5 PM)
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotTime = currentDate
              .hour(hour)
              .minute(minute)
              .second(0)
              .millisecond(0);
              
            // Only add future slots
            if (slotTime.isAfter(dayjs())) {
              allSlots.push({
                starts_at: slotTime.format('YYYY-MM-DDTHH:mm:ss'),
                available: true // Default to available
              });
            }
          }
        }
      }
      
      // Merge API data with generated slots
      const mergedSlots = allSlots.map(baseSlot => {
        const matchingApiSlot = slotsData.find(
          apiSlot => dayjs(apiSlot.starts_at).format('YYYY-MM-DDTHH:mm') === 
                     dayjs(baseSlot.starts_at).format('YYYY-MM-DDTHH:mm')
        );
        
        return {
          ...baseSlot,
          ...matchingApiSlot,
          // If we have API data, use its availability, otherwise keep as available
          available: matchingApiSlot ? matchingApiSlot.available : true
        };
      });
      
      console.log('Processed slots data:', mergedSlots);
      
      // Update slots state with the validated data
      setSlots(mergedSlots);
      return mergedSlots;
    } catch (error) {
      console.error('Error fetching slots:', error);
      // In case of error, set slots to empty array to prevent stale data
      setSlots([]);
      throw error;
    } finally {
      setSlotsLoading(false);
    }
  }

  async function fetchAppointments(page = 1, per_page = 10) {
    setIsLoading(true);
    try {
      const res = await api.get(`/appointments?page=${page}&per_page=${per_page}`);
      const { appointments: appointmentsData, ...meta } = res.data;
      setAppointments(appointmentsData);
      setAppointmentsMeta(meta);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createAppointment(data) {
    try {
      const res = await api.post('/appointments', data);
      await Promise.all([fetchAppointments(), fetchSlots()]);
      return res;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error; // Re-throw to handle in the form
    }
  }

  async function cancelAppointment(id) {
    setIsLoading(true);
    try {
      console.log(`Starting cancellation of appointment ${id}...`);
      
      // First delete the appointment
      const deleteRes = await api.delete(`/appointments/${id}`);
      console.log('Delete response:', deleteRes);
      
      // Immediately invalidate and fetch new slots with cache busting
      console.log('Fetching updated slots after deletion...');
      const slotsResult = await fetchSlots(true);
      console.log('Updated slots after deletion:', slotsResult);
      
      // Update the appointments list
      console.log('Updating appointments list...');
      if (appointments.length === 1 && appointmentsMeta.page > 1) {
        const newPage = appointmentsMeta.page - 1;
        console.log(`Last item deleted, moving to page ${newPage}`);
        await fetchAppointments(newPage, appointmentsMeta.per_page);
      } else {
        console.log(`Refreshing current page ${appointmentsMeta.page}`);
        await fetchAppointments(appointmentsMeta.page, appointmentsMeta.per_page);
      }
      
      // One final slots refresh to ensure everything is in sync
      console.log('Final slots refresh...');
      await fetchSlots(true);
      
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      // If there's an error, try to refresh slots one more time
      try {
        await fetchSlots(true);
      } catch (e) {
        console.error('Failed to refresh slots after error:', e);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app-container">
          <Navbar onLogout={handleLogout} />
          <Routes>
            <Route 
              path="/" 
              element={
                <div className="main-content">
                  <Calendar 
                    slots={slots} 
                    onSlotBook={createAppointment}
                    loading={slotsLoading} 
                  />
                </div>
              } 
            />
            <Route 
              path="/appointments" 
              element={
                <AppointmentsPage
                  appointments={appointments}
                  onCancel={cancelAppointment}
                  meta={appointmentsMeta}
                  onPageChange={(_, page) => fetchAppointments(page, appointmentsMeta.per_page)}
                  loading={isLoading}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}
