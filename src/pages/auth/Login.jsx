import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../utils/constants';
import { Storefront as StorefrontIcon } from '@mui/icons-material';

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ef6c00 0%, #ff8f00 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          top: '-200px',
          right: '-200px',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          bottom: '-100px',
          left: '-100px',
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          width: 420,
          maxWidth: '95%',
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.6s ease',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <StorefrontIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.5px" color="primary.main">
            {APP_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Inicia sesión para continuar
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            fullWidth
            label="Correo electrónico"
            type="email"
            margin="normal"
            autoComplete="email"
            {...register('email', {
              required: 'El correo es obligatorio',
              pattern: {
                value: EMAIL_PATTERN,
                message: 'Ingresa un correo válido',
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            margin="normal"
            autoComplete="current-password"
            {...register('password', {
              required: 'La contraseña es obligatoria',
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 3, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ¿No tienes cuenta?{' '}
            <Typography
              component={RouterLink}
              to="/register"
              variant="body2"
              sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Regístrate
            </Typography>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2.5, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            USUARIOS DE PRUEBA
          </Typography>
          <Typography variant="caption" display="block">Admin: admin@petermarket.pe / admin123</Typography>
          <Typography variant="caption" display="block">Empleado: empleado@petermarket.pe / empleado123</Typography>
          <Typography variant="caption" display="block">Cliente: cliente@petermarket.pe / cliente123</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
