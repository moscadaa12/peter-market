import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Storefront as StorefrontIcon } from '@mui/icons-material';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    try {
      setError('');
      await registerUser({ name: data.name, email: data.email, password: data.password });
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
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
          width: 480,
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
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.5px">
            Crear Cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Regístrate para empezar a comprar
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Nombre completo"
            margin="normal"
            {...register('name', { required: 'El nombre es obligatorio' })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            fullWidth
            label="Correo electrónico"
            type="email"
            margin="normal"
            {...register('email', { required: 'El email es obligatorio' })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            margin="normal"
            {...register('password', {
              required: 'La contraseña es obligatoria',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <TextField
            fullWidth
            label="Confirmar Contraseña"
            type="password"
            margin="normal"
            {...register('confirmPassword', {
              required: 'Confirma tu contraseña',
              validate: (v) => v === watch('password') || 'Las contraseñas no coinciden',
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3, py: 1.5 }}
            size="large"
          >
            Registrarse
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ¿Ya tienes cuenta?{' '}
            <Typography
              component={Link}
              to="/login"
              variant="body2"
              sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Inicia sesión
            </Typography>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
