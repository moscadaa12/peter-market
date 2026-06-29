import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Avatar, IconButton, Menu, MenuItem, Divider,
} from '@mui/material';
import { useState } from 'react';
import {
  Dashboard as DashboardIcon, Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon, Storefront as StorefrontIcon,
  People as PeopleIcon, Person as PersonIcon, Logout as LogoutIcon,
  Group as GroupIcon, Category as CategoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../utils/constants';

const DRAWER_WIDTH = 260;

const menuItemsByRole = {
  admin: [
    { label: 'Dashboard',   icon: <DashboardIcon />,   path: '/admin' },
    { label: 'Productos',   icon: <InventoryIcon />,   path: '/admin/productos' },
    { label: 'Pedidos',     icon: <ShoppingCartIcon />, path: '/admin/pedidos' },
    { label: 'Categorías',  icon: <CategoryIcon />,    path: '/admin/categorias' },
    { label: 'Usuarios',    icon: <PeopleIcon />,      path: '/admin/usuarios' },
    { label: 'Clientes',    icon: <GroupIcon />,       path: '/admin/clientes' },
    { label: 'Mi Perfil',   icon: <PersonIcon />,      path: '/admin/perfil' },
  ],
  empleado: [
    { label: 'Dashboard',   icon: <DashboardIcon />,   path: '/admin' },
    { label: 'Productos',   icon: <InventoryIcon />,   path: '/admin/productos' },
    { label: 'Pedidos',     icon: <ShoppingCartIcon />, path: '/admin/pedidos' },
    { label: 'Categorías',  icon: <CategoryIcon />,    path: '/admin/categorias' },
    { label: 'Clientes',    icon: <GroupIcon />,       path: '/admin/clientes' },
    { label: 'Mi Perfil',   icon: <PersonIcon />,      path: '/admin/perfil' },
  ],
};

function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
        bgcolor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.3px' }}>
          <Box component="span" sx={{ color: 'primary.main' }}>{APP_NAME}</Box> — Administración
        </Typography>
        <Typography variant="body2" sx={{ mr: 1.5, color: 'text.secondary' }}>
          {user?.name}
        </Typography>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ border: '2px solid', borderColor: 'divider' }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.9rem', fontWeight: 700 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { borderRadius: 3, mt: 1, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
        >
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/'); }} sx={{ py: 1.5 }}>
            <StorefrontIcon fontSize="small" sx={{ mr: 1.5 }} /> Ir a la Tienda
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} /> Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const adminMenuItems = menuItemsByRole[user?.role] || menuItemsByRole.admin;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'secondary.main',
          color: 'rgba(255,255,255,0.7)',
          borderRight: 'none',
        },
      }}
    >
      <Toolbar sx={{ bgcolor: 'primary.main', color: '#fff', gap: 1 }}>
        <StorefrontIcon sx={{ fontSize: 28 }} />
        <Typography variant="h6" noWrap fontWeight={800} letterSpacing="-0.5px">
          {APP_NAME}
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ px: 1.5, mt: 1 }}>
        {adminMenuItems.map((item) => {
          const selected = item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: '#fff' },
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.06)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}

export default function AdminLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <Box sx={{ flexGrow: 1 }}>
        <AdminHeader />
        <Box
          component="main"
          sx={{
            p: 3,
            mt: 8,
            animation: 'fadeIn 0.4s ease',
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
