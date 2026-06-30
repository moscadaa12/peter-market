import { useState, useEffect } from 'react';
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, IconButton, Menu, MenuItem, Snackbar, Alert,
} from '@mui/material';
import { MoreVert as MoreVertIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import api from '../../api/axios';
import { formatDate, formatCurrency } from '../../utils/helpers';

const STATUS_FLOW = ['pendiente', 'confirmado', 'enviado', 'entregado'];

const statusColors = {
  pendiente:   { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
  confirmado:  { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
  enviado:     { color: '#e85d04', bg: 'rgba(232, 93, 4, 0.1)' },
  entregado:   { color: '#1b8a2e', bg: 'rgba(27, 138, 46, 0.1)' },
  cancelado:   { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
};

const statusLabels = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function Pedidos() {
  const [orders, setOrders] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const fetchOrders = () => {
    api.get('/orders')
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));
  };

  useEffect(() => { fetchOrders() }, []);

  const handleStatusClick = (order, e) => {
    setSelectedOrder(order);
    setAnchorEl(e.currentTarget);
  };

  const handleStatusChange = async (newStatus) => {
    setAnchorEl(null);
    if (!selectedOrder) return;
    try {
      await api.put(`/orders/${selectedOrder.id}/status`, { status: newStatus });
      fetchOrders();
      setSnack({ open: true, msg: `Pedido #${selectedOrder.id} marcado como "${statusLabels[newStatus]}".`, severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Error al actualizar el estado.', severity: 'error' });
    }
  };

  const getAvailableStatuses = (current) => {
    if (current === 'cancelado' || current === 'entregado') return [];
    const idx = STATUS_FLOW.indexOf(current);
    const next = STATUS_FLOW.slice(idx + 1);
    return [...next, 'cancelado'];
  };

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Pedidos</Typography>
        <Typography variant="body2" color="text.secondary">
          Administra los pedidos de tus clientes
        </Typography>
      </Box>

      {orders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <ShoppingCartIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay pedidos registrados.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Los pedidos aparecerán aquí cuando los clientes realicen compras.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3 }}>#</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ pl: 3, fontWeight: 600 }}>{order.id}</TableCell>
                  <TableCell>{order.user_name || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Chip
                        label={statusLabels[order.status] || order.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          color: statusColors[order.status]?.color || '#6b7280',
                          bgcolor: statusColors[order.status]?.bg || 'rgba(107, 114, 128, 0.1)',
                        }}
                      />
                      {getAvailableStatuses(order.status).length > 0 && (
                        <>
                          <IconButton size="small" onClick={(e) => handleStatusClick(order, e)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    {formatDate(order.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {selectedOrder && getAvailableStatuses(selectedOrder.status).map((s) => (
          <MenuItem key={s} onClick={() => handleStatusChange(s)} sx={{ py: 1 }}>
            {statusLabels[s] || s}
          </MenuItem>
        ))}
      </Menu>

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
