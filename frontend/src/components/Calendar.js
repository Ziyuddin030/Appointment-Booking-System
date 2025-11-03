import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import PropTypes from 'prop-types';
import BookingForm from './BookingForm';
import { Alert, Snackbar } from '@mui/material';

dayjs.extend(isoWeek);
dayjs.extend(weekday);

Calendar.propTypes = {
  slots: PropTypes.array,
  onSlotBook: PropTypes.func.isRequired
};

const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17,  // 5 PM
};

const TIME_SLOT_DURATION = 30; // in minutes

export default function Calendar({ slots: initialSlots, onSlotBook }) {
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek'));
  const [slots, setSlots] = useState(initialSlots || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: '', text: '' });


  // Update slots when initialSlots prop changes
  useEffect(() => {
    console.log('Initial slots received:', initialSlots);
    setSlots(initialSlots || []);
  }, [initialSlots]);

  // Fetch slots for the selected week
  const fetchSlots = React.useCallback(async (weekStart) => {
    setIsLoading(true);
    setError(null);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/appointments/available?week_start=${weekStart}&timezone=${timezone}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }
      const data = await response.json();
      console.log('API Response:', data);

      // Handle both array and object responses
      const slotsData = Array.isArray(data) ? data : (data.slots || []);
      console.log('Processed slots data:', slotsData);
      setSlots(slotsData);
    } catch (err) {
      setError('Failed to load available slots. Please try again.');
      console.error('Error fetching slots:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed as it only uses state setters

  // Get current week's working days (Mon-Fri)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 5; i++) { // Mon-Fri (5 days)
      days.push(currentWeek.add(i, 'day'));
    }
    return days;
  }, [currentWeek]);

  // Create time slots for each day
  const timeSlots = useMemo(() => {
    const allSlots = [];
    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
      for (let minute = 0; minute < 60; minute += TIME_SLOT_DURATION) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return allSlots;
  }, []);

  // Create a map of slot availability for easy lookup
  const slotAvailability = useMemo(() => {
    console.log('Full slots array:', slots);
    
    const availability = {};
    const now = dayjs();

    // Process the API data
    if (Array.isArray(slots)) {
      slots.forEach(slot => {
        if (slot && slot.starts_at) {
          const slotDate = dayjs(slot.starts_at);
          const key = `${slotDate.format('YYYY-MM-DD')}-${slotDate.format('HH:mm')}`;
          
          console.log('Processing slot:', {
            key,
            starts_at: slot.starts_at,
            available: slot.available,
            raw_slot: slot
          });

          const isPast = slotDate.isBefore(now);
          
          availability[key] = {
            isBooked: isPast ? true : !slot.available,
            slot: slot,
            exists: true,
            isPast: isPast
          };
        }
      });
    }
    
    // Add non-existent slots as unavailable
    const weekStart = currentWeek;
    for (let day = 0; day < 5; day++) {
      const currentDate = weekStart.add(day, 'day');
      timeSlots.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotDate = currentDate.hour(hours).minute(minutes);
        const key = `${slotDate.format('YYYY-MM-DD')}-${time}`;
        
        if (!availability[key]) {
          const isPast = slotDate.isBefore(now);
          availability[key] = {
            isBooked: true,
            exists: false,
            isPast: isPast
          };
        }
      });
    }
    
    console.log('Final availability map:', availability);
    return availability;
  }, [slots, currentWeek, timeSlots]); // Added missing dependencies

  const handleSlotClick = (day, time) => {
    // Create a date object with the selected day and time
    const [hours, minutes] = time.split(':');
    const dateObj = day.hour(parseInt(hours)).minute(parseInt(minutes)).toDate();
    
    // Format with timezone offset
    const starts_at = dateObj.toLocaleString('sv', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
      .replace(' ', 'T') + getTimezoneOffset(dateObj);
    
    const slotKey = `${day.format('YYYY-MM-DD')}-${time}`;
    const slotInfo = slotAvailability[slotKey];
    
    console.log('Clicked slot:', { starts_at, slotKey, slotInfo });
    
    // Only allow selection if the slot exists and is explicitly available
    if (slotInfo && !slotInfo.isBooked) {
      setSelectedSlot({
        starts_at, // Now includes timezone offset
        formattedDate: day.format('dddd, MMMM D, YYYY'),
        formattedTime: time
      });
      setShowBookingModal(true);
    }
  };

  // Helper function to get timezone offset in +/-HH:mm format
  const getTimezoneOffset = (date) => {
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
    return `${sign}${hours}:${minutes}`;
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
  };

  const handleBookAppointment = async (formData) => {
    try {
      console.log('Booking appointment with data:', formData);
      const res = await onSlotBook(formData);
      console.log('Appointment booked successfully');
      
      await fetchSlots(currentWeek.format('YYYY-MM-DD'));
      setAlert({ open: true, type: 'success', text: 'Appointment booked successfully!' });
    } catch (error) {
      console.error('Failed to book appointment:', error);
      setAlert({ open: true, type: 'error', text: error.response?.data?.errors.join(',') || 'Failed to book appointment. Please try again.' });
    }
  };

  // Handle week navigation
  const handleWeekChange = (direction) => {
    const newWeek = currentWeek.add(direction === 'next' ? 1 : -1, 'week');
    setCurrentWeek(newWeek);
    fetchSlots(newWeek.format('YYYY-MM-DD'));
  };

  // Initial fetch for the current week
  useEffect(() => {
    fetchSlots(currentWeek.format('YYYY-MM-DD'));
  }, [currentWeek, fetchSlots]); // Added fetchSlots to dependencies

  // Check if week is current or future
  const isCurrentWeek = currentWeek.isSame(dayjs().startOf('isoWeek'), 'week');
  const isPastWeek = currentWeek.isBefore(dayjs().startOf('isoWeek'), 'week');

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button 
          className="nav-btn"
          onClick={() => handleWeekChange('prev')}
          disabled={isCurrentWeek || isPastWeek || isLoading}
        >
          {isLoading ? '...' : '← Previous Week'}
        </button>
        <h3>
          {currentWeek.format('MMMM YYYY')}
          {isLoading && <span className="loading-indicator">Loading...</span>}
        </h3>
        <button 
          className="nav-btn"
          onClick={() => handleWeekChange('next')}
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Next Week →'}
        </button>
      </div>
      {error && (
        <div className="calendar-error">
          {error}
        </div>
      )}
      <div className="calendar-header">
        {weekDays.map(day => (
          <div key={day.format('YYYY-MM-DD')} className="calendar-day-header">
            <h4>{day.format('ddd, MMM D')}</h4>
          </div>
        ))}
      </div>
      <div className="calendar-body">
        {timeSlots.map(time => (
          <div key={time} className="calendar-row">
            <div className="time-label">{time}</div>
            {weekDays.map(day => {
              const slotKey = `${day.format('YYYY-MM-DD')}-${time}`;
              const slotInfo = slotAvailability[slotKey];
              const isPast = day.isBefore(dayjs(), 'day') || 
                           (day.isSame(dayjs(), 'day') && dayjs().format('HH:mm') > time);
              
              console.log(`Rendering slot ${slotKey}:`, { slotInfo, isPast });
              
              const isBooked = slotInfo?.exists && slotInfo?.isBooked;
              
              return (
                <div
                  key={slotKey}
                  className={`calendar-slot ${isBooked ? 'booked' : ''} ${isPast ? 'past' : ''}`}
                  onClick={() => !isBooked && !isPast && handleSlotClick(day, time)}
                >
                  {slotInfo?.isPast && <span className="status">Past</span>}
                  {!slotInfo?.isPast && isBooked && <span className="status">Booked</span>}
                  {!slotInfo?.isPast && !isBooked && <span className="status">Available</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <BookingForm
          selectedSlot={selectedSlot}
          onSubmit={handleBookAppointment}
          onClose={handleCloseModal}
        />
      )}
      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={alert.type} variant="filled" onClose={() => setAlert({ ...alert, open: false })}>
          {alert.text}
        </Alert>
      </Snackbar>
    </div>
  );
}
