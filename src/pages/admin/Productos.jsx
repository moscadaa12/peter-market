import { useState, useRef, useEffect } from 'react';
import {
  Typography, Button, Box, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert, Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';
import getProductImageUrl from '../../utils/productImages';
import { useAuth } from '../../hooks/useAuth';

const CATEGORIAS = [
  { value: 1, label: 'Abarrotes' },
  { value: 2, label: 'Lácteos' },
  { value: 3, label: 'Snacks' },
  { value: 4, label: 'Limpieza' },
  { value: 5, label: 'Bebidas' },
  { value: 6, label: 'Panadería' },
  { value: 7, label: 'Cuidado Personal' },
  { value: 8, label: 'Carnes' },
  { value: 9, label: 'Frutas y Verduras' },
  { value: 10, label: 'Mascotas' },
];

const CAT_NAME_MAP = Object.fromEntries(CATEGORIAS.map((c) => [c.value, c.label]));
const CAT_KEYS = CATEGORIAS.map((c) => c.value);

const initialForm = { nombre: '', descripcion: '', categoria: '', precio: '', precio_oferta: '', stock: '', imagen: '' };

export default function Productos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch {
      setSnack({ open: true, msg: 'Error al cargar productos.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts() }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, imagen: res.data.image_url }));
    } catch {
      setSnack({ open: true, msg: 'Error al subir la imagen.', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenNew = () => {
    setForm(initialForm);
    setEditId(null);
    setOpen(true);
  };

  const handleOpenEdit = (row) => {
    setForm({
      nombre: row.name,
      descripcion: row.description || '',
      categoria: row.category_id?.toString() || '',
      precio: row.price?.toString() || '',
      precio_oferta: row.offer_price?.toString() || '',
      stock: row.stock?.toString() || '',
      imagen: row.image_url || '',
    });
    setEditId(row.id);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const { nombre, descripcion, categoria, precio, precio_oferta, stock, imagen } = form;
    if (!nombre || !categoria || !precio || !stock) {
      setSnack({ open: true, msg: 'Nombre, categoría, precio y stock son obligatorios', severity: 'error' });
      return;
    }

    const body = {
      name: nombre,
      description: descripcion,
      category_id: Number(categoria),
      price: Number(precio),
      offer_price: precio_oferta ? Number(precio_oferta) : null,
      stock: Number(stock),
      image_url: imagen || '',
    };

    try {
      if (editId) {
        const res = await api.put(`/products/${editId}`, body);
        setProducts((prev) => prev.map((p) => (p.id === editId ? res.data : p)));
        setSnack({ open: true, msg: 'Producto actualizado correctamente', severity: 'success' });
      } else {
        const res = await api.post('/products', body);
        setProducts((prev) => [...prev, res.data]);
        setSnack({ open: true, msg: 'Producto creado correctamente', severity: 'success' });
      }
      handleClose();
    } catch {
      setSnack({ open: true, msg: 'Error de conexión con el servidor.', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSnack({ open: true, msg: 'Producto eliminado', severity: 'info' });
    } catch {
      setSnack({ open: true, msg: 'Error de conexión con el servidor', severity: 'error' });
    }
  };

  const columns = [
    {
      field: 'image_url',
      headerName: 'Foto',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Box
          component="img"
          src={getProductImageUrl(params.value)}
          alt=""
          sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: 'cover' }}
        />
      ),
    },
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 180 },
    {
      field: 'category_id',
      headerName: 'Categoría',
      width: 130,
      renderCell: (params) => CAT_NAME_MAP[params.value] || '—',
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box
          sx={{
            bgcolor: params.value > 10 ? 'rgba(27, 138, 46, 0.1)' : 'rgba(217, 119, 6, 0.1)',
            color: params.value > 10 ? '#1b8a2e' : '#d97706',
            px: 1.5,
            py: 0.3,
            borderRadius: 1.5,
            fontWeight: 600,
            fontSize: '0.8rem',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'price',
      headerName: 'Precio',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'offer_price',
      headerName: 'Oferta',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => params.value ? (
        <Typography variant="body2" fontWeight={700} color="error.main">
          {formatCurrency(params.value)}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.disabled">—</Typography>
      ),
    },
    ...(isAdmin ? [{
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleOpenEdit(params.row)}
            sx={{ bgcolor: 'rgba(232, 93, 4, 0.08)', '&:hover': { bgcolor: 'rgba(232, 93, 4, 0.16)' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.id)}
            sx={{ bgcolor: 'rgba(220, 38, 38, 0.08)', '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.16)' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    }] : []),
  ];

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Productos</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona tu inventario de productos
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenNew}>
            Nuevo Producto
          </Button>
        )}
      </Box>

      <Paper sx={{ width: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <DataGrid
          rows={products}
          columns={columns}
          loading={loading}
          pageSizeOptions={[15, 30, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
          autoHeight
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: 'No hay productos registrados. Crea el primero.',
            footerTotalRows: 'Total de productos:',
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8f9fa',
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'rgba(232, 93, 4, 0.04)',
            },
          }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
          {editId ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre del producto"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Descripción"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            select
            label="Categoría"
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            margin="normal"
            required
          >
            {CATEGORIAS.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Precio (S/)"
            name="precio"
            type="number"
            value={form.precio}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0, step: 0.01 }}
            required
          />
          <TextField
            fullWidth
            label="Precio de Oferta (S/) — opcional"
            name="precio_oferta"
            type="number"
            value={form.precio_oferta}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0, step: 0.01 }}
            helperText="Si tiene oferta, este precio se mostrará con descuento"
          />
          <TextField
            fullWidth
            label="Stock"
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0 }}
            required
          />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
            Imagen del Producto
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              sx={{ py: 1.5, px: 2, flexShrink: 0 }}
            >
              {uploading ? 'Subiendo...' : 'Subir Foto'}
            </Button>
            <TextField
              fullWidth
              label="O pega una URL"
              name="imagen"
              value={form.imagen}
              onChange={handleChange}
              size="small"
              placeholder="/images/products/nombre.jpg"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </Box>
          {form.imagen && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Vista previa:</Typography>
              <Box
                component="img"
                src={getProductImageUrl(form.imagen)}
                alt="preview"
                sx={{
                  width: 80, height: 80, borderRadius: 2,
                  objectFit: 'cover', border: '1px solid',
                  borderColor: 'divider',
                }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {editId ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
