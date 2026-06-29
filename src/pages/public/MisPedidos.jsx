import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, Chip, Button, Snackbar, Alert,
} from '@mui/material';
import {
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const statusSteps = {
  pendiente: 0,
  confirmado: 0,
  enviado: 1,
  entregado: 2,
};

const statusIcons = {
  pendiente: '⏳',
  confirmado: '✅',
  enviado: '🚚',
  entregado: '📦',
  cancelado: '❌',
};

const statusColors = {
  pendiente: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
  confirmado: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
  enviado: { color: '#e85d04', bg: 'rgba(232, 93, 4, 0.1)' },
  entregado: { color: '#1b8a2e', bg: 'rgba(27, 138, 46, 0.1)' },
  cancelado: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
};

const statusLabels = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function MisPedidos() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders?user_id=${user.id}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user]);

  const handleCancel = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelado' }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelado' } : o));
      setSnack({ open: true, msg: 'Pedido cancelado.', severity: 'info' });
    } catch {
      setSnack({ open: true, msg: 'Error al cancelar el pedido.', severity: 'error' });
    }
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" fontWeight={700}>Inicia sesión para ver tus pedidos</Typography>
      </Box>
    );
  }

  return (
    <>
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      <Typography variant="h3" fontWeight={800} letterSpacing="-0.5px" gutterBottom>
        Mis Pedidos
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Seguimiento de tus compras y entregas
      </Typography>

      {orders.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <LocalShippingIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary">No tienes pedidos aún.</Typography>
          <Typography variant="body2" color="text.secondary">Tus compras aparecerán aquí.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => {
            const step = statusSteps[order.status] ?? 0;
            const isCancelled = order.status === 'cancelado';
            const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);

            return (
              <Grid item xs={12} key={order.id}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ p: 3, pb: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          Pedido #{order.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.created_at)} &middot; {totalItems} producto{totalItems !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" fontWeight={800} color="primary.main">
                          {formatCurrency(order.total_amount)}
                        </Typography>
                        <Chip
                          icon={<span>{statusIcons[order.status]}</span>}
                          label={statusLabels[order.status] || order.status}
                          size="small"
                          sx={{
                            mt: 0.5, fontWeight: 600,
                            color: statusColors[order.status]?.color,
                            bgcolor: statusColors[order.status]?.bg,
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Delivery: {order.delivery_cost > 0 ? formatCurrency(order.delivery_cost) : 'Gratis'}
                      </Typography>
                      {order.delivery_address && (
                        <Typography variant="body2" color="text.secondary">
                          {order.delivery_address}
                        </Typography>
                      )}
                    </Box>

                    {order.items && order.items.length > 0 && (
                      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, pb: 2 }}>
                        {order.items.map((item, i) => (
                          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">{item.product_name} x{item.quantity}</Typography>
                            <Typography variant="body2" fontWeight={600}>{formatCurrency(item.subtotal)}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {order.status === 'pendiente' && (
                      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, pb: 2, textAlign: 'right' }}>
                        <Button color="error" variant="outlined" size="small" onClick={() => handleCancel(order.id)}>
                          Cancelar Pedido
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      </Box>

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </>
  );
}
