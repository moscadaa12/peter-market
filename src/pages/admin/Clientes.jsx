import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Avatar, Grid, Card, CardContent,
} from '@mui/material';
import {
  People as PeopleIcon, ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon, LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';

const clientOrders = {
  3: { orders: 8, total: 1560.50, delivered: 6 },
  4: { orders: 3, total: 345.00, delivered: 2 },
  5: { orders: 0, total: 0, delivered: 0 },
  6: { orders: 12, total: 2890.00, delivered: 10 },
};

export default function Clientes() {
  const { getAllUsers } = useAuth();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const all = getAllUsers();
    setClients(all.filter((u) => u.role === 'cliente'));
  }, [getAllUsers]);

  const totalClients = clients.length;
  const totalOrders = clients.reduce((sum, c) => sum + (clientOrders[c.id]?.orders || 0), 0);
  const totalSpent = clients.reduce((sum, c) => sum + (clientOrders[c.id]?.total || 0), 0);
  const activeClients = clients.filter((c) => (clientOrders[c.id]?.orders || 0) > 0).length;

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Clientes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {totalClients} cliente{totalClients !== 1 ? 's' : ''} registrado{totalClients !== 1 ? 's' : ''}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Clientes Registrados', value: totalClients, icon: <PeopleIcon />, color: '#ef6c00', bg: 'rgba(239, 108, 0, 0.1)' },
          { label: 'Clientes Activos', value: activeClients, icon: <ShoppingCartIcon />, color: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)' },
          { label: 'Total Pedidos', value: totalOrders, icon: <LocalShippingIcon />, color: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)' },
          { label: 'Gasto Total', value: formatCurrency(totalSpent), icon: <AttachMoneyIcon />, color: '#9c27b0', bg: 'rgba(156, 39, 176, 0.1)' },
        ].map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card sx={{ animation: `fadeInUp 0.5s ease ${i * 0.08}s both` }}>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: card.bg, color: card.color, flexShrink: 0 }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>{card.label}</Typography>
                  <Typography variant="h5" fontWeight={800}>{card.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Cliente</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell align="center">Pedidos</TableCell>
              <TableCell align="center">Entregados</TableCell>
              <TableCell align="right" sx={{ pr: 3 }}>Gasto Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No hay clientes registrados aún.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => {
                const stats = clientOrders[c.id] || { orders: 0, total: 0, delivered: 0 };
                return (
                  <TableRow key={c.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ pl: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                          {c.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Typography fontWeight={600}>{c.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell align="center">
                      <Chip label={stats.orders} size="small" color={stats.orders > 0 ? 'primary' : 'default'} variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={600} color={stats.delivered > 0 ? 'success.main' : 'text.secondary'}>
                        {stats.delivered}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 3, fontWeight: 700 }}>
                      {formatCurrency(stats.total)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
