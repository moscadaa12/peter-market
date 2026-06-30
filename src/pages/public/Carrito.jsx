import { useState } from 'react';
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Box, Divider, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Snackbar, Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon, Add as AddIcon, Remove as RemoveIcon,
  LocalShipping as LocalShippingIcon, CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import api from '../../api/axios';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';

const DELIVERY_THRESHOLD = 45;

export default function Carrito() {
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [address, setAddress] = useState('Av. Principal 456, Lima');

  const deliveryFree = totalPrice >= DELIVERY_THRESHOLD;
  const deliveryCost = deliveryFree ? 0 : 5;
  const finalTotal = totalPrice + deliveryCost;
  const missingForFree = DELIVERY_THRESHOLD - totalPrice;

  const handleCheckout = async () => {
    try {
      const body = {
        user_id: user?.id || null,
        user_name: user?.name || 'Cliente',
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        delivery_address: address,
        delivery_cost: deliveryFree ? 0 : deliveryCost,
      };
      await api.post('/orders', body);
      setCheckoutOpen(false);
      clearCart();
      setSnackbar({ open: true, message: '¡Compra realizada con éxito! Recibirás tu pedido pronto.' });
    } catch {
      setSnackbar({ open: true, message: 'Error al procesar el pedido.' });
    }
  };

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10, animation: 'fadeInUp 0.5s ease' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Tu carrito está vacío
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Agrega productos desde el catálogo para empezar tu compra.
        </Typography>
        {snackbar.open && (
          <Alert icon={<CheckCircleIcon />} severity="success" sx={{ maxWidth: 400, mx: 'auto', borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      <Typography variant="h3" fontWeight={800} letterSpacing="-0.5px" gutterBottom>
        Carrito de Compras
      </Typography>

      {!deliveryFree && totalPrice > 0 && (
        <Alert
          icon={<LocalShippingIcon />}
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
        >
          Agrega <strong>{formatCurrency(missingForFree)}</strong> más para obtener <strong>delivery gratis</strong>.
        </Alert>
      )}

      {deliveryFree && totalPrice > 0 && (
        <Alert
          icon={<LocalShippingIcon />}
          severity="success"
          sx={{ mb: 3, borderRadius: 2 }}
        >
          ¡Tienes <strong>delivery gratis</strong> por compras mayores a {formatCurrency(DELIVERY_THRESHOLD)}!
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Producto</TableCell>
              <TableCell align="center">Cantidad</TableCell>
              <TableCell align="right">Precio Unit.</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell align="center" sx={{ pr: 3 }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ pl: 3, fontWeight: 600 }}>{item.name}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 0.5 }}>
                    <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)} sx={{ color: 'text.secondary' }}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                      {item.quantity}
                    </Typography>
                    <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)} sx={{ color: 'text.secondary' }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 500 }}>{formatCurrency(item.price)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.price * item.quantity)}</TableCell>
                <TableCell align="center" sx={{ pr: 3 }}>
                  <IconButton color="error" size="small" onClick={() => removeFromCart(item.id)}
                    sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.16)' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper elevation={0} sx={{ mt: 3, p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Subtotal ({totalItems} productos)</Typography>
            <Typography variant="body2" fontWeight={600}>{formatCurrency(totalPrice)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Delivery
              {!deliveryFree && totalPrice > 0 && (
                <Chip label={`Faltan ${formatCurrency(missingForFree)}`} size="small" color="warning" sx={{ ml: 1, fontWeight: 600 }} />
              )}
            </Typography>
            <Typography variant="body2" fontWeight={600} color={deliveryFree ? 'success.main' : 'text.secondary'}>
              {deliveryFree ? 'Gratis' : formatCurrency(deliveryCost)}
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={700}>Total</Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">{formatCurrency(finalTotal)}</Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          sx={{ py: 1.5 }}
          onClick={() => setCheckoutOpen(true)}
        >
          Ir a Pagar
        </Button>
      </Paper>

      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Compra</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Productos</Typography>
              <Typography fontWeight={600}>{totalItems} ítems</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography fontWeight={600}>{formatCurrency(totalPrice)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Delivery</Typography>
              <Typography fontWeight={600}>{deliveryFree ? 'Gratis' : formatCurrency(deliveryCost)}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>Total</Typography>
              <Typography variant="h6" fontWeight={800} color="primary.main">{formatCurrency(finalTotal)}</Typography>
            </Box>
            <TextField
              label="Dirección de entrega"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              multiline
              rows={2}
              fullWidth
              margin="normal"
            />
            {!user && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Inicia sesión para ver el seguimiento de tu pedido.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCheckout}>
            Confirmar Pago — {formatCurrency(finalTotal)}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
