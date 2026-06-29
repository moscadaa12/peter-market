import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Avatar, Divider, Alert,
} from '@mui/material';
import { Save as SaveIcon, Storefront as StorefrontIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

export default function Perfil() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim()) {
      setError('El nombre y el correo son obligatorios.');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    updateProfile({ name: name.trim(), email: email.trim(), password: password || undefined });
    setSuccess('Perfil actualizado correctamente.');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease', maxWidth: 600 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Mi Perfil
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Administra tu información personal
      </Typography>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 700 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              Rol: {user?.role}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSave}>
          <TextField
            fullWidth
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Nueva contraseña (dejar vacío para mantener)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            disabled={!password}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 3, py: 1.5 }}
            fullWidth
          >
            Guardar Cambios
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
