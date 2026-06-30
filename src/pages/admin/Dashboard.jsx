import { useState, useEffect } from 'react';
import {
  Typography, Grid, Card, CardContent, Box, Skeleton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon, AttachMoney as AttachMoneyIcon,
  LocalShipping as LocalShippingIcon, TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon, Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/helpers';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const summaryDefs = [
  { label: 'Ventas Hoy', key: 'ventasHoy', icon: <ShoppingCartIcon />, color: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)' },
  { label: 'Ingresos Totales', key: 'ingresosTotales', icon: <AttachMoneyIcon />, color: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)', currency: true },
  { label: 'Pedidos Activos', key: 'pedidosActivos', icon: <LocalShippingIcon />, color: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)' },
  { label: 'Productos Vendidos', key: 'productosVendidos', icon: <TrendingUpIcon />, color: '#9c27b0', bg: 'rgba(156, 39, 176, 0.1)' },
  { label: 'Total Pedidos', key: 'totalPedidos', icon: <ReceiptIcon />, color: '#ef6c00', bg: 'rgba(239, 108, 0, 0.1)' },
  { label: 'Promedio x Pedido', key: 'promedioPedido', icon: <AssessmentIcon />, color: '#00acc1', bg: 'rgba(0, 172, 193, 0.1)', currency: true },
];

const statusColors = {
  pendiente: '#d97706',
  confirmado: '#2563eb',
  enviado: '#e85d04',
  entregado: '#1b8a2e',
  cancelado: '#dc2626',
};

const statusLabels = {
  pendiente: 'Pendiente', confirmado: 'Confirmado', enviado: 'Enviado',
  entregado: 'Entregado', cancelado: 'Cancelado',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary').then((r) => r.data),
      api.get('/dashboard/sales-by-month').then((r) => r.data),
      api.get('/dashboard/recent-orders').then((r) => r.data),
    ]).then(([s, m, o]) => {
      setSummary(s && typeof s === 'object' ? s : null);
      setMonthlySales(Array.isArray(m) ? m : []);
      setRecentOrders(Array.isArray(o) ? o : []);
    }).catch(() => {
      setSummary(null);
      setMonthlySales([]);
      setRecentOrders([]);
    }).finally(() => setLoading(false));
  }, []);

  const summaryCards = summary ? summaryDefs.map((def) => {
    let value;
    if (def.key === 'promedioPedido') {
      value = summary.totalPedidos > 0
        ? (summary.ingresosTotales / summary.totalPedidos)
        : 0;
    } else {
      value = summary[def.key];
    }
    return { label: def.label, value, icon: def.icon, color: def.color, bg: def.bg, currency: def.currency };
  }) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 2, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={700}>{MONTHS[label - 1]}</Typography>
          {payload.map((entry, i) => (
            <Typography key={i} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Monto' ? formatCurrency(entry.value) : entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Bienvenido, {user?.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Resumen general del negocio
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <Card
              sx={{
                animation: `fadeInUp 0.5s ease ${index * 0.08}s both`,
                '&:hover': {
                  '& .stat-icon': { transform: 'scale(1.1) rotate(4deg)' },
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                },
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  className="stat-icon"
                  sx={{
                    width: 52, height: 52, borderRadius: 3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: card.bg, color: card.color,
                    transition: 'transform 0.3s ease',
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {card.label}
                  </Typography>
                  {loading ? (
                    <Skeleton width={80} height={32} />
                  ) : (
                    <Typography variant="h5" fontWeight={800}>
                      {card.currency ? formatCurrency(card.value) : card.value}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Ventas Mensuales
          </Typography>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            {loading ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="mes" tickFormatter={(m) => MONTHS[m - 1]} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" name="Monto" fill="#ef6c00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Pedidos por Mes
          </Typography>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            {loading ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="mes" tickFormatter={(m) => MONTHS[m - 1]} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pedidos" name="Pedidos" fill="#2196f3" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        Pedidos Recientes
      </Typography>
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No hay pedidos aún.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : recentOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.user_name}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[order.status] || order.status}
                        size="small"
                        sx={{
                          fontWeight: 600, color: statusColors[order.status],
                          bgcolor: `${statusColors[order.status]}15`,
                        }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
