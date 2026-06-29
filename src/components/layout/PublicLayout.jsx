import { useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Badge,
  Avatar, Menu, MenuItem, Divider,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon, Storefront as StorefrontIcon,
  Person as PersonIcon, Logout as LogoutIcon, Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../utils/constants';

function PublicNavbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'primary.main',
        color: '#fff',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          <StorefrontIcon sx={{ color: '#fff', fontSize: 28 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: '#fff',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              fontSize: '1.2rem',
            }}
          >
            {APP_NAME}
          </Typography>

          <Button
            component={RouterLink}
            to="/"
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 500,
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Catálogo
          </Button>

          <IconButton
            component={RouterLink}
            to="/carrito"
            sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { color: '#fff' } }}
          >
            <Badge badgeContent={totalItems} color="warning" sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}>
              <ShoppingCartIcon />
            </Badge>
          </IconButton>

          {user ? (
            <>
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                size="small"
                sx={{ border: '2px solid rgba(255,255,255,0.4)', '&:hover': { borderColor: '#fff' } }}
              >
                <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: 700 }}>
                  {user.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ sx: { borderRadius: 3, mt: 1, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
                {user.role === 'admin' || user.role === 'empleado' ? (
                  <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin'); }} sx={{ py: 1.5 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1.5 }} /> Panel Admin
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem onClick={() => { setAnchorEl(null); navigate('/mis-pedidos'); }} sx={{ py: 1.5 }}>
                      <ReceiptIcon fontSize="small" sx={{ mr: 1.5 }} /> Mis Pedidos
                    </MenuItem>
                    <MenuItem onClick={() => { setAnchorEl(null); navigate('/perfil'); }} sx={{ py: 1.5 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1.5 }} /> Mi Perfil
                    </MenuItem>
                  </>
                )}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} /> Cerrar Sesión
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="small"
              sx={{ ml: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', color: '#fff', '&:hover': { borderColor: '#fff', borderWidth: 2 } }}
            >
              Ingresar
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}

function PublicFooter() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'secondary.main',
        color: 'rgba(255,255,255,0.7)',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' },
            gap: 4,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <StorefrontIcon sx={{ color: 'primary.light' }} />
              <Typography variant="h6" fontWeight={700} color="primary.light">
                {APP_NAME}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ maxWidth: 260 }}>
              Tu tienda de confianza con los mejores productos al mejor precio.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="primary.light" gutterBottom>
              Contacto
            </Typography>
            <Typography variant="body2">Av. Principal 123 — Lima, Perú</Typography>
            <Typography variant="body2">contacto@petermarket.pe</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="primary.light" gutterBottom>
              Horarios
            </Typography>
            <Typography variant="body2">Lun — Sáb: 8:00 am — 9:00 pm</Typography>
            <Typography variant="body2">Dom: 9:00 am — 6:00 pm</Typography>
          </Box>
        </Box>
        <Typography
          variant="body2"
          align="center"
          sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          &copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
        </Typography>
      </Container>
    </Box>
  );
}

export default function PublicLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavbar />
      <Box component="main" sx={{ flexGrow: 1, animation: 'fadeIn 0.4s ease' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
      <PublicFooter />
    </Box>
  );
}
