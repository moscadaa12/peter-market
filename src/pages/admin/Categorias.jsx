import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

export default function Categorias() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCategories = () => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  };

  useEffect(() => { fetchCategories() }, []);

  const openCreate = () => {
    setEditingCat(null);
    setForm({ name: '' });
    setDialogOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setForm({ name: cat.name });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSnackbar({ open: true, message: 'El nombre es obligatorio.', severity: 'error' });
      return;
    }

    try {
      if (editingCat) {
        const res = await fetch(`/api/categories/${editingCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name.trim() }),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name.trim() }),
        });
        if (!res.ok) throw new Error();
      }
      fetchCategories();
      setDialogOpen(false);
      setSnackbar({ open: true, message: editingCat ? 'Categoría actualizada.' : 'Categoría creada.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Error de conexión con el servidor.', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      fetchCategories();
      setSnackbar({ open: true, message: 'Categoría eliminada.', severity: 'info' });
    } catch {
      setSnackbar({ open: true, message: 'Error de conexión con el servidor.', severity: 'error' });
    }
  };

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Categorías</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona las categorías de productos ({categories.length} registradas)
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nueva Categoría
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>#</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="center">Productos</TableCell>
              {isAdmin && <TableCell align="right" sx={{ pr: 3 }}>Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id} sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ pl: 3, fontWeight: 600 }}>{cat.id}</TableCell>
                <TableCell sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon fontSize="small" color="primary" />
                  {cat.name}
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight={600}>{cat.productCount ?? 0}</Typography>
                </TableCell>
                {isAdmin && (
                  <TableCell align="right" sx={{ pr: 3 }}>
                    <IconButton size="small" onClick={() => openEdit(cat)} sx={{ mr: 0.5, color: 'primary.main' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(cat.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre de la categoría"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            margin="normal"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingCat ? 'Guardar' : 'Crear'}
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
