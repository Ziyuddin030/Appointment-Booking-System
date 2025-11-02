import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link
} from '@mui/material';
import api from '../api';
import '../styles/AuthForm.css';

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [data, setData] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [msg, setMsg] = useState(null);

  function handleChange(e) {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const res = await api.post(endpoint, data);
      localStorage.setItem('token', res.data.token);
      onAuthSuccess();
    } catch (err) {
      setMsg(err.response?.data?.errors.join(', ') || 'Authentication failed. Please try again.');
    }
  }

  return (
    <Container className="auth-container" maxWidth="xs">
      <Paper className="auth-paper" elevation={3}>
        <Box p={4}>
          <form className="auth-form" onSubmit={handleSubmit}>
            <Typography variant="h4" className="auth-title" align="center">
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </Typography>
            
            <Typography variant="body1" className="auth-subtitle" align="center">
              {mode === 'login' ? 'Welcome back!' : 'Create your account'}
            </Typography>

            {mode === 'signup' && (
              <TextField
                className="auth-input"
                fullWidth
                variant="outlined"
                name="name"
                label="Name"
                value={data.name}
                onChange={handleChange}
                required
              />
            )}
            
            <TextField
              className="auth-input"
              fullWidth
              variant="outlined"
              name="email"
              label="Email"
              type="email"
              value={data.email}
              onChange={handleChange}
              required
            />
            
            <TextField
              className="auth-input"
              fullWidth
              variant="outlined"
              name="password"
              label="Password"
              type="password"
              value={data.password}
              onChange={handleChange}
              required
            />
            {mode === 'signup' && (
              <TextField
                className="auth-input"
                fullWidth
                variant="outlined"
                name="password_confirmation"
                label="Confirm Password"
                type="password"
                value={data.password_confirmation}
                onChange={handleChange}
                required
              />
            )}

            <Button
              className="auth-button"
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
            >
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </Button>

            <Box className="auth-switch" textAlign="center">
              <Typography variant="body2">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <Button
                  color="primary"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login' ? 'Sign up' : 'Login'}
                </Button>
              </Typography>
            </Box>

            {msg && (
              <Alert className="auth-error" severity="error">
                {msg}
              </Alert>
            )}
    </form>
    </Box>
    </Paper>
    </Container>
  );
}
