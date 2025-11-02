import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  List as ListIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar position="static" color="primary" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Appointment System
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          <Button
            color="inherit"
            startIcon={<CalendarIcon />}
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
            variant={location.pathname === '/' ? 'outlined' : 'text'}
          >
            Calendar
          </Button>
          <Button
            color="inherit"
            startIcon={<ListIcon />}
            onClick={() => navigate('/appointments')}
            variant={location.pathname === '/appointments' ? 'outlined' : 'text'}
          >
            My Appointments
          </Button>
        </Box>
        <Button color="inherit" onClick={onLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}