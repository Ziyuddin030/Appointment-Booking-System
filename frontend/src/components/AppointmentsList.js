import React, { useState, useCallback, memo } from 'react';
import dayjs from 'dayjs';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Divider,
  Chip,
  Pagination,
  Box,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Email as EmailIcon
} from '@mui/icons-material';

export default function AppointmentsList({ 
  appointments, 
  onCancel,
  meta = { page: 1, per_page: 10, total: 0, total_pages: 0 },
  onPageChange,
  loading = false 
}) {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const handleCancelClick = useCallback((appointment) => {
    setSelectedAppointment(appointment);
    setConfirmDialog(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!selectedAppointment) return;
    
    try {
      await onCancel(selectedAppointment.id);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    } finally {
      setConfirmDialog(false);
      setSelectedAppointment(null);
    }
  }, [selectedAppointment, onCancel]);

  const handleCloseDialog = useCallback(() => {
    setConfirmDialog(false);
    setSelectedAppointment(null);
  }, []);

  const formatDateTime = useCallback((datetime) => {
    const date = dayjs(datetime);
    return {
      date: date.format('MMMM D, YYYY'),
      time: date.format('h:mm A')
    };
  }, []);

  // Memoized appointment item component
  const AppointmentItem = memo(({ appointment, onCancelClick }) => {
    const { date, time } = formatDateTime(appointment.starts_at);
    
    return (
      <React.Fragment>
        <ListItem>
          <ListItemText
            primary={
              <Typography variant="h6" component="div">
                <Chip
                  icon={<EventIcon />}
                  label={date}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  icon={<TimeIcon />}
                  label={time}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              </Typography>
            }
            secondary={
              <>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                  {appointment.name}
                </Typography>
                <Typography variant="body2">
                  <EmailIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                  {appointment.email}
                </Typography>
                {appointment.reason && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Reason: {appointment.reason}
                  </Typography>
                )}
              </>
            }
          />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="cancel"
              onClick={() => onCancelClick(appointment)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
      </React.Fragment>
    );
  });

  // Memoized pagination component
  const PaginationSection = memo(({ meta, onPageChange }) => {
    if (!meta || meta.total <= meta.per_page) return null;
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.ceil(meta.total / meta.per_page)}
          page={meta.page}
          onChange={onPageChange}
          color="primary"
        />
      </Box>
    );
  });

  return (
    <Paper elevation={2} sx={{ maxWidth: 600, margin: '2rem auto', p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ px: 2, py: 1 }}>
        Your Appointments
      </Typography>
      <Divider />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : appointments.length === 0 ? (
        <Typography variant="body1" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          No appointments scheduled
        </Typography>
      ) : (
        <>
          <List>
            {appointments.map(appointment => (
              <AppointmentItem
                key={appointment.id}
                appointment={appointment}
                onCancelClick={handleCancelClick}
              />
            ))}
          </List>
          <PaginationSection meta={meta} onPageChange={onPageChange} />
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={handleCloseDialog}
        aria-labelledby="cancel-dialog-title"
      >
        <DialogTitle id="cancel-dialog-title">
          Cancel Appointment
        </DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Typography>
              Are you sure you want to cancel your appointment on{' '}
              {formatDateTime(selectedAppointment.starts_at).date} at{' '}
              {formatDateTime(selectedAppointment.starts_at).time}?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            No, Keep It
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained">
            Yes, Cancel It
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
