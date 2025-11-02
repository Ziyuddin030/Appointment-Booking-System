import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import AppointmentsList from '../components/AppointmentsList';

export default function AppointmentsPage({ 
  appointments,
  onCancel,
  meta,
  onPageChange,
  loading
}) {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Appointments
        </Typography>
        <AppointmentsList
          appointments={appointments}
          onCancel={onCancel}
          meta={meta}
          onPageChange={onPageChange}
          loading={loading}
        />
      </Paper>
    </Container>
  );
}