import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import api from '../../api/axios';

const roleColors = {
  admin: { color: '#ef6c00', bg: 'rgba(239, 108, 0, 0.1)' },
  empleado: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
  cliente: { color: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)' },
};

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({ name: '', email: '', role: 'cliente', password: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'cliente', password: '' });
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setSnackbar({ open: true, message: 'Nombre y correo son obligatorios.', severity: 'error' });
      return;
    }
    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}`, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
        setSnackbar({ open: true, message: 'Usuario actualizado.', severity: 'success' });
      } else {
        if (!form.password) {
          setSnackbar({ open: true, message: 'La contraseña es obligatoria.', severity: 'error' });
          return;
        }
        await api.post('/auth/users', {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password,
        });
        setSnackbar({ open: true, message: 'Usuario creado.', severity: 'success' });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Error al guardar', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/auth/users/${id}`);
      setSnackbar({ open: true, message: 'Usuario eliminado.', severity: 'info' });
      fetchUsers();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Error al eliminar', severity: 'error' });
    }
  };

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Usuarios</Typography>
          <Typography variant="body2" color="text.secondary">Gestiona los usuarios del sistema ({users.length} registrados)</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openCreate}>
          Nuevo Usuario
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>#</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right" sx={{ pr: 3 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ pl: 3, fontWeight: 600 }}>{u.id}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    label={u.role}
                    size="small"
                    sx={{
                      fontWeight: 600, textTransform: 'capitalize',
                      color: roleColors[u.role]?.color,
                      bgcolor: roleColors[u.role]?.bg,
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>
                  <IconButton size="small" onClick={() => openEdit(u)} sx={{ mr: 0.5, color: 'primary.main' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(u.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Nombre" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} margin="normal"
          />
          <TextField
            fullWidth label="Correo electrónico" type="email" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} margin="normal"
          />
          <TextField
            fullWidth select label="Rol" value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} margin="normal"
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="empleado">Empleado</MenuItem>
            <MenuItem value="cliente">Cliente</MenuItem>
          </TextField>
          {!editingUser && (
            <TextField
              fullWidth label="Contraseña" type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} margin="normal"
            />
          )}
          {editingUser && (
            <TextField
              fullWidth label="Nueva contraseña (dejar vacío para no cambiar)" type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} margin="normal"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingUser ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
