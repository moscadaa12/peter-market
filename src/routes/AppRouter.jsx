import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Páginas públicas
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Catalogo from '../pages/public/Catalogo';
import Carrito from '../pages/public/Carrito';
import MisPedidos from '../pages/public/MisPedidos';
import PerfilCliente from '../pages/public/PerfilCliente';

// Páginas del panel admin
import Dashboard from '../pages/admin/Dashboard';
import Productos from '../pages/admin/Productos';
import Pedidos from '../pages/admin/Pedidos';
import Usuarios from '../pages/admin/Usuarios';
import Clientes from '../pages/admin/Clientes';
import Categorias from '../pages/admin/Categorias';
import Perfil from '../pages/admin/Perfil';

export default function AppRouter() {
  return (
    <Routes>
      {/* ============================================ */}
      {/* RUTAS PÚBLICAS — Layout público (Navbar + Footer) */}
      {/* ============================================ */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Catalogo />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/perfil" element={<PerfilCliente />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ============================================ */}
      {/* RUTAS PRIVADAS — Layout admin (Sidebar + Header) */}
      {/* ============================================ */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'empleado']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<Productos />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="usuarios" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Usuarios />
          </ProtectedRoute>
        } />
        <Route path="clientes" element={<Clientes />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      {/* Catch-all: redirigir a la raíz */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
